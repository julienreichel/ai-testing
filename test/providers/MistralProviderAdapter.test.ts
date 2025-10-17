import { describe, it, expect, vi, beforeEach } from "vitest";
import { MistralProviderAdapter } from "../../src/providers/MistralProviderAdapter";
import type {
  ProviderConfig,
  ProviderRequest,
} from "../../src/types/providers";

const mockConfig: ProviderConfig = {
  id: "mistral-test",
  name: "Mistral Test",
  apiKey: "sk-mistral-test123",
  isActive: true,
};

const mockRequest: ProviderRequest = {
  model: "mistral-medium-latest",
  messages: [{ role: "user", content: "Hello, how are you?" }],
  temperature: 0.7,
  maxTokens: 100,
};

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MistralProviderAdapter - Provider Implementation", () => {
  let provider: MistralProviderAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MistralProviderAdapter(mockConfig);
  });

  describe("When developers configure the provider", () => {
    it("should return all supported Mistral models", () => {
      const models = provider.getModels();

      expect(models).toHaveLength(6);
      expect(models.map((m) => m.id)).toEqual([
        "mistral-medium-latest",
        "magistral-medium-latest",
        "codestral-latest",
        "mistral-small-latest",
        "ministral-8b-latest",
        "ministral-3b-latest",
      ]);
    });

    it("should provide accurate pricing for all models", () => {
      const testCases = [
        {
          model: "mistral-medium-latest",
          expectedInput: 0.0004,
          expectedOutput: 0.002,
        },
        {
          model: "magistral-medium-latest",
          expectedInput: 0.0005,
          expectedOutput: 0.005,
        },
        {
          model: "codestral-latest",
          expectedInput: 0.0004,
          expectedOutput: 0.002,
        },
        {
          model: "mistral-small-latest",
          expectedInput: 0.0001,
          expectedOutput: 0.0003,
        },
        {
          model: "ministral-8b-latest",
          expectedInput: 0.00004,
          expectedOutput: 0.00004,
        },
        {
          model: "ministral-3b-latest",
          expectedInput: 0.00004,
          expectedOutput: 0.00004,
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

      const invalidProvider = new MistralProviderAdapter({
        ...mockConfig,
        apiKey: "",
      });
      expect(invalidProvider.validateConfig()).toBe(false);
    });

    it("should provide model descriptions and context windows", () => {
      const models = provider.getModels();

      models.forEach((model) => {
        expect(model.name).toBeTruthy();
        expect(model.description).toBeTruthy();
        expect(model.contextWindow).toBe(128000);
        expect(model.maxOutputTokens).toBe(32000);
      });
    });
  });

  describe("When developers make API calls", () => {
    it("should make successful API call with proper Mistral format", async () => {
      const mockResponse = {
        id: "cmpl-test123",
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [
          {
            index: 0,
            message: {
              content: "Hello! I'm doing well, thank you for asking.",
              role: "assistant",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 15,
          total_tokens: 27,
        },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.call(mockRequest);

      expect(result.content).toBe(
        "Hello! I'm doing well, thank you for asking.",
      );
      expect(result.model).toBe("mistral-medium-latest");
      expect(result.usage.inputTokens).toBe(12);
      expect(result.usage.outputTokens).toBe(15);
      expect(result.usage.totalTokens).toBe(27);

      // Verify cost calculation
      expect(result.cost.inputCost).toBeCloseTo(0.0000048, 8); // 12/1000 * 0.0004
      expect(result.cost.outputCost).toBeCloseTo(0.00003, 8); // 15/1000 * 0.002
      expect(result.cost.totalCost).toBeCloseTo(0.0000348, 8);
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
        id: "cmpl-test123",
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [
          {
            index: 0,
            message: { content: "Hello!", role: "assistant" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await provider.call(requestWithSystem);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall).toBeDefined();
      const requestBody = JSON.parse(fetchCall![1].body);

      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[0].role).toBe("system");
      expect(requestBody.messages[0].content).toBe(
        "You are a helpful assistant.",
      );
      expect(requestBody.messages[1].role).toBe("user");
      expect(requestBody.messages[1].content).toBe("Hello!");
    });

    it("should handle separate system prompt parameter", async () => {
      const requestWithSystemPrompt: ProviderRequest = {
        ...mockRequest,
        systemPrompt: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Hello!" }],
      };

      const mockResponse = {
        id: "cmpl-test123",
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [
          {
            index: 0,
            message: { content: "Hello!", role: "assistant" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await provider.call(requestWithSystemPrompt);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall).toBeDefined();
      const requestBody = JSON.parse(fetchCall![1].body);

      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[0].role).toBe("system");
      expect(requestBody.messages[0].content).toBe(
        "You are a helpful assistant.",
      );
    });

    it("should make request with correct headers and URL", async () => {
      const mockResponse = {
        id: "cmpl-test123",
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [
          {
            index: 0,
            message: { content: "Test response", role: "assistant" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await provider.call(mockRequest);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall![0]).toBe("https://api.mistral.ai/v1/chat/completions");

      const options = fetchCall![1];
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["Authorization"]).toBe(
        "Bearer sk-mistral-test123",
      );
    });

    it("should handle API errors appropriately", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Invalid API key"),
      });

      await expect(provider.call(mockRequest)).rejects.toThrow();
    });

    it("should handle different HTTP error codes", async () => {
      const errorCases = [
        { status: 400, expectedType: "invalid_request" },
        { status: 401, expectedType: "auth" },
        { status: 429, expectedType: "rate_limit" },
        { status: 500, expectedType: "server_error" },
      ];

      for (const { status } of errorCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          text: () => Promise.resolve(`HTTP ${status} error`),
        });

        await expect(provider.call(mockRequest)).rejects.toThrow();
      }
    });

    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network error") as Error & {
        code?: string;
      };
      networkError.code = "ECONNREFUSED";

      mockFetch.mockRejectedValueOnce(networkError);

      await expect(provider.call(mockRequest)).rejects.toThrow();
    });

    it("should handle empty or malformed responses", async () => {
      const mockResponse = {
        id: "cmpl-test123",
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [],
        usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.call(mockRequest);
      expect(result.content).toBe("");
      expect(result.usage.outputTokens).toBe(0);
    });

    it("should handle complex content format with thinking sections (Magistral model)", async () => {
      const magistralRequest: ProviderRequest = {
        ...mockRequest,
        model: "magistral-medium-latest",
      };

      const mockResponse = {
        id: "cmpl-magistral-test123",
        object: "chat.completion",
        model: "magistral-medium-latest",
        choices: [
          {
            index: 0,
            message: {
              content: [
                {
                  type: "thinking",
                  thinking: [
                    {
                      type: "text",
                      text: "Ok, let's think about this. The country that touches both Germany and Spain is France. The capital of France is Paris.",
                    },
                  ],
                },
                {
                  type: "text",
                  text: "Paris",
                },
              ],
              role: "assistant",
            },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 30, total_tokens: 50 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.call(magistralRequest);

      // Should extract only the text content, ignoring thinking sections
      expect(result.content).toBe("Paris");
      expect(result.model).toBe("magistral-medium-latest");
      expect(result.usage.inputTokens).toBe(20);
      expect(result.usage.outputTokens).toBe(30);
      expect(result.usage.totalTokens).toBe(50);
    });
  });

  describe("When developers need cost estimation", () => {
    it("should calculate costs correctly for different models", () => {
      const testCases = [
        {
          model: "mistral-medium-latest",
          inputTokens: 1000,
          outputTokens: 500,
          expectedTotal: 0.0014, // (1000/1000 * 0.0004) + (500/1000 * 0.002)
        },
        {
          model: "magistral-medium-latest",
          inputTokens: 2000,
          outputTokens: 1000,
          expectedTotal: 0.006, // (2000/1000 * 0.0005) + (1000/1000 * 0.005)
        },
        {
          model: "ministral-3b-latest",
          inputTokens: 5000,
          outputTokens: 2000,
          expectedTotal: 0.00028, // (5000/1000 * 0.00004) + (2000/1000 * 0.00004)
        },
      ];

      testCases.forEach(
        ({ model, inputTokens, outputTokens, expectedTotal }) => {
          const cost = provider.estimateCost(inputTokens, outputTokens, model);
          expect(cost).toBeCloseTo(expectedTotal, 6);
        },
      );
    });

    it("should handle cost calculation when pricing is not available", () => {
      const cost = provider.estimateCost(1000, 500, "unknown-model");
      expect(cost).toBe(0);
    });
  });

  describe("Error handling scenarios", () => {
    it("should handle missing API key", async () => {
      const noKeyProvider = new MistralProviderAdapter({
        ...mockConfig,
        apiKey: undefined,
      });

      await expect(noKeyProvider.call(mockRequest)).rejects.toThrow();
    });

    it("should handle empty API key", async () => {
      const emptyKeyProvider = new MistralProviderAdapter({
        ...mockConfig,
        apiKey: "",
      });

      await expect(emptyKeyProvider.call(mockRequest)).rejects.toThrow();
    });

    it("should handle invalid model gracefully", () => {
      const pricing = provider.getPricing("invalid-model");
      expect(pricing).toBeNull();
    });
  });

  describe("Metadata and response handling", () => {
    it("should include correct metadata in response", async () => {
      const mockResponse = {
        id: "cmpl-specific-id",
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [
          {
            index: 0,
            message: { content: "Test", role: "assistant" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.call(mockRequest);

      expect(result.metadata.requestId).toBe("cmpl-specific-id");
      expect(result.metadata.provider).toBe("mistral");
      expect(result.metadata.latency).toBeGreaterThanOrEqual(0);
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    it("should generate fallback request ID when not provided", async () => {
      const mockResponse = {
        object: "chat.completion",
        model: "mistral-medium-latest",
        choices: [
          {
            index: 0,
            message: { content: "Test", role: "assistant" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        created: 1702256327,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.call(mockRequest);

      expect(result.metadata.requestId).toMatch(/^mistral-\d+$/);
    });
  });
});
