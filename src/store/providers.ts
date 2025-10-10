import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ProviderRegistry, ProviderFactory } from "../providers";
import type { ProviderType } from "../providers";
import type { ProviderConfig, ProviderRequest } from "../types/providers";
import { storageUtils, validationUtils, providerUtils } from "./provider-utils";

const ENCRYPTION_NOTICE_KEY = "ai-testing-encryption-notice-shown";

export interface ProviderKeyStatus {
  id: string;
  type: ProviderType;
  name: string;
  hasKey: boolean;
  isValid: boolean | null; // null = not tested, true = valid, false = invalid
  lastTested: Date | null;
  isActive: boolean;
}

// eslint-disable-next-line max-lines-per-function
export const useProvidersStore = defineStore("providers", () => {
  // State
  const registry = ref(new ProviderRegistry());
  const providerConfigs = ref<ProviderConfig[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const testingProvider = ref<string | null>(null);

  // Getters
  const activeProviders = computed(() => registry.value.getActiveProviders());

  const supportedProviderTypes = computed(() =>
    ProviderFactory.getSupportedProviders(),
  );

  const providerStatuses = computed((): ProviderKeyStatus[] =>
    providerConfigs.value.map((config) => ({
      id: config.id,
      type: providerUtils.getTypeFromId(config.id),
      name: config.name,
      hasKey: Boolean(config.apiKey && config.apiKey.trim() !== ""),
      isValid: validationUtils.getStatus(config.id),
      lastTested: validationUtils.getLastTested(config.id),
      isActive: config.isActive,
    })),
  );

  const validProviders = computed(() =>
    providerStatuses.value.filter(
      (status) => status.hasKey && status.isValid === true,
    ),
  );

  // Actions
  const addKey = (
    type: ProviderType,
    name: string,
    apiKey: string,
    baseUrl?: string,
  ): string => {
    try {
      error.value = null;

      const config: ProviderConfig = {
        id: providerUtils.generateId(type),
        name: name.trim(),
        apiKey: apiKey.trim(),
        baseUrl,
        isActive: true,
      };

      registry.value.addProvider(type, config);
      providerConfigs.value.push(config);
      storageUtils.save(providerConfigs.value);

      return config.id;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add provider";
      error.value = errorMessage;
      throw new Error(errorMessage);
    }
  };

  const removeKey = (id: string): boolean => {
    try {
      error.value = null;
      const removed = registry.value.removeProvider(id);

      if (removed) {
        const index = providerConfigs.value.findIndex(
          (config) => config.id === id,
        );
        if (index !== -1) {
          providerConfigs.value.splice(index, 1);
        }
        validationUtils.clearStatus(id);
        storageUtils.save(providerConfigs.value);
      }

      return removed;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to remove provider";
      return false;
    }
  };

  const getKey = (id: string): string | null => {
    const config = providerConfigs.value.find((c) => c.id === id);
    return config?.apiKey || null;
  };

  const testKey = async (id: string): Promise<boolean> => {
    const provider = registry.value.getProvider(id);
    if (!provider) return false;

    try {
      testingProvider.value = id;
      error.value = null;

      const models = provider.getModels();
      const firstModel = models[0];
      if (!firstModel) return false;

      const testRequest: ProviderRequest = {
        model: firstModel.id,
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.1,
        maxTokens: 5,
      };

      await provider.call(testRequest);
      validationUtils.setStatus(id, true);
      return true;
    } catch (err) {
      console.warn(`Provider test failed for ${id}:`, err);
      validationUtils.setStatus(id, false);
      return false;
    } finally {
      testingProvider.value = null;
    }
  };

  const initialize = (): void => {
    try {
      const configs = storageUtils.load();
      providerConfigs.value = configs;

      registry.value.clear();
      configs.forEach((config) => {
        const type = providerUtils.getTypeFromId(config.id);
        if (ProviderFactory.isProviderSupported(type)) {
          registry.value.addProvider(type, config);
        }
      });
    } catch (err) {
      console.error("Failed to initialize providers:", err);
      error.value = "Failed to load saved providers";
    }
  };

  const clearAllData = (): void => {
    providerConfigs.value = [];
    registry.value.clear();
    storageUtils.clear();
    error.value = null;
  };

  const hasShownEncryptionNotice = (): boolean => {
    return localStorage.getItem(ENCRYPTION_NOTICE_KEY) === "true";
  };

  const markEncryptionNoticeShown = (): void => {
    localStorage.setItem(ENCRYPTION_NOTICE_KEY, "true");
  };

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading;
  };

  const clearError = (): void => {
    error.value = null;
  };

  return {
    // State
    providerConfigs,
    isLoading,
    error,
    testingProvider,
    // Getters
    activeProviders,
    supportedProviderTypes,
    providerStatuses,
    validProviders,
    // Actions
    addKey,
    removeKey,
    getKey,
    testKey,
    initialize,
    clearAllData,
    hasShownEncryptionNotice,
    markEncryptionNoticeShown,
    setLoading,
    clearError,
  };
});
