import { BaseProviderAdapter } from "../types/providers";
import type {
  ProviderModel,
  ProviderPricing,
  ProviderRequest,
  ProviderResponse,
  ProviderConfig,
  ProviderError,
} from "../types/providers";

const DEFAULT_TEMPERATURE = 0.7;
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
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Fast and efficient model for simple tasks",
      contextWindow: 128000,
      maxOutputTokens: 16384,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Most capable model for complex tasks",
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  ];

  // Pricing as of 2024 (per 1K tokens in USD)
  private static readonly PRICING: Record<string, ProviderPricing> = {
    "gpt-4o-mini": {
      inputTokensPer1K: 0.00015,
      outputTokensPer1K: 0.0006,
    },
    "gpt-4-turbo": {
      inputTokensPer1K: 0.01,
      outputTokensPer1K: 0.03,
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
      temperature:
        request.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
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
