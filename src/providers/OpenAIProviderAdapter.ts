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
/**
 * OpenAI Provider Adapter
 * Implements the BaseProviderAdapter for OpenAI's API
 */
export class OpenAIProviderAdapter extends BaseProviderAdapter {
  private static readonly BASE_URL = "https://api.openai.com/v1";

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

  // Default values

  private static readonly MODELS: ProviderModel[] = [
    {
      id: "gpt-5-nano",
      name: "GPT-5 Nano",
      description: "Ultra-light version of GPT-5 (low cost, lower capacity)",
      contextWindow: 128000, // (or whatever spec OpenAI uses)
      maxOutputTokens: 32768, // example; confirm with spec
    },
    {
      id: "gpt-5-mini",
      name: "GPT-5 Mini",
      description: "Balanced mid-tier GPT-5 variant",
      contextWindow: 256000,
      maxOutputTokens: 65536,
    },
    {
      id: "gpt-5",
      name: "GPT-5",
      description: "Full GPT-5 flagship",
      contextWindow: 512000,
      maxOutputTokens: 131072,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Cost-efficient omni-modal model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "General-purpose omni-modal model",
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "High-capacity model for complex tasks",
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "More affordable model for lighter tasks",
      contextWindow: 16384,
      maxOutputTokens: 4096,
    },
  ];

  // Pricing as of 2024 (per 1K tokens in USD)
  private static readonly PRICING: Record<string, ProviderPricing> = {
    "gpt-5-nano": {
      inputTokensPer1K: 0.00005, // $0.05 per 1,000 = $50 per 1M
      outputTokensPer1K: 0.0004, // $0.40 per 1,000 = $400 per 1M
    },
    "gpt-5-mini": {
      inputTokensPer1K: 0.00025, // $0.25 per 1,000 = $250 per 1M
      outputTokensPer1K: 0.002, // $2.00 per 1,000 = $2,000 per 1M
    },
    "gpt-5": {
      inputTokensPer1K: 0.00125, // $1.25 per 1,000 = $1,250 per 1M
      outputTokensPer1K: 0.01, // $10.00 per 1,000 = $10,000 per 1M
    },
    "gpt-4o-mini": {
      inputTokensPer1K: 0.00015, // $0.15 per 1,000 input tokens :contentReference[oaicite:0]{index=0}
      outputTokensPer1K: 0.0006, // $0.60 per 1,000 output tokens :contentReference[oaicite:1]{index=1}
    },
    "gpt-4o": {
      inputTokensPer1K: 0.005, // $0.005 per 1,000 input tokens :contentReference[oaicite:2]{index=2}
      outputTokensPer1K: 0.015, // $0.015 per 1,000 output tokens :contentReference[oaicite:3]{index=3}
    },
    "gpt-4-turbo": {
      inputTokensPer1K: 0.01, // ~$0.01 per 1,000 input tokens (estimate)
      outputTokensPer1K: 0.03, // ~$0.03 per 1,000 output tokens
    },
    "gpt-3.5-turbo": {
      inputTokensPer1K: 0.0003, // ~$0.0003 per 1,000 input tokens (estimate)
      outputTokensPer1K: 0.0006, // ~$0.0006 per 1,000 output tokens
    },
  };

  constructor(config: ProviderConfig) {
    super(config);
  }

  getModels(): ProviderModel[] {
    return OpenAIProviderAdapter.MODELS;
  }

  getPricing(model: string): ProviderPricing | null {
    return OpenAIProviderAdapter.PRICING[model] || null;
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim() !== "");
  }

  async call(request: ProviderRequest): Promise<ProviderResponse> {
    if (!this.validateConfig()) {
      const error = this.createError(
        "auth",
        "API key is required for OpenAI provider",
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
      const providerError = this.handleError(error);
      throw new Error(JSON.stringify(providerError));
    }
  }

  private async makeRequest(request: ProviderRequest): Promise<Response> {
    const TIMEOUT_MS = 30000; // 30 seconds

    const messages = request.messages.slice(); // Copy array

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.unshift({
        role: "system",
        content: request.systemPrompt,
      });
    }

    const body = {
      model: request.model,
      messages,
      temperature: request.temperature ?? undefined,
      max_completion_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `${OpenAIProviderAdapter.BASE_URL}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async processResponse(
    response: Response,
    model: string,
    latency: number,
  ): Promise<ProviderResponse> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = this.createHttpError(response.status, errorData);
      throw new Error(JSON.stringify(error));
    }

    const data = await response.json();

    // Extract response content
    const content = data.choices?.[0]?.message?.content || "";

    // Extract usage information
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;

    // Calculate costs
    const pricing = this.getPricing(model);
    const TOKENS_PER_1K = 1000;
    const inputCost = pricing
      ? (inputTokens / TOKENS_PER_1K) * pricing.inputTokensPer1K
      : 0;
    const outputCost = pricing
      ? (outputTokens / TOKENS_PER_1K) * pricing.outputTokensPer1K
      : 0;

    return {
      content,
      model,
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
        latency,
        requestId: data.id || `openai_${Date.now()}`,
        provider: this.getName(),
        timestamp: new Date(),
      },
    };
  }

  private createError(
    type: ProviderError["type"],
    message: string,
  ): ProviderError {
    return {
      code: "PROVIDER_ERROR",
      message,
      type,
    };
  }

  private createHttpError(
    status: number,
    errorData: Record<string, unknown>,
  ): ProviderError {
    const message =
      (errorData.error as { message?: string })?.message || "Unknown error";

    switch (status) {
      case OpenAIProviderAdapter.HTTP_STATUS.UNAUTHORIZED:
        return this.createError("auth", "Invalid API key");
      case OpenAIProviderAdapter.HTTP_STATUS.TOO_MANY_REQUESTS:
        return this.createError("rate_limit", "Rate limit exceeded");
      case OpenAIProviderAdapter.HTTP_STATUS.BAD_REQUEST:
        return this.createError("invalid_request", message);
      case OpenAIProviderAdapter.HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case OpenAIProviderAdapter.HTTP_STATUS.BAD_GATEWAY:
      case OpenAIProviderAdapter.HTTP_STATUS.SERVICE_UNAVAILABLE:
      case OpenAIProviderAdapter.HTTP_STATUS.GATEWAY_TIMEOUT:
        return this.createError("server_error", "OpenAI server error");
      default:
        return this.createError("server_error", `HTTP ${status}: ${message}`);
    }
  }

  private handleError(error: unknown): ProviderError {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return this.createError("network_error", "Request timeout");
      }

      if (error.message.includes("fetch")) {
        return this.createError("network_error", "Network connection failed");
      }
    }

    // If it's already a ProviderError, return it
    if (typeof error === "object" && error !== null && "type" in error) {
      return error as ProviderError;
    }

    return this.createError("server_error", "Unknown error occurred");
  }
}
