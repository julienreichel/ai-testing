import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GeminiProviderAdapter } from "../../src/providers/GeminiProviderAdapter";
import type { ProviderConfig, ProviderRequest } from "../../src/types/providers";

// Helper function to safely get request body from mock fetch call
function getRequestBody(mockFetch: ReturnType<typeof vi.fn>, callIndex = 0): Record<string, unknown> {
  const fetchCall = mockFetch.mock.calls[callIndex];
  expect(fetchCall).toBeDefined();
  if (!fetchCall) throw new Error("Fetch call not found");
  return JSON.parse(fetchCall[1].body) as Record<string, unknown>;
}

describe("GeminiProviderAdapter", () => {
  let provider: GeminiProviderAdapter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const config: ProviderConfig = {
      id: "gemini_test",
      name: "Test Gemini Provider",
      apiKey: "test-api-key-123",
      isActive: true,
    };
    provider = new GeminiProviderAdapter(config);

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Model Configuration", () => {
    it("should provide Gemini models", () => {
      const models = provider.getModels();

      expect(models).toHaveLength(5);
      
      // Check for key models
      const gemini25Pro = models.find((m) => m.id === "gemini-2.5-pro");
      expect(gemini25Pro).toBeDefined();
      expect(gemini25Pro?.name).toBe("Gemini 2.5 Pro");
      expect(gemini25Pro?.contextWindow).toBe(2000000);

      const gemini25Flash = models.find((m) => m.id === "gemini-2.5-flash");
      expect(gemini25Flash).toBeDefined();
      expect(gemini25Flash?.name).toBe("Gemini 2.5 Flash");
      expect(gemini25Flash?.contextWindow).toBe(1000000);

      const gemini20Flash = models.find((m) => m.id === "gemini-2.0-flash");
      expect(gemini20Flash).toBeDefined();
      expect(gemini20Flash?.name).toBe("Gemini 2.0 Flash");
    });

    it("should provide current Gemini pricing", () => {
      const pricingPro = provider.getPricing("gemini-2.5-pro");
      expect(pricingPro).toEqual({
        inputTokensPer1K: 1.25,
        outputTokensPer1K: 10.0,
      });

      const pricingFlash = provider.getPricing("gemini-2.5-flash");
      expect(pricingFlash).toEqual({
        inputTokensPer1K: 0.3,
        outputTokensPer1K: 2.5,
      });

      const pricingLite = provider.getPricing("gemini-2.5-flash-lite");
      expect(pricingLite).toEqual({
        inputTokensPer1K: 0.1,
        outputTokensPer1K: 0.4,
      });
    });

    it("should return null for unknown model pricing", () => {
      const pricing = provider.getPricing("unknown-model");
      expect(pricing).toBeNull();
    });
  });

  describe("Configuration Validation", () => {
    it("should validate API key requirement", () => {
      expect(provider.validateConfig()).toBe(true);

      const invalidProvider = new GeminiProviderAdapter({
        id: "test",
        name: "Test",
        isActive: true,
      });
      expect(invalidProvider.validateConfig()).toBe(false);

      const emptyKeyProvider = new GeminiProviderAdapter({
        id: "test",
        name: "Test",
        apiKey: "",
        isActive: true,
      });
      expect(emptyKeyProvider.validateConfig()).toBe(false);
    });
  });

  describe("API Calls", () => {
    it("should make successful API calls with correct request format", async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: "Hello! How can I help you today?" }],
                role: "model",
              },
              finishReason: "STOP",
              index: 0,
            },
          ],
          usageMetadata: {
            promptTokenCount: 8,
            candidatesTokenCount: 12,
            totalTokenCount: 20,
          },
          modelVersion: "gemini-2.5-flash-001",
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Hello!" }],
      };

      const response = await provider.call(request);

      expect(response).toMatchObject({
        content: "Hello! How can I help you today?",
        model: "gemini-2.5-flash",
        usage: {
          inputTokens: 8,
          outputTokens: 12,
          totalTokens: 20,
        },
        cost: {
          inputCost: expect.any(Number),
          outputCost: expect.any(Number),
          totalCost: expect.any(Number),
        },
        metadata: {
          latency: expect.any(Number),
          requestId: expect.stringMatching(/^gemini_/),
          provider: "Test Gemini Provider",
          timestamp: expect.any(Date),
        },
      });

      // Verify the API call was made correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining('"contents"'),
        }),
      );
    });

    it("should handle system prompts correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: "I am a helpful assistant." }],
                role: "model",
              },
              finishReason: "STOP",
              index: 0,
            },
          ],
          usageMetadata: {
            promptTokenCount: 15,
            candidatesTokenCount: 8,
            totalTokenCount: 23,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Who are you?" }],
        systemPrompt: "You are a helpful assistant.",
      };

      await provider.call(request);

      const requestBody = getRequestBody(mockFetch);

      expect(requestBody.systemInstruction).toEqual({
        role: "user",
        parts: [{ text: "You are a helpful assistant." }],
      });
    });

    it("should handle temperature and maxTokens parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: "Test response" }],
                role: "model",
              },
              finishReason: "STOP",
              index: 0,
            },
          ],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 3,
            totalTokenCount: 8,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
        maxTokens: 1500,
      };

      await provider.call(request);

      const requestBody = getRequestBody(mockFetch);

      const generationConfig = requestBody.generationConfig as Record<string, unknown>;
      expect(generationConfig.temperature).toBe(0.7);
      expect(generationConfig.maxOutputTokens).toBe(1500);
    });

    it("should convert message roles correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: "Response" }],
                role: "model",
              },
              finishReason: "STOP",
              index: 0,
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 2,
            totalTokenCount: 12,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
          { role: "user", content: "How are you?" },
        ],
      };

      await provider.call(request);

      const requestBody = getRequestBody(mockFetch);

      expect(requestBody.contents).toEqual([
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hi there!" }] },
        { role: "user", parts: [{ text: "How are you?" }] },
      ]);
    });

    it("should reject calls without valid API key", async () => {
      const invalidProvider = new GeminiProviderAdapter({
        id: "test",
        name: "Test",
        isActive: true,
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(invalidProvider.call(request)).rejects.toThrow(
        /API key is required/
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle HTTP errors correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({
          error: {
            message: "Invalid request format",
            code: 400,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow(
        /Invalid request format/
      );
    });

    it("should handle authentication errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({
          error: {
            message: "API key not valid",
            code: 401,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow();
    });

    it("should handle rate limiting errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: () => Promise.resolve({
          error: {
            message: "Rate limit exceeded",
            code: 429,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow();
    });

    it("should handle empty response candidates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 0,
            totalTokenCount: 5,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow(
        /No response candidates/
      );
    });

    it("should handle malformed response format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [],
                role: "model",
              },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 0,
            totalTokenCount: 5,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow(
        /Invalid response format/
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow();
    });

    it("should handle timeout errors", async () => {
      mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

      const request: ProviderRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(provider.call(request)).rejects.toThrow();
    });
  });

  describe("Cost Estimation", () => {
    it("should calculate costs correctly for different models", () => {
      const TOKENS_100 = 100;
      const TOKENS_50 = 50;

      // Test Gemini 2.5 Pro pricing
      const costPro = provider.estimateCost(TOKENS_100, TOKENS_50, "gemini-2.5-pro");
      const expectedPro = (TOKENS_100 / 1000) * 1.25 + (TOKENS_50 / 1000) * 10.0;
      expect(costPro).toBeCloseTo(expectedPro);

      // Test Gemini 2.5 Flash pricing
      const costFlash = provider.estimateCost(TOKENS_100, TOKENS_50, "gemini-2.5-flash");
      const expectedFlash = (TOKENS_100 / 1000) * 0.3 + (TOKENS_50 / 1000) * 2.5;
      expect(costFlash).toBeCloseTo(expectedFlash);

      // Test unknown model
      const costUnknown = provider.estimateCost(TOKENS_100, TOKENS_50, "unknown-model");
      expect(costUnknown).toBe(0);
    });

    it("should estimate tokens correctly", () => {
      const text = "This is a test message for token estimation";
      const tokens = provider.estimateTokens(text);

      // Should be roughly text.length / 4
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length);
      expect(tokens).toBeCloseTo(text.length / 4, 0);
    });
  });

  describe("Provider Utility Methods", () => {
    it("should update configuration", () => {
      provider.updateConfig({ name: "Updated Name" });
      expect(provider.getName()).toBe("Updated Name");
    });

    it("should return configuration", () => {
      const config = provider.getConfig();
      expect(config.id).toBe("gemini_test");
      expect(config.name).toBe("Test Gemini Provider");
    });

    it("should report active status correctly", () => {
      expect(provider.isActive()).toBe(true);

      provider.updateConfig({ isActive: false });
      expect(provider.isActive()).toBe(false);
    });
  });
});