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
const TOKENS_PER_1K = 1000;
const DEFAULT_STATUS_CODE = 500;
const RANDOM_BASE = 36;
const RANDOM_SUBSTRING_LENGTH = 7;

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: Array<{
    text: string;
  }>;
}

/**
 * Google Gemini Provider Adapter
 * Implements the BaseProviderAdapter for Google's Gemini API
 */
export class GeminiProviderAdapter extends BaseProviderAdapter {
  private static readonly BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

  // HTTP Status codes
  private static readonly HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  } as const;

  private static readonly MODELS: ProviderModel[] = [
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      description: "Smallest and most cost effective second generation model",
      contextWindow: 1000000, // 1M tokens
      maxOutputTokens: 32768,
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      description: "State-of-the-art multipurpose model, excels at coding and complex reasoning tasks",
      contextWindow: 2000000, // 2M tokens
      maxOutputTokens: 32768,
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      description: "Hybrid reasoning model with 1M token context window and thinking budgets",
      contextWindow: 1000000, // 1M tokens
      maxOutputTokens: 32768,
    },
    {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite",
      description: "Smallest and most cost effective model, built for at scale usage",
      contextWindow: 1000000, // 1M tokens
      maxOutputTokens: 32768,
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Most balanced multimodal model with great performance across all tasks",
      contextWindow: 1000000, // 1M tokens
      maxOutputTokens: 32768,
    },

  ];

  // Pricing as of October 2025 (per 1K tokens in USD) - Paid tier
  private static readonly PRICING: Record<string, ProviderPricing> = {
    "gemini-2.5-pro": {
      inputTokensPer1K: 1.25, // $1.25 per 1K tokens (<=200k tokens)
      outputTokensPer1K: 10.0, // $10.00 per 1K tokens (<=200k tokens)
    },
    "gemini-2.5-flash": {
      inputTokensPer1K: 0.3, // $0.30 per 1K tokens (text/image/video)
      outputTokensPer1K: 2.5, // $2.50 per 1K tokens (including thinking tokens)
    },
    "gemini-2.5-flash-lite": {
      inputTokensPer1K: 0.1, // $0.10 per 1K tokens (text/image/video)
      outputTokensPer1K: 0.4, // $0.40 per 1K tokens (including thinking tokens)
    },
    "gemini-2.0-flash": {
      inputTokensPer1K: 0.1, // $0.10 per 1K tokens (text/image/video)
      outputTokensPer1K: 0.4, // $0.40 per 1K tokens
    },
    "gemini-2.0-flash-lite": {
      inputTokensPer1K: 0.075, // $0.075 per 1K tokens
      outputTokensPer1K: 0.3, // $0.30 per 1K tokens
    },
  };

  constructor(config: ProviderConfig) {
    super(config);
  }

  getModels(): ProviderModel[] {
    return GeminiProviderAdapter.MODELS;
  }

  getPricing(model: string): ProviderPricing | null {
    return GeminiProviderAdapter.PRICING[model] || null;
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim() !== "");
  }

  async call(request: ProviderRequest): Promise<ProviderResponse> {
    if (!this.validateConfig()) {
      const error = this.createError(
        "auth",
        "API key is required for Gemini provider",
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

    // Convert messages to Gemini format
    const contents: GeminiContent[] = [];

    // Add system instruction if provided
    let systemInstruction: GeminiContent | undefined;
    if (request.systemPrompt) {
      systemInstruction = {
        role: "user" as const,
        parts: [{ text: request.systemPrompt }],
      };
    }

    // Convert messages to Gemini format
    request.messages.forEach((message) => {
      const role = message.role === "assistant" ? "model" : "user";
      contents.push({
        role,
        parts: [{ text: message.content }],
      });
    });

    const generationConfig: Record<string, unknown> = {};

    // Add temperature if provided
    if (request.temperature !== undefined) {
      generationConfig.temperature = request.temperature;
    }

    // Add max tokens if provided
    if (request.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = request.maxTokens;
    } else {
      generationConfig.maxOutputTokens = DEFAULT_MAX_TOKENS;
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig,
    };

    // Add system instruction if provided
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `${GeminiProviderAdapter.BASE_URL}/models/${request.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
      const error = this.createError(
        this.mapHttpStatusToErrorType(response.status),
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData,
      );
      throw new Error(JSON.stringify(error));
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      const error = this.createError(
        "provider",
        "No response candidates from Gemini",
        DEFAULT_STATUS_CODE,
        data,
      );
      throw new Error(JSON.stringify(error));
    }

    const candidate = data.candidates[0];
    if (!candidate?.content?.parts?.[0]?.text) {
      const error = this.createError(
        "provider",
        "Invalid response format from Gemini",
        DEFAULT_STATUS_CODE,
        data,
      );
      throw new Error(JSON.stringify(error));
    }

    const content = candidate.content.parts[0].text;
    const usage = data.usageMetadata;

    // Calculate costs
    const pricing = this.getPricing(model);
    const inputCost = pricing
      ? (usage.promptTokenCount / TOKENS_PER_1K) * pricing.inputTokensPer1K
      : 0;
    const outputCost = pricing
      ? (usage.candidatesTokenCount / TOKENS_PER_1K) * pricing.outputTokensPer1K
      : 0;

    return {
      content,
      model,
      usage: {
        inputTokens: usage.promptTokenCount,
        outputTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount,
      },
      cost: {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
      },
      metadata: {
        latency,
        requestId: `gemini_${Date.now()}_${Math.random().toString(RANDOM_BASE).substring(RANDOM_SUBSTRING_LENGTH)}`,
        provider: this.config.name,
        timestamp: new Date(),
      },
    };
  }

  private handleError(error: unknown): ProviderError {
    if (error instanceof Error) {
      // Check if it's an abort error
      if (error.name === "AbortError") {
        return this.createError("timeout", "Request timeout");
      }

      // Check if it's a fetch error
      if (error.message.includes("fetch")) {
        return this.createError("network", "Network error occurred");
      }

      // Try to parse if it's already a JSON error
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.code && parsed.message) {
          return parsed;
        }
      } catch {
        // Not a JSON error, continue
      }
    }

    // Default error
    return this.createError(
      "provider",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }

  private mapHttpStatusToErrorType(status: number): ProviderError["code"] {
    switch (status) {
      case GeminiProviderAdapter.HTTP_STATUS.BAD_REQUEST:
        return "invalid_request";
      case GeminiProviderAdapter.HTTP_STATUS.UNAUTHORIZED:
      case GeminiProviderAdapter.HTTP_STATUS.FORBIDDEN:
        return "auth";
      case GeminiProviderAdapter.HTTP_STATUS.NOT_FOUND:
        return "provider";
      case GeminiProviderAdapter.HTTP_STATUS.TOO_MANY_REQUESTS:
        return "rate_limit";
      case GeminiProviderAdapter.HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case GeminiProviderAdapter.HTTP_STATUS.BAD_GATEWAY:
      case GeminiProviderAdapter.HTTP_STATUS.SERVICE_UNAVAILABLE:
      case GeminiProviderAdapter.HTTP_STATUS.GATEWAY_TIMEOUT:
        return "provider";
      default:
        return "provider";
    }
  }

  private createError(
    code: string,
    message: string,
    statusCode?: number,
    originalError?: unknown,
  ): ProviderError {
    return {
      code,
      message,
      type: "server_error",
      details: {
        statusCode,
        originalError,
      },
    };
  }
}
