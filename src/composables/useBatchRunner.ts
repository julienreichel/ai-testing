/**
 * Batch Runner Composable - Core batch execution engine for AI testing
 * Provides sequential execution with retry logic and statistical analysis
 */

import { reactive, computed, type ComputedRef } from "vue";
import type { TestCase } from "../types/testManagement";
import type { ProviderRequest } from "../types/providers";
import { useProvidersStore } from "../store/providers";
import { useRulesEngine } from "./useRulesEngine";
import { useBatchRunPersistence } from "./useBatchRunPersistence";

// Constants to avoid magic numbers
const PERCENTAGE_MULTIPLIER = 100;
const MEDIAN_PERCENTILE = 0.5;
const P90_PERCENTILE = 0.9;
const EXPONENTIAL_BASE = 2;
const MAX_RETRY_DELAY_MS = 30000;
const DEFAULT_RETRY_DELAY_MS = 1000;
const UI_UPDATE_DELAY_MS = 10;
const PROGRESS_UPDATE_INTERVAL = 5;



// Configuration for batch runs
export interface BatchRunConfig {
  testCase: TestCase;
  providerId: string;
  model: string;
  runCount: number;
  maxRetries: number;
  delayMs: number;
}

export interface BatchRunResult {
  id: string;
  runIndex: number;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  response?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  passed?: boolean;
  error?: string;
  retryCount: number;
}

export interface BatchStatistics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  passedRuns: number;
  passRate: number;
  avgDuration: number;
  p50Duration: number;
  p90Duration: number;
  avgTokens: number;
  totalCost: number;
  avgCost: number;
  errorRate: number;
}

interface BatchRunState {
  isRunning: boolean;
  isCancelled: boolean;
  completedRuns: number;
  totalRuns: number;
  results: BatchRunResult[];
  errors: string[];
  startTime?: Date;
  endTime?: Date;
}

const createBatchStatistics = (results: BatchRunResult[]): BatchStatistics => {
  const completed = results.filter(r => r.status === "completed");
  const technicallyFailed = results.filter(r => r.status === "failed");
  const passed = completed.filter(r => r.passed === true);
  const validationFailed = completed.filter(r => r.passed === false);
  const totalFailed = technicallyFailed.length + validationFailed.length;

  const durations = completed
    .map(r => r.duration)
    .filter((d): d is number => d !== undefined)
    .sort((a, b) => a - b);

  const tokens = completed
    .map(r => r.tokenUsage?.totalTokens)
    .filter((t): t is number => t !== undefined);

  const costs = completed
    .map(r => r.cost)
    .filter((c): c is number => c !== undefined);

  const avgDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  const p50Duration = durations.length > 0
    ? durations[Math.floor(durations.length * MEDIAN_PERCENTILE)] || 0
    : 0;

  const p90Duration = durations.length > 0
    ? durations[Math.floor(durations.length * P90_PERCENTILE)] || 0
    : 0;

  const avgTokens = tokens.length > 0
    ? tokens.reduce((sum, t) => sum + t, 0) / tokens.length
    : 0;

  const totalCost = costs.reduce((sum, c) => sum + c, 0);
  const avgCost = costs.length > 0 ? totalCost / costs.length : 0;

  return {
    totalRuns: results.length,
    completedRuns: completed.length,
    failedRuns: totalFailed,
    passedRuns: passed.length,
    passRate: completed.length > 0 ? (passed.length / completed.length) * PERCENTAGE_MULTIPLIER : 0,
    avgDuration,
    p50Duration,
    p90Duration,
    avgTokens,
    totalCost,
    avgCost,
    errorRate: results.length > 0 ? (totalFailed / results.length) * PERCENTAGE_MULTIPLIER : 0,
  };
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const calculateRetryDelay = (retryCount: number): number => {
  const delay = DEFAULT_RETRY_DELAY_MS * Math.pow(EXPONENTIAL_BASE, retryCount);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
};

const updatePersistenceProgress = async (
  batchPersistence: ReturnType<typeof useBatchRunPersistence>,
  batchSession: unknown,
  results: BatchRunResult[]
): Promise<void> => {
  if (!batchSession) return;

  try {
    await batchPersistence.updateBatchRunProgress(
      results,
      createBatchStatistics(results)
    );
  } catch (error) {
    console.warn("Failed to update batch run progress:", error);
  }
};

const completePersistenceSession = async (
  batchPersistence: ReturnType<typeof useBatchRunPersistence>,
  batchSession: unknown,
  results: BatchRunResult[],
  isCancelled: boolean
): Promise<void> => {
  if (!batchSession) return;

  try {
    const finalStatus = isCancelled ? "cancelled" : "completed";
    await batchPersistence.completeBatchRun(
      results,
      createBatchStatistics(results),
      finalStatus
    );
  } catch (error) {
    console.warn("Failed to complete batch run in database:", error);
  }
};

const executeSingleRun = async (params: {
  config: BatchRunConfig;
  runIndex: number;
  isCancelled: () => boolean;
  providersStore: ReturnType<typeof useProvidersStore>;
  rulesEngine: ReturnType<typeof useRulesEngine>;
}): Promise<BatchRunResult> => {
  const { config, runIndex, isCancelled, providersStore, rulesEngine } = params;
  const result: BatchRunResult = {
    id: `${config.testCase.id}-${runIndex}-${Date.now()}`,
    runIndex,
    status: "running",
    startTime: new Date(),
    retryCount: 0,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (isCancelled()) {
      result.status = "cancelled";
      return result;
    }

    try {
      if (attempt > 0) {
        const retryDelay = calculateRetryDelay(attempt - 1);
        await sleep(retryDelay);
        result.retryCount = attempt;
      }

      // Get the provider
      const provider = providersStore.activeProviders.find(
        (p) => p.getId() === config.providerId
      );
      if (!provider) {
        throw new Error(`Provider ${config.providerId} not found or not active`);
      }

      // Validate that the specified model is available for this provider
      const models = provider.getModels();
      const selectedModel = models.find(m => m.id === config.model);
      if (!selectedModel) {
        throw new Error(`Model '${config.model}' not available for provider ${config.providerId}`);
      }

      // Create the provider request
      const providerRequest: ProviderRequest = {
        model: config.model,
        messages: [
          { role: "user", content: config.testCase.prompt }
        ],
        temperature: 0.7,
        maxTokens: 150,
      };

      // Execute the actual request
      const response = await provider.call(providerRequest);

      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.response = response.content;
      result.tokenUsage = {
        promptTokens: response.usage.inputTokens,
        completionTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
      };
      result.cost = response.cost.totalCost;

      // Validate against test case rules
      if (config.testCase.rules && config.testCase.rules.length > 0) {
        const ruleSetResults = rulesEngine.validateRuleSets(
          config.testCase.rules,
          response.content
        );

        const overallResult = rulesEngine.getOverallResult(ruleSetResults);
        result.passed = overallResult.pass;
      } else {
        // If no rules defined, consider it passed
        result.passed = true;
      }

      result.status = "completed";
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries) {
        result.status = "failed";
        result.error = lastError.message;
        result.endTime = new Date();
        result.duration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }
    }
  }

  return result;
};

export function useBatchRunner(): {
  state: BatchRunState;
  progress: ComputedRef<number>;
  statistics: ComputedRef<BatchStatistics>;
  runBatch: (config: BatchRunConfig) => Promise<void>;
  cancelBatch: () => void;
  resetBatch: () => void;
} {
  // Initialize dependencies
  const providersStore = useProvidersStore();
  const rulesEngine = useRulesEngine();
  const batchPersistence = useBatchRunPersistence();

  const state = reactive<BatchRunState>({
    isRunning: false,
    isCancelled: false,
    completedRuns: 0,
    totalRuns: 0,
    results: [],
    errors: [],
  });

  const progress = computed(() => {
    if (state.totalRuns === 0) return 0;
    return Math.round((state.completedRuns / state.totalRuns) * PERCENTAGE_MULTIPLIER);
  });

  const statistics = computed((): BatchStatistics => {
    return createBatchStatistics(state.results);
  });

  const runBatch = async (config: BatchRunConfig): Promise<void> => {
    // Reset state
    state.isRunning = true;
    state.isCancelled = false;
    state.completedRuns = 0;
    state.totalRuns = config.runCount;
    state.results = [];
    state.errors = [];
    state.startTime = new Date();

    // Save batch run start to database
    let batchSession = null;
    try {
      batchSession = await batchPersistence.saveBatchRunStart(
        config,
        config.testCase.id,
        config.testCase.projectId || "default"
      );
    } catch (error) {
      console.warn("Failed to save batch run to database:", error);
      // Continue without persistence
    }

    try {
      for (let i = 0; i < config.runCount; i++) {
        if (state.isCancelled) break;

        if (i > 0 && config.delayMs > 0) {
          await sleep(config.delayMs);
        }

        const result = await executeSingleRun({
          config,
          runIndex: i,
          isCancelled: () => state.isCancelled,
          providersStore,
          rulesEngine,
        });
        state.results.push(result);
        state.completedRuns++;

        if (result.status === "failed" && result.error) {
          state.errors.push(`Run ${i}: ${result.error}`);
        }

        // Allow Vue reactivity to update the UI
        await new Promise(resolve => setTimeout(resolve, UI_UPDATE_DELAY_MS));

        // Update persistence with progress (every few runs to avoid too many DB writes)
        if (i % PROGRESS_UPDATE_INTERVAL === 0 || i === config.runCount - 1) {
          await updatePersistenceProgress(batchPersistence, batchSession, state.results);
        }
      }

      // Complete batch run in database
      await completePersistenceSession(batchPersistence, batchSession, state.results, state.isCancelled);
    } finally {
      state.isRunning = false;
      state.endTime = new Date();
    }
  };



  const cancelBatch = (): void => {
    state.isCancelled = true;
  };

  const resetBatch = (): void => {
    Object.assign(state, {
      isRunning: false,
      isCancelled: false,
      completedRuns: 0,
      totalRuns: 0,
      results: [],
      errors: [],
      startTime: undefined,
      endTime: undefined,
    });
  };

  return {
    state,
    progress,
    statistics,
    runBatch,
    cancelBatch,
    resetBatch,
  };
}
