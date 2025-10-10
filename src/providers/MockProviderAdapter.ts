import { BaseProviderAdapter } from "../types/providers";
import type {
  ProviderModel,
  ProviderPricing,
  ProviderRequest,
  ProviderResponse,
  ProviderConfig,
} from "../types/providers";

/**
 * Mock Provider Adapter for testing integration
 * This template shows how to implement a provider adapter
 */
export class MockProviderAdapter extends BaseProviderAdapter {
  private static readonly MODELS: ProviderModel[] = [
    {
      id: "mock-fast",
      name: "Mock Fast Model",
      description: "Fast mock model for testing",
      contextWindow: 4096,
      maxOutputTokens: 1024,
    },
    {
      id: "mock-smart",
      name: "Mock Smart Model",
      description: "Smart mock model for testing",
      contextWindow: 8192,
      maxOutputTokens: 2048,
    },
  ];

  private static readonly PRICING: Record<string, ProviderPricing> = {
    "mock-fast": {
      inputTokensPer1K: 0.001,
      outputTokensPer1K: 0.002,
    },
    "mock-smart": {
      inputTokensPer1K: 0.003,
      outputTokensPer1K: 0.006,
    },
  };

  constructor(config: ProviderConfig) {
    super(config);
  }

  getModels(): ProviderModel[] {
    return MockProviderAdapter.MODELS;
  }

  getPricing(model: string): ProviderPricing | null {
    return MockProviderAdapter.PRICING[model] || null;
  }

  validateConfig(): boolean {
    // Mock provider doesn't require API key
    return this.config.id !== "" && this.config.name !== "";
  }

  async call(request: ProviderRequest): Promise<ProviderResponse> {
    // Simulate API latency
    const MOCK_LATENCY_MIN = 100;
    const MOCK_LATENCY_MAX = 500;
    const latency =
      Math.random() * (MOCK_LATENCY_MAX - MOCK_LATENCY_MIN) + MOCK_LATENCY_MIN;

    await new Promise((resolve) => setTimeout(resolve, latency));

    // Mock response generation
    const inputText = request.messages.map((m) => m.content).join(" ");
    const inputTokens = this.estimateTokens(inputText);

    // Generate mock response based on input
    const mockResponses = [
      "This is a mock response from the test provider.",
      "Mock AI response generated for testing purposes.",
      "Testing integration with mock provider adapter.",
      "Simulated AI response with proper token counting.",
    ];

    const BASE_36 = 36;
    const SUBSTRING_LENGTH = 7;
    const responseIndex = Math.floor(Math.random() * mockResponses.length);
    const responseContent =
      mockResponses[responseIndex] || "Default mock response";
    const outputTokens = this.estimateTokens(responseContent);
    const totalTokens = inputTokens + outputTokens;

    // Calculate costs
    const pricing = this.getPricing(request.model);
    const TOKENS_PER_1K = 1000;
    const inputCost = pricing
      ? (inputTokens / TOKENS_PER_1K) * pricing.inputTokensPer1K
      : 0;
    const outputCost = pricing
      ? (outputTokens / TOKENS_PER_1K) * pricing.outputTokensPer1K
      : 0;

    return {
      content: responseContent,
      model: request.model,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
      cost: {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
      },
      metadata: {
        latency: Math.round(latency),
        requestId: `mock_${Date.now()}_${Math.random().toString(BASE_36).substring(SUBSTRING_LENGTH)}`,
        provider: this.getName(),
        timestamp: new Date(),
      },
    };
  }
}
