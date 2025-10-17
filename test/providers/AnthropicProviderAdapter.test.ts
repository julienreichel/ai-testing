import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProviderAdapter } from "../../src/providers/AnthropicProviderAdapter";
import type {
  ProviderConfig,
  ProviderRequest,
} from "../../src/types/providers";

const mockConfig: ProviderConfig = {
  id: "anthropic-test",
  name: "Anthropic Test",
  apiKey: "sk-ant-test123",
  isActive: true,
};

const mockRequest: ProviderRequest = {
  model: "claude-sonnet-4-5",
  messages: [{ role: "user", content: "Hello, how are you?" }],
  temperature: 0.7,
  maxTokens: 100,
};

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AnthropicProviderAdapter - Provider Implementation", () => {
  let provider: AnthropicProviderAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProviderAdapter(mockConfig);
  });

  describe("When developers configure the provider", () => {
    it("should return all supported Claude models", () => {
      const models = provider.getModels();

      expect(models).toHaveLength(6);
      expect(models.map((m) => m.id)).toEqual([
        "claude-sonnet-4-0",
        "claude-opus-4-1",
        "claude-opus-4-0",
        "claude-sonnet-4-5",
        "claude-3-7-sonnet-latest",
        "claude-3-5-haiku-latest",
      ]);
    });

    it("should provide accurate pricing for all models", () => {
      const testCases = [
        {
          model: "claude-sonnet-4-5",
          expectedInput: 0.003,
          expectedOutput: 0.015,
        },
        {
          model: "claude-opus-4-1",
          expectedInput: 0.015,
          expectedOutput: 0.075,
        },
        {
          model: "claude-3-5-haiku-latest",
          expectedInput: 0.0008,
          expectedOutput: 0.004,
        },
      ];

      testCases.forEach(({ model, expectedInput, expectedOutput }) => {
        const pricing = provider.getPricing(model);
        expect(pricing).not.toBeNull();
        expect(pricing!.inputTokensPer1K).toBe(expectedInput);
        expect(pricing!.outputTokensPer1K).toBe(expectedOutput);
      });
    });

    it("should validate configuration correctly", () => {
      expect(provider.validateConfig()).toBe(true);

      const invalidProvider = new AnthropicProviderAdapter({
        ...mockConfig,
        apiKey: "",
      });
      expect(invalidProvider.validateConfig()).toBe(false);
    });
  });

  describe("When developers make API calls", () => {
    it("should make successful API call with proper Claude format", async () => {
      const mockResponse = {
        id: "msg_test123",
        content: [
          {
            text: "Hello! I'm doing well, thank you for asking.",
            type: "text",
          },
        ],
        usage: {
          input_tokens: 12,
          output_tokens: 15,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.call(mockRequest);

      expect(result.content).toBe(
        "Hello! I'm doing well, thank you for asking.",
      );
      expect(result.model).toBe("claude-sonnet-4-5");
      expect(result.usage.inputTokens).toBe(12);
      expect(result.usage.outputTokens).toBe(15);
      expect(result.usage.totalTokens).toBe(27);

      // Verify cost calculation
      expect(result.cost.inputCost).toBe(0.000036); // 12/1000 * 0.003
      expect(result.cost.outputCost).toBe(0.000225); // 15/1000 * 0.015
      expect(result.cost.totalCost).toBe(0.000261);
    });

    it("should handle system prompts correctly", async () => {
      const requestWithSystem: ProviderRequest = {
        ...mockRequest,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello!" },
        ],
      };

      const mockResponse = {
        id: "msg_test123",
        content: [{ text: "Hello!", type: "text" }],
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await provider.call(requestWithSystem);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall).toBeDefined();
      const requestBody = JSON.parse(fetchCall![1].body);

      expect(requestBody.system).toBe("You are a helpful assistant.");
      expect(requestBody.messages).toHaveLength(1);
      expect(requestBody.messages[0].content).toBe("Hello!");
    });

    it("should handle API errors appropriately", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Invalid API key"),
      });

      await expect(provider.call(mockRequest)).rejects.toThrow();
    });

    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network error") as Error & {
        code?: string;
      };
      networkError.code = "ECONNREFUSED";

      mockFetch.mockRejectedValueOnce(networkError);

      await expect(provider.call(mockRequest)).rejects.toThrow();
    });
  });

  describe("When developers need cost estimation", () => {
    it("should calculate costs correctly for different models", () => {
      const testCases = [
        {
          model: "claude-sonnet-4-5",
          inputTokens: 1000,
          outputTokens: 500,
          expectedTotal: 0.0105, // (1000/1000 * 0.003) + (500/1000 * 0.015)
        },
        {
          model: "claude-opus-4-1",
          inputTokens: 2000,
          outputTokens: 1000,
          expectedTotal: 0.105, // (2000/1000 * 0.015) + (1000/1000 * 0.075)
        },
      ];

      testCases.forEach(
        ({ model, inputTokens, outputTokens, expectedTotal }) => {
          const cost = provider.estimateCost(inputTokens, outputTokens, model);
          expect(cost).toBeCloseTo(expectedTotal, 6);
        },
      );
    });
  });

  describe("Error handling scenarios", () => {
    it("should handle missing API key", async () => {
      const noKeyProvider = new AnthropicProviderAdapter({
        ...mockConfig,
        apiKey: undefined,
      });

      await expect(noKeyProvider.call(mockRequest)).rejects.toThrow();
    });

    it("should handle invalid model gracefully", () => {
      const pricing = provider.getPricing("invalid-model");
      expect(pricing).toBeNull();
    });
  });
});
