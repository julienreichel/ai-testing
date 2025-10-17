import { BaseProviderAdapter } from "../types/providers";
import type {
  ProviderModel,
  ProviderPricing,
  ProviderRequest,
  ProviderResponse,
  ProviderConfig,
  ProviderError,
} from "../types/providers";

const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.7;
const TOKENS_PER_1K = 1000;
const DEFAULT_STATUS_CODE = 500;

interface ClaudeResponse {
  id: string;
  content: Array<{ text: string; type: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic Claude Provider Adapter
 * Implements the BaseProviderAdapter for Anthropic's Claude API
 */
export class AnthropicProviderAdapter extends BaseProviderAdapter {
  private static readonly BASE_URL = "https://api.anthropic.com/v1";

  // HTTP Status codes
  private static readonly HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  } as const;

  private static readonly MODELS: ProviderModel[] = [
    {
      id: "claude-sonnet-4-0",
      name: "Claude Sonnet 4",
      description: "High-performance model with balanced capabilities",
      contextWindow: 200000,
      maxOutputTokens: 64000,
    },
    {
      id: "claude-opus-4-1",
      name: "Claude Opus 4.1",
      description:
        "Exceptional model for specialized complex tasks requiring advanced reasoning",
      contextWindow: 200000,
      maxOutputTokens: 32000,
    },
    {
      id: "claude-opus-4-0",
      name: "Claude Opus 4",
      description: "Very high intelligence and capability for complex tasks",
      contextWindow: 200000,
      maxOutputTokens: 32000,
    },
    {
      id: "claude-sonnet-4-5",
      name: "Claude Sonnet 4.5",
      description:
        "Our best model for complex agents and coding with highest intelligence across most tasks",
      contextWindow: 200000,
      maxOutputTokens: 64000,
    },
    {
      id: "claude-3-7-sonnet-latest",
      name: "Claude Sonnet 3.7",
      description: "High-performance model with extended thinking capabilities",
      contextWindow: 200000,
      maxOutputTokens: 64000,
    },
    {
      id: "claude-3-5-haiku-latest",
      name: "Claude Haiku 3.5",
      description: "Fast and compact model for near-instant responsiveness",
      contextWindow: 200000,
      maxOutputTokens: 8192,
    },
  ];

  // Pricing as of October 2025 (per 1K tokens in USD)
  // Based on https://docs.claude.com/en/docs/about-claude/models/overview
  private static readonly PRICING: Record<string, ProviderPricing> = {
    "claude-sonnet-4-0": {
      inputTokensPer1K: 0.003, // $3 per 1M tokens = $0.003 per 1K tokens
      outputTokensPer1K: 0.015, // $15 per 1M tokens = $0.015 per 1K tokens
    },
    "claude-opus-4-1": {
      inputTokensPer1K: 0.015, // $15 per 1M tokens = $0.015 per 1K tokens
      outputTokensPer1K: 0.075, // $75 per 1M tokens = $0.075 per 1K tokens
    },
    "claude-opus-4-0": {
      inputTokensPer1K: 0.015, // $15 per 1M tokens = $0.015 per 1K tokens
      outputTokensPer1K: 0.075, // $75 per 1M tokens = $0.075 per 1K tokens
    },
    "claude-sonnet-4-5": {
      inputTokensPer1K: 0.003, // $3 per 1M tokens = $0.003 per 1K tokens
      outputTokensPer1K: 0.015, // $15 per 1M tokens = $0.015 per 1K tokens
    },
    "claude-3-7-sonnet-latest": {
      inputTokensPer1K: 0.003, // $3 per 1M tokens = $0.003 per 1K tokens
      outputTokensPer1K: 0.015, // $15 per 1M tokens = $0.015 per 1K tokens
    },
    "claude-3-5-haiku-latest": {
      inputTokensPer1K: 0.0008, // $0.80 per 1M tokens = $0.0008 per 1K tokens
      outputTokensPer1K: 0.004, // $4 per 1M tokens = $0.004 per 1K tokens
    },
  };

  constructor(config: ProviderConfig) {
    super(config);
  }

  getModels(): ProviderModel[] {
    return AnthropicProviderAdapter.MODELS;
  }

  getPricing(model: string): ProviderPricing | null {
    return AnthropicProviderAdapter.PRICING[model] || null;
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim() !== "");
  }

  async call(request: ProviderRequest): Promise<ProviderResponse> {
    if (!this.validateConfig()) {
      const error = this.createError(
        "auth",
        "API key is required for Anthropic provider",
      );
      throw new Error(JSON.stringify(error));
    }

    const startTime = Date.now();

    try {
      const response = await this.makeRequest(request);
      const endTime = Date.now();
      const latency = endTime - startTime;

      return this.processResponse(response, request.model, latency);
    } catch (error) {
      const providerError = this.handleError(
        error as Error & { code?: string },
      );
      throw new Error(JSON.stringify(providerError));
    }
  }

  private async makeRequest(request: ProviderRequest): Promise<ClaudeResponse> {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey!,
      "anthropic-dangerous-direct-browser-access": "true",
      "anthropic-version": "2023-06-01",
    };

    // Convert messages to Claude format
    const messages = request.messages.filter((msg) => msg.role !== "system");
    const systemPrompt =
      request.systemPrompt ||
      request.messages.find((msg) => msg.role === "system")?.content ||
      "";

    const body = {
      model: request.model,
      max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: request.temperature || DEFAULT_TEMPERATURE,
      messages: messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      ...(systemPrompt && { system: systemPrompt }),
    };

    const response = await fetch(
      `${AnthropicProviderAdapter.BASE_URL}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  private processResponse(
    response: ClaudeResponse,
    model: string,
    latency: number,
  ): ProviderResponse {
    const content = response.content?.[0]?.text || "";
    const usage = {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens:
        (response.usage?.input_tokens || 0) +
        (response.usage?.output_tokens || 0),
    };

    const pricing = this.getPricing(model);
    const cost = {
      inputCost: pricing
        ? (usage.inputTokens / TOKENS_PER_1K) * pricing.inputTokensPer1K
        : 0,
      outputCost: pricing
        ? (usage.outputTokens / TOKENS_PER_1K) * pricing.outputTokensPer1K
        : 0,
      totalCost: 0,
    };
    cost.totalCost = cost.inputCost + cost.outputCost;

    return {
      content,
      model,
      usage,
      cost,
      metadata: {
        latency,
        requestId: response.id || `claude-${Date.now()}`,
        provider: "anthropic",
        timestamp: new Date(),
      },
    };
  }

  private handleError(error: Error & { code?: string }): ProviderError {
    if (error.message?.includes("HTTP")) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch
        ? parseInt(statusMatch[1]!, 10)
        : DEFAULT_STATUS_CODE;

      switch (status) {
        case AnthropicProviderAdapter.HTTP_STATUS.UNAUTHORIZED:
          return this.createError("auth", "Invalid API key");
        case AnthropicProviderAdapter.HTTP_STATUS.TOO_MANY_REQUESTS:
          return this.createError("rate_limit", "Rate limit exceeded");
        case AnthropicProviderAdapter.HTTP_STATUS.BAD_REQUEST:
          return this.createError("invalid_request", "Invalid request format");
        default:
          return this.createError(
            "server_error",
            `API error: ${error.message}`,
          );
      }
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return this.createError("network_error", "Network connection failed");
    }

    return this.createError(
      "server_error",
      error.message || "Unknown error occurred",
    );
  }

  private createError(
    type:
      | "auth"
      | "rate_limit"
      | "invalid_request"
      | "server_error"
      | "network_error",
    message: string,
  ): ProviderError {
    return {
      code: `anthropic_${type}`,
      type,
      message,
      details: { provider: "anthropic", timestamp: new Date().toISOString() },
    };
  }
}
