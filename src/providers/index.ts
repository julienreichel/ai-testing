import type { BaseProviderAdapter, ProviderConfig } from "../types/providers";
import { MockProviderAdapter } from "./MockProviderAdapter";
import { OpenAIProviderAdapter } from "./OpenAIProviderAdapter";
import { AnthropicProviderAdapter } from "./AnthropicProviderAdapter";

export type ProviderType = "openai" | "anthropic" | "mistral" | "lechat" | "mock";

/**
 * Provider Factory - Creates provider instances
 */
export class ProviderFactory {
  private static readonly PROVIDER_CONSTRUCTORS = {
    openai: OpenAIProviderAdapter,
    anthropic: AnthropicProviderAdapter,
    mock: MockProviderAdapter,
    // TODO: Add other providers
    mistral: MockProviderAdapter, // Placeholder
    lechat: MockProviderAdapter, // Placeholder
  } as const;

  static createProvider(
    type: ProviderType,
    config: ProviderConfig,
  ): BaseProviderAdapter {
    const ProviderClass = this.PROVIDER_CONSTRUCTORS[type];

    if (!ProviderClass) {
      throw new Error(`Unknown provider type: ${type}`);
    }

    return new ProviderClass(config);
  }

  static getSupportedProviders(): ProviderType[] {
    return Object.keys(this.PROVIDER_CONSTRUCTORS) as ProviderType[];
  }

  static isProviderSupported(type: string): type is ProviderType {
    return type in this.PROVIDER_CONSTRUCTORS;
  }
}

/**
 * Provider Registry - Manages active provider instances
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, BaseProviderAdapter>();

  addProvider(type: ProviderType, config: ProviderConfig): BaseProviderAdapter {
    const provider = ProviderFactory.createProvider(type, config);
    this.providers.set(config.id, provider);
    return provider;
  }

  getProvider(id: string): BaseProviderAdapter | null {
    return this.providers.get(id) || null;
  }

  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  getAllProviders(): BaseProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  getActiveProviders(): BaseProviderAdapter[] {
    return this.getAllProviders().filter((provider) => provider.isActive());
  }

  updateProviderConfig(id: string, updates: Partial<ProviderConfig>): boolean {
    const provider = this.getProvider(id);
    if (!provider) return false;

    provider.updateConfig(updates);
    return true;
  }

  clear(): void {
    this.providers.clear();
  }

  size(): number {
    return this.providers.size;
  }
}
