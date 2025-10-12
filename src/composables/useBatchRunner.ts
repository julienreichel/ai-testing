/**
 * Batch Runner Composable - Core batch execution engine for AI testing
 * Provides sequential execution with retry logic and statistical analysis
 */

import { reactive, computed, type ComputedRef } from "vue";
import type { TestCase } from "../types/testManagement";

// Constants to avoid magic numbers
const PERCENTAGE_MULTIPLIER = 100;
const MEDIAN_PERCENTILE = 0.5;
const P90_PERCENTILE = 0.9;
const EXPONENTIAL_BASE = 2;
const MAX_RETRY_DELAY_MS = 30000;
const DEFAULT_RETRY_DELAY_MS = 1000;

// Mock simulation constants
const MIN_SIMULATION_DELAY = 500;
const MAX_SIMULATION_DELAY = 1000;
const MIN_PROMPT_TOKENS = 10;
const MAX_PROMPT_TOKENS_RANGE = 50;
const MIN_COMPLETION_TOKENS = 20;
const MAX_COMPLETION_TOKENS_RANGE = 80;
const MOCK_COST_PER_TOKEN = 0.001;
const MOCK_PASS_RATE = 0.9;

// Configuration for batch runs
export interface BatchRunConfig {
  testCase: TestCase;
  providerId: string;
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
  const failed = results.filter(r => r.status === "failed");
  const passed = completed.filter(r => r.passed === true);
  
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
    failedRuns: failed.length,
    passedRuns: passed.length,
    passRate: completed.length > 0 ? (passed.length / completed.length) * PERCENTAGE_MULTIPLIER : 0,
    avgDuration,
    p50Duration,
    p90Duration,
    avgTokens,
    totalCost,
    avgCost,
    errorRate: results.length > 0 ? (failed.length / results.length) * PERCENTAGE_MULTIPLIER : 0,
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

const executeSingleRun = async (params: {
  config: BatchRunConfig;
  runIndex: number;
  isCancelled: () => boolean;
}): Promise<BatchRunResult> => {
  const { config, runIndex, isCancelled } = params;
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

      // TODO: Replace with actual provider integration
      // Simulate API call for now
      const simulationDelay = MIN_SIMULATION_DELAY + Math.random() * MAX_SIMULATION_DELAY;
      await sleep(simulationDelay);
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.response = `Mock response for run ${runIndex}`;
      result.tokenUsage = {
        promptTokens: MIN_PROMPT_TOKENS + Math.floor(Math.random() * MAX_PROMPT_TOKENS_RANGE),
        completionTokens: MIN_COMPLETION_TOKENS + Math.floor(Math.random() * MAX_COMPLETION_TOKENS_RANGE),
        totalTokens: 0,
      };
      result.tokenUsage.totalTokens = result.tokenUsage.promptTokens + result.tokenUsage.completionTokens;
      result.cost = result.tokenUsage.totalTokens * MOCK_COST_PER_TOKEN;

      // Mock rule validation
      result.passed = Math.random() < MOCK_PASS_RATE;
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
        });
        state.results.push(result);
        state.completedRuns++;

        if (result.status === "failed" && result.error) {
          state.errors.push(`Run ${i}: ${result.error}`);
        }
      }
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