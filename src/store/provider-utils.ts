// Provider store utilities
import type { ProviderConfig } from '../types/providers'
import type { ProviderType } from '../providers'
import { ProviderFactory } from '../providers'

const STORAGE_KEY = 'ai-testing-providers'

export const storageUtils = {
  save: (configs: ProviderConfig[]): void => {
    try {
      const dataToSave = configs.map(config => ({
        ...config,
        // Note: API keys are stored in localStorage (browser-only)
        // This is secure for a client-side app but keys stay local
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (err) {
      console.error('Failed to save providers to localStorage:', err)
      throw new Error('Failed to save provider settings')
    }
  },

  load: (): ProviderConfig[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return []
      return JSON.parse(saved) as ProviderConfig[]
    } catch (err) {
      console.error('Failed to load providers from localStorage:', err)
      throw new Error('Failed to load saved providers')
    }
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY)

    // Clear all validation statuses
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('provider_valid_') || key.startsWith('provider_tested_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  },
}

export const validationUtils = {
  getStatus: (id: string): boolean | null => {
    const key = `provider_valid_${id}`
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  },

  setStatus: (id: string, isValid: boolean): void => {
    const validationKey = `provider_valid_${id}`
    const testedKey = `provider_tested_${id}`

    localStorage.setItem(validationKey, JSON.stringify(isValid))
    localStorage.setItem(testedKey, new Date().toISOString())
  },

  clearStatus: (id: string): void => {
    localStorage.removeItem(`provider_valid_${id}`)
    localStorage.removeItem(`provider_tested_${id}`)
  },

  getLastTested: (id: string): Date | null => {
    const key = `provider_tested_${id}`
    const stored = localStorage.getItem(key)
    return stored ? new Date(stored) : null
  },
}

export const providerUtils = {
  generateId: (type: ProviderType): string => {
    const timestamp = Date.now()
    const BASE_36 = 36
    const SUBSTRING_START = 2
    const random = Math.random().toString(BASE_36).substring(SUBSTRING_START)
    return `${type}_${timestamp}_${random}`
  },

  getTypeFromId: (id: string): ProviderType => {
    const type = id.split('_')[0] as ProviderType
    return ProviderFactory.isProviderSupported(type) ? type : 'mock'
  },
}
