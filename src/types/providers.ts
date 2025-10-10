// Base provider types and interfaces
export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
  contextWindow: number;
  maxOutputTokens: number;
}

export interface ProviderPricing {
  inputTokensPer1K: number; // Cost per 1K input tokens in USD
  outputTokensPer1K: number; // Cost per 1K output tokens in USD
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
}

export interface ProviderRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ProviderResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  metadata: {
    latency: number; // in milliseconds
    requestId: string;
    provider: string;
    timestamp: Date;
  };
}

export interface ProviderError {
  code: string;
  message: string;
  type:
    | "auth"
    | "rate_limit"
    | "invalid_request"
    | "server_error"
    | "network_error";
  details?: Record<string, unknown>;
}

// Base Provider Adapter Interface
export abstract class BaseProviderAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  // Abstract methods that must be implemented by each provider
  abstract getModels(): ProviderModel[];
  abstract getPricing(model: string): ProviderPricing | null;
  abstract call(request: ProviderRequest): Promise<ProviderResponse>;
  abstract validateConfig(): boolean;

  // Common utility methods
  estimateTokens(text: string): number {
    // Simple token estimation - roughly 4 characters per token
    const CHARS_PER_TOKEN = 4;
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }

  estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: string,
  ): number {
    const pricing = this.getPricing(model);
    if (!pricing) return 0;

    const TOKENS_PER_1K = 1000;
    const inputCost = (inputTokens / TOKENS_PER_1K) * pricing.inputTokensPer1K;
    const outputCost =
      (outputTokens / TOKENS_PER_1K) * pricing.outputTokensPer1K;

    return inputCost + outputCost;
  }

  // Configuration methods
  updateConfig(updates: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }

  isActive(): boolean {
    return this.config.isActive && this.validateConfig();
  }
}
