/**
 * Quick-Run Types - Multi-provider parallel execution from Test View
 * Enables running tests directly from TestCaseDetailView with multiple providers
 */

import type { TestCase } from "./testManagement";

/**
 * Configuration for a single provider in Quick-Run
 */
export interface QuickRunProviderConfig {
  /** Unique identifier for this provider configuration */
  id: string;
  /** Provider ID from providers store */
  providerId: string;
  /** Model to use for this provider */
  model: string;
  /** Temperature setting (0-2) */
  temperature: number;
  /** Maximum tokens for output */
  maxTokens: number;
  /** Whether to run multiple executions in parallel for this provider */
  allowParallel: boolean;
  /** Number of concurrent executions (when parallel is enabled) */
  parallelConcurrency: number;
}

/**
 * Overall Quick-Run session configuration
 */
export interface QuickRunConfig {
  /** Test case to execute */
  testCase: TestCase;
  /** List of provider configurations to run */
  providers: QuickRunProviderConfig[];
  /** Number of times to execute each provider */
  runsPerProvider: number;
  /** Delay between runs (when not parallel) */
  delayMs: number;
}

/**
 * Execution state for a single provider
 */
export interface QuickRunProviderState {
  /** Provider configuration ID */
  providerId: string;
  /** Current execution status */
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  /** Number of completed runs */
  completedRuns: number;
  /** Total runs planned */
  totalRuns: number;
  /** Current progress percentage (0-100) */
  progress: number;
  /** Results from completed runs */
  results: QuickRunSingleResult[];
  /** Errors from failed runs */
  errors: string[];
  /** Start time for this provider */
  startTime?: Date;
  /** End time for this provider */
  endTime?: Date;
  /** Current latency in milliseconds */
  latency?: number;
}

/**
 * Single execution result within a Quick-Run
 */
export interface QuickRunSingleResult {
  /** Unique identifier for this result */
  id: string;
  /** Run index (0-based) */
  runIndex: number;
  /** Provider response content */
  response: string;
  /** Token usage information */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Cost information */
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  /** Execution timing */
  timing: {
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
  };
  /** Rule validation results */
  ruleResults?: {
    passed: boolean;
    totalRules: number;
    passedRules: number;
    details: Array<{
      ruleId: string;
      passed: boolean;
      message: string;
    }>;
  };
}

/**
 * Overall Quick-Run session state
 */
export interface QuickRunState {
  /** Current session status */
  status: "idle" | "running" | "completed" | "cancelled" | "failed";
  /** Per-provider execution states */
  providers: Map<string, QuickRunProviderState>;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Total completed runs across all providers */
  totalCompletedRuns: number;
  /** Total planned runs across all providers */
  totalPlannedRuns: number;
  /** Session start time */
  startTime?: Date;
  /** Session end time */
  endTime?: Date;
  /** Session configuration */
  config?: QuickRunConfig;
  /** Abort controller for cancellation */
  abortController?: AbortController;
}

/**
 * Progress information for UI display
 */
export interface QuickRunProgress {
  /** Overall completion percentage */
  percentage: number;
  /** Current phase description */
  phase: string;
  /** Per-provider progress details */
  providerDetails: Array<{
    providerId: string;
    providerName: string;
    model: string;
    completedRuns: number;
    totalRuns: number;
    percentage: number;
    status: QuickRunProviderState["status"];
  }>;
  /** Estimated time remaining (if calculable) */
  estimatedTimeRemaining?: number;
}

/**
 * Quick-Run session summary for persistence
 */
export interface QuickRunSession {
  /** Unique session identifier */
  id: string;
  /** Test case that was executed */
  testCaseId: string;
  /** Session configuration */
  config: QuickRunConfig;
  /** Session metadata */
  metadata: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: QuickRunState["status"];
    totalRuns: number;
    completedRuns: number;
    successfulRuns: number;
  };
  /** All execution results */
  results: QuickRunSingleResult[];
  /** Any errors that occurred */
  errors: string[];
}
