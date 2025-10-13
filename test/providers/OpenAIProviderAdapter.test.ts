import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { OpenAIProviderAdapter } from "../../src/providers/OpenAIProviderAdapter";
import type { ProviderConfig, ProviderRequest } from "../../src/types/providers";

// Helper function to safely get request body from mock fetch call
function getRequestBody(mockFetch: ReturnType<typeof vi.fn>, callIndex = 0): Record<string, unknown> {
  const fetchCall = mockFetch.mock.calls[callIndex];
  expect(fetchCall).toBeDefined();
  if (!fetchCall) throw new Error("Fetch call not found");
  return JSON.parse(fetchCall[1].body) as Record<string, unknown>;
}

describe("OpenAIProviderAdapter - Temperature Restrictions", () => {
  let provider: OpenAIProviderAdapter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const config: ProviderConfig = {
      id: "openai_test",
      name: "Test OpenAI Provider",
      apiKey: "sk-test-key-123",
      isActive: true,
    };
    provider = new OpenAIProviderAdapter(config);

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Temperature Support", () => {
    it("should NOT include temperature parameter for GPT-5 nano model", async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: "Test response",
                role: "assistant",
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "test message" }],
        temperature: 0.7, // This should be ignored for gpt-5-nano
      };

      await provider.call(request);

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Get the request body that was sent
      const requestBody = getRequestBody(mockFetch);

      // Verify temperature is NOT included in the request
      expect(requestBody).not.toHaveProperty("temperature");
      expect(requestBody.model).toBe("gpt-5-nano");
      expect(requestBody.max_completion_tokens).toBeDefined();
    });

    it("should include temperature parameter for other models (e.g., GPT-4o)", async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: "Test response",
                role: "assistant",
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "test message" }],
        temperature: 0.7,
      };

      await provider.call(request);

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Get the request body that was sent
      const requestBody = getRequestBody(mockFetch);

      // Verify temperature IS included in the request for supported models
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.model).toBe("gpt-4o");
    });

    it("should not include temperature when undefined, even for supported models", async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: "Test response",
                role: "assistant",
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "test message" }],
        // temperature is undefined
      };

      await provider.call(request);

      // Get the request body that was sent
      const requestBody = getRequestBody(mockFetch);

      // Verify temperature is NOT included when undefined
      expect(requestBody).not.toHaveProperty("temperature");
    });

    it("should include temperature 0 when explicitly set to 0 for supported models", async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: "Test response",
                role: "assistant",
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "test message" }],
        temperature: 0, // Explicitly set to 0
      };

      await provider.call(request);

      // Get the request body that was sent
      const requestBody = getRequestBody(mockFetch);

      // Verify temperature 0 IS included
      expect(requestBody.temperature).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should prevent temperature errors by not sending temperature to restricted models", async () => {
      // Mock successful API response (no error because temperature is not sent)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: "Test response",
                role: "assistant",
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request: ProviderRequest = {
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "test message" }],
        temperature: 0.7, // This should be filtered out
      };

      // Since we filter out temperature for gpt-5-nano, this should succeed
      const response = await provider.call(request);
      expect(response).toBeDefined();
      expect(response.content).toBe("Test response");

      // Verify temperature was not sent in the request
      const requestBody = getRequestBody(mockFetch);
      expect(requestBody).not.toHaveProperty("temperature");
    });
  });

  describe("Request Body Structure", () => {
    it("should include all required fields except temperature for restricted models", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: "Test", role: "assistant" } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      });

      const request: ProviderRequest = {
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "test" }],
        temperature: 0.7,
        maxTokens: 1500,
        systemPrompt: "You are a helpful assistant",
      };

      await provider.call(request);

      const requestBody = getRequestBody(mockFetch);

      // Should include system message
      const messages = requestBody.messages as Array<{ role: string; content: string }>;
      expect(messages).toHaveLength(2);
      expect(messages[0]?.role).toBe("system");
      expect(messages[0]?.content).toBe("You are a helpful assistant");
      
      // Should include user message
      expect(messages[1]?.role).toBe("user");
      expect(messages[1]?.content).toBe("test");
      
      // Should include max tokens
      expect(requestBody.max_completion_tokens).toBe(1500);
      
      // Should NOT include temperature
      expect(requestBody).not.toHaveProperty("temperature");
    });
  });
});