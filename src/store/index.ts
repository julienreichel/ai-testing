import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Provider, TestCase, TestRun } from '../types'

const MAX_RECENT_RUNS = 10

export const useAppStore = defineStore('app', () => {
  // State
  const providers = ref<Provider[]>([])
  const testCases = ref<TestCase[]>([])
  const testRuns = ref<TestRun[]>([])
  const isLoading = ref(false)

  // Getters
  const activeProviders = computed(() =>
    providers.value.filter(p => p.isActive)
  )

  const recentTestRuns = computed(() =>
    testRuns.value
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, MAX_RECENT_RUNS)
  )

  const testRunsByStatus = computed(() => {
    const runsByStatus = testRuns.value.reduce((acc, run) => {
      acc[run.status] = (acc[run.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return runsByStatus
  })

  // Actions
  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  return {
    // State
    providers,
    testCases,
    testRuns,
    isLoading,
    // Getters
    activeProviders,
    recentTestRuns,
    testRunsByStatus,
    // Actions
    setLoading,
  }
})
