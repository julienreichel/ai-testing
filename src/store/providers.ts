import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ProviderRegistry, ProviderFactory } from '../providers'
import type { ProviderType } from '../providers'
import type { ProviderConfig } from '../types/providers'

export const useProvidersStore = defineStore('providers', () => {
  // State
  const registry = ref(new ProviderRegistry())
  const providerConfigs = ref<ProviderConfig[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeProviders = computed(() =>
    registry.value.getActiveProviders()
  )

  const supportedProviderTypes = computed(() =>
    ProviderFactory.getSupportedProviders()
  )

  // Actions
  const addProvider = (type: ProviderType, config: Omit<ProviderConfig, 'id'>): void => {
    const fullConfig: ProviderConfig = {
      ...config,
      id: generateProviderId(type),
    }

    registry.value.addProvider(type, fullConfig)
    providerConfigs.value.push(fullConfig)
  }

  const getProvider = (id: string): ReturnType<ProviderRegistry['getProvider']> => {
    return registry.value.getProvider(id)
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const clearError = (): void => {
    error.value = null
  }

  // Helper function to generate provider IDs
  const generateProviderId = (type: ProviderType): string => {
    const timestamp = Date.now()
    const BASE_36 = 36
    const SUBSTRING_START = 2
    const random = Math.random().toString(BASE_36).substring(SUBSTRING_START)
    return `${type}_${timestamp}_${random}`
  }

  return {
    // State
    providerConfigs,
    isLoading,
    error,
    // Getters
    activeProviders,
    supportedProviderTypes,
    // Actions
    addProvider,
    getProvider,
    setLoading,
    clearError,
  }
})
