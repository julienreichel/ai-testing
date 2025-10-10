import { describe, it, expect, beforeEach } from "vitest";
import { MockProviderAdapter } from "../src/providers/MockProviderAdapter";
import { OpenAIProviderAdapter } from "../src/providers/OpenAIProviderAdapter";
import { ProviderFactory, ProviderRegistry } from "../src/providers";
import type { ProviderConfig, ProviderRequest } from "../src/types/providers";

describe("Provider System", () => {
  describe("MockProviderAdapter - Template Implementation", () => {
    let provider: MockProviderAdapter;
    let config: ProviderConfig;

    beforeEach(() => {
      config = {
        id: "mock_test",
        name: "Test Mock Provider",
        isActive: true,
      };
      provider = new MockProviderAdapter(config);
    });

    it("should provide available models", () => {
      const models = provider.getModels();

      expect(models).toHaveLength(2);
      expect(models[0]).toEqual({
        id: "mock-fast",
        name: "Mock Fast Model",
        description: "Fast mock model for testing",
        contextWindow: 4096,
        maxOutputTokens: 1024,
      });
    });

    it("should provide pricing information for models", () => {
      const pricing = provider.getPricing("mock-fast");

      expect(pricing).toEqual({
        inputTokensPer1K: 0.001,
        outputTokensPer1K: 0.002,
      });
    });

    it("should validate configuration correctly", () => {
      expect(provider.validateConfig()).toBe(true);

      const invalidProvider = new MockProviderAdapter({
        id: "",
        name: "",
        isActive: true,
      });
      expect(invalidProvider.validateConfig()).toBe(false);
    });

    it("should generate mock responses with proper structure", async () => {
      const request: ProviderRequest = {
        model: "mock-fast",
        messages: [{ role: "user", content: "Hello, test message" }],
        temperature: 0.7,
        maxTokens: 100,
      };

      const response = await provider.call(request);

      expect(response).toMatchObject({
        content: expect.any(String),
        model: "mock-fast",
        usage: {
          inputTokens: expect.any(Number),
          outputTokens: expect.any(Number),
          totalTokens: expect.any(Number),
        },
        cost: {
          inputCost: expect.any(Number),
          outputCost: expect.any(Number),
          totalCost: expect.any(Number),
        },
        metadata: {
          latency: expect.any(Number),
          requestId: expect.stringMatching(/^mock_/),
          provider: "Test Mock Provider",
          timestamp: expect.any(Date),
        },
      });
    });

    it("should estimate tokens correctly", () => {
      const text = "This is a test message";
      const tokens = provider.estimateTokens(text);

      // Should be roughly text.length / 4
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length);
    });

    it("should calculate cost estimates correctly", () => {
      const TOKENS_100 = 100;
      const TOKENS_50 = 50;
      const cost = provider.estimateCost(TOKENS_100, TOKENS_50, "mock-fast");

      // Should be based on pricing: 100 * 0.001/1000 + 50 * 0.002/1000
      expect(cost).toBeCloseTo(0.0002);
    });
  });

  describe("OpenAIProviderAdapter - Real Implementation", () => {
    let provider: OpenAIProviderAdapter;
    let config: ProviderConfig;

    beforeEach(() => {
      config = {
        id: "openai_test",
        name: "Test OpenAI Provider",
        apiKey: "sk-test-key-123",
        isActive: true,
      };
      provider = new OpenAIProviderAdapter(config);
    });

    it("should provide OpenAI models", () => {
      const models = provider.getModels();

      expect(models).toHaveLength(2);
      expect(models.find((m) => m.id === "gpt-4o-mini")).toBeDefined();
      expect(models.find((m) => m.id === "gpt-4-turbo")).toBeDefined();
    });

    it("should provide current OpenAI pricing", () => {
      const pricing = provider.getPricing("gpt-4o-mini");

      expect(pricing).toEqual({
        inputTokensPer1K: 0.00015,
        outputTokensPer1K: 0.0006,
      });
    });

    it("should validate API key requirement", () => {
      expect(provider.validateConfig()).toBe(true);

      const invalidProvider = new OpenAIProviderAdapter({
        id: "test",
        name: "Test",
        isActive: true,
      });
      expect(invalidProvider.validateConfig()).toBe(false);
    });

    it("should reject calls without valid API key", async () => {
      const invalidProvider = new OpenAIProviderAdapter({
        id: "test",
        name: "Test",
        isActive: true,
      });

      const request: ProviderRequest = {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "test" }],
      };

      await expect(invalidProvider.call(request)).rejects.toThrow();
    });
  });

  describe("ProviderFactory", () => {
    it("should create mock provider instances", () => {
      const config: ProviderConfig = {
        id: "test_mock",
        name: "Test Provider",
        isActive: true,
      };

      const provider = ProviderFactory.createProvider("mock", config);
      expect(provider).toBeInstanceOf(MockProviderAdapter);
    });

    it("should create OpenAI provider instances", () => {
      const config: ProviderConfig = {
        id: "test_openai",
        name: "Test OpenAI",
        apiKey: "sk-test",
        isActive: true,
      };

      const provider = ProviderFactory.createProvider("openai", config);
      expect(provider).toBeInstanceOf(OpenAIProviderAdapter);
    });

    it("should throw error for unknown provider types", () => {
      const config: ProviderConfig = {
        id: "test",
        name: "Test",
        isActive: true,
      };

      expect(() => {
        // @ts-expect-error - Testing invalid type
        ProviderFactory.createProvider("unknown", config);
      }).toThrow("Unknown provider type: unknown");
    });

    it("should list supported provider types", () => {
      const types = ProviderFactory.getSupportedProviders();
      expect(types).toContain("openai");
      expect(types).toContain("mock");
    });
  });

  describe("ProviderRegistry", () => {
    let registry: ProviderRegistry;

    beforeEach(() => {
      registry = new ProviderRegistry();
    });

    it("should add and retrieve providers", () => {
      const config: ProviderConfig = {
        id: "test_provider",
        name: "Test Provider",
        isActive: true,
      };

      const provider = registry.addProvider("mock", config);
      expect(provider).toBeInstanceOf(MockProviderAdapter);

      const retrieved = registry.getProvider("test_provider");
      expect(retrieved).toBe(provider);
    });

    it("should remove providers", () => {
      const config: ProviderConfig = {
        id: "test_provider",
        name: "Test Provider",
        isActive: true,
      };

      registry.addProvider("mock", config);
      expect(registry.size()).toBe(1);

      const removed = registry.removeProvider("test_provider");
      expect(removed).toBe(true);
      expect(registry.size()).toBe(0);
    });

    it("should filter active providers", () => {
      const activeConfig: ProviderConfig = {
        id: "active_provider",
        name: "Active Provider",
        isActive: true,
      };

      const inactiveConfig: ProviderConfig = {
        id: "inactive_provider",
        name: "Inactive Provider",
        isActive: false,
      };

      registry.addProvider("mock", activeConfig);
      registry.addProvider("mock", inactiveConfig);

      const activeProviders = registry.getActiveProviders();
      expect(activeProviders).toHaveLength(1);
      expect(activeProviders[0]?.getId()).toBe("active_provider");
    });

    it("should update provider configurations", () => {
      const config: ProviderConfig = {
        id: "test_provider",
        name: "Test Provider",
        isActive: true,
      };

      registry.addProvider("mock", config);

      const updated = registry.updateProviderConfig("test_provider", {
        name: "Updated Provider",
        isActive: false,
      });

      expect(updated).toBe(true);

      const provider = registry.getProvider("test_provider");
      expect(provider?.getName()).toBe("Updated Provider");
      expect(provider?.isActive()).toBe(false);
    });
  });
});
