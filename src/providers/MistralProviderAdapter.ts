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

interface MistralContentItem {
  type: "text" | "thinking";
  text?: string;
  thinking?: Array<{ type: "text"; text: string }>;
}

interface MistralResponse {
  id: string;
  object: "chat.completion";
  model: string;
  choices: Array<{
    index: number;
    message: {
      content: string | Array<MistralContentItem>;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

/**
 * Mistral AI Provider Adapter
 * Implements the BaseProviderAdapter for Mistral's API
 */
export class MistralProviderAdapter extends BaseProviderAdapter {
  private static readonly BASE_URL = "https://api.mistral.ai/v1";

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
      id: "mistral-medium-latest",
      name: "Mistral Medium",
      description: "Balanced model for various complex tasks",
      contextWindow: 128000,
      maxOutputTokens: 32000,
    },
    {
      id: "magistral-medium-latest",
      name: "Magistral Medium",
      description: "Enhanced reasoning model for complex problem solving",
      contextWindow: 128000,
      maxOutputTokens: 32000,
    },
    {
      id: "codestral-latest",
      name: "Codestral",
      description: "Specialized model for code generation and analysis",
      contextWindow: 128000,
      maxOutputTokens: 32000,
    },
    {
      id: "mistral-small-latest",
      name: "Mistral Small",
      description: "Efficient model for simple tasks and quick responses",
      contextWindow: 128000,
      maxOutputTokens: 32000,
    },
    {
      id: "ministral-8b-latest",
      name: "Ministral 8B",
      description: "Compact 8B parameter model for fast inference",
      contextWindow: 128000,
      maxOutputTokens: 32000,
    },
    {
      id: "ministral-3b-latest",
      name: "Ministral 3B",
      description: "Ultra-compact 3B parameter model for efficient processing",
      contextWindow: 128000,
      maxOutputTokens: 32000,
    },
  ];

  // Pricing as of December 2024 (per 1K tokens in USD)
  // Based on https://mistral.ai/pricing#api-pricing
  private static readonly PRICING: Record<string, ProviderPricing> = {
    "mistral-medium-latest": {
      inputTokensPer1K: 0.0004, // $0.4 per 1M tokens = $0.0004 per 1K tokens
      outputTokensPer1K: 0.002, // $2 per 1M tokens = $0.002 per 1K tokens
    },
    "magistral-medium-latest": {
      inputTokensPer1K: 0.0005, // $0.5 per 1M tokens = $0.0005 per 1K tokens
      outputTokensPer1K: 0.005, // $5 per 1M tokens = $0.005 per 1K tokens
    },
    "codestral-latest": {
      inputTokensPer1K: 0.0004, // $0.4 per 1M tokens = $0.0004 per 1K tokens
      outputTokensPer1K: 0.002, // $2 per 1M tokens = $0.002 per 1K tokens
    },
    "mistral-small-latest": {
      inputTokensPer1K: 0.0001, // $0.1 per 1M tokens = $0.0001 per 1K tokens
      outputTokensPer1K: 0.0003, // $0.3 per 1M tokens = $0.0003 per 1K tokens
    },
    "ministral-8b-latest": {
      inputTokensPer1K: 0.00004, // $0.04 per 1M tokens = $0.00004 per 1K tokens
      outputTokensPer1K: 0.00004, // $0.04 per 1M tokens = $0.00004 per 1K tokens
    },
    "ministral-3b-latest": {
      inputTokensPer1K: 0.00004, // $0.04 per 1M tokens = $0.00004 per 1K tokens
      outputTokensPer1K: 0.00004, // $0.04 per 1M tokens = $0.00004 per 1K tokens
    },
  };

  constructor(config: ProviderConfig) {
    super(config);
  }

  getModels(): ProviderModel[] {
    return MistralProviderAdapter.MODELS;
  }

  getPricing(model: string): ProviderPricing | null {
    return MistralProviderAdapter.PRICING[model] || null;
  }

  validateConfig(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim() !== "");
  }

  async call(request: ProviderRequest): Promise<ProviderResponse> {
    if (!this.validateConfig()) {
      const error = this.createError(
        "auth",
        "API key is required for Mistral provider",
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
      const providerError = this.handleError(error as Error & { code?: string });
      throw new Error(JSON.stringify(providerError));
    }
  }

  private async makeRequest(request: ProviderRequest): Promise<MistralResponse> {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey!}`,
    };

    // Convert messages to Mistral format
    const messages = [];

    // Add system message if present
    if (request.systemPrompt) {
      messages.push({
        role: "system",
        content: request.systemPrompt,
      });
    }

    // Add system message from messages array if no systemPrompt is provided
    const systemMessage = request.messages.find(msg => msg.role === "system");
    if (!request.systemPrompt && systemMessage) {
      messages.push({
        role: "system",
        content: systemMessage.content,
      });
    }

    // Add non-system messages
    const nonSystemMessages = request.messages.filter(msg => msg.role !== "system");
    messages.push(...nonSystemMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })));

    const body = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: request.temperature || DEFAULT_TEMPERATURE,
      stream: false,
    };

    const response = await fetch(`${MistralProviderAdapter.BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  private processResponse(
    response: MistralResponse,
    model: string,
    latency: number,
  ): ProviderResponse {
    const rawContent = response.choices?.[0]?.message?.content || "";
    const content = this.extractTextFromContent(rawContent);

    const usage = {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };

    const pricing = this.getPricing(model);
    const cost = {
      inputCost: pricing ? (usage.inputTokens / TOKENS_PER_1K) * pricing.inputTokensPer1K : 0,
      outputCost: pricing ? (usage.outputTokens / TOKENS_PER_1K) * pricing.outputTokensPer1K : 0,
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
        requestId: response.id || `mistral-${Date.now()}`,
        provider: "mistral",
        timestamp: new Date(),
      },
    };
  }

  /**
   * Extracts text content from Mistral's response, handling both string and array formats
   * Some models (like Magistral) return complex content with "thinking" sections
   */
  private extractTextFromContent(content: string | Array<MistralContentItem>): string {
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      // Extract all text content, ignoring thinking sections
      return content
        .filter((item) => item.type === "text")
        .map((item) => item.text || "")
        .join("")
        .trim();
    }

    return "";
  }

  private handleError(error: Error & { code?: string }): ProviderError {
    if (error.message?.includes("HTTP")) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]!, 10) : DEFAULT_STATUS_CODE;

      switch (status) {
        case MistralProviderAdapter.HTTP_STATUS.UNAUTHORIZED:
          return this.createError("auth", "Invalid API key");
        case MistralProviderAdapter.HTTP_STATUS.TOO_MANY_REQUESTS:
          return this.createError("rate_limit", "Rate limit exceeded");
        case MistralProviderAdapter.HTTP_STATUS.BAD_REQUEST:
          return this.createError("invalid_request", "Invalid request format");
        default:
          return this.createError("server_error", `API error: ${error.message}`);
      }
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return this.createError("network_error", "Network connection failed");
    }

    return this.createError("server_error", error.message || "Unknown error occurred");
  }

  private createError(
    type: "auth" | "rate_limit" | "invalid_request" | "server_error" | "network_error",
    message: string,
  ): ProviderError {
    return {
      code: `mistral_${type}`,
      type,
      message,
      details: { provider: "mistral", timestamp: new Date().toISOString() },
    };
  }
}
