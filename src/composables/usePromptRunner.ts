import { ref, computed, type Ref } from "vue";
import type { ProviderRequest, ProviderResponse } from "types/providers";
import { useProvidersStore } from "../store/providers";
import { runPool, sleep, type Task } from "../utils/taskPool";

export interface PromptRunnerState {
  isRunning: boolean;
  result: ProviderResponse | null;
  error: string | null;
  abortController: AbortController | null;
  // Multi-run state
  isRunningRepeated: boolean;
  repeatedResults: ProviderResponse[];
  repeatedErrors: string[];
  completedRuns: number;
  totalRuns: number;
}

export interface RepeatedRunConfig {
  runCount: number;
  allowParallel: boolean;
  parallelConcurrency: number;
  delayMs: number;
}

interface PromptRunnerReturn {
  state: Ref<PromptRunnerState>;
  canRun: Ref<boolean>;
  runPrompt: (providerId: string, request: ProviderRequest) => Promise<void>;
  runRepeated: (
    providerId: string,
    request: ProviderRequest,
    config: RepeatedRunConfig,
  ) => Promise<void>;
  cancelRun: () => void;
  clearResults: () => void;
}

// Helper function to execute a single provider call with timing
const executeSingleCall = async (
  provider: ReturnType<typeof useProvidersStore>["activeProviders"][0],
  request: ProviderRequest,
  providerId: string,
): Promise<ProviderResponse> => {
  const startTime = performance.now();
  const response = await provider.call(request);
  const endTime = performance.now();

  // Add metadata to the response
  response.metadata = {
    ...response.metadata,
    latency: endTime - startTime,
    provider: providerId,
    timestamp: new Date(),
  };

  return response;
};

// Helper function for parallel execution
const executeParallelRuns = async (params: {
  provider: ReturnType<typeof useProvidersStore>["activeProviders"][0];
  request: ProviderRequest;
  providerId: string;
  config: RepeatedRunConfig;
  abortController: AbortController;
}): Promise<{ results: ProviderResponse[]; errors: string[] }> => {
  const { provider, request, providerId, config, abortController } = params;
  const tasks: Task<ProviderResponse>[] = [];

  for (let i = 0; i < config.runCount; i++) {
    tasks.push({
      id: `run-${i}`,
      execute: async (): Promise<ProviderResponse> => {
        return executeSingleCall(provider, request, providerId);
      },
    });
  }

  const taskResults = await runPool(tasks, {
    concurrency: config.parallelConcurrency,
    abortController,
  });

  const results: ProviderResponse[] = [];
  const errors: string[] = [];

  // Process results
  for (const taskResult of taskResults) {
    if (taskResult.status === "completed" && taskResult.result) {
      results.push(taskResult.result);
    } else if (taskResult.status === "failed" && taskResult.error) {
      errors.push(taskResult.error.message);
    } else if (taskResult.status === "cancelled") {
      errors.push("Request was cancelled by user");
    }
  }

  return { results, errors };
};

// Helper function for sequential execution
const executeSequentialRuns = async (params: {
  provider: ReturnType<typeof useProvidersStore>["activeProviders"][0];
  request: ProviderRequest;
  providerId: string;
  config: RepeatedRunConfig;
  abortController: AbortController;
  updateProgress: (completed: number) => void;
}): Promise<{ results: ProviderResponse[]; errors: string[] }> => {
  const {
    provider,
    request,
    providerId,
    config,
    abortController,
    updateProgress,
  } = params;
  const results: ProviderResponse[] = [];
  const errors: string[] = [];

  for (let i = 0; i < config.runCount; i++) {
    if (abortController.signal.aborted) {
      break;
    }

    try {
      if (i > 0 && config.delayMs > 0) {
        await sleep(config.delayMs, abortController);
      }

      const response = await executeSingleCall(provider, request, providerId);
      results.push(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      errors.push(errorMessage);
    }

    updateProgress(i + 1);
  }

  return { results, errors };
};

// Main composable function - creates the prompt runner
export function usePromptRunner(): PromptRunnerReturn {
  const providersStore = useProvidersStore();
  const state = createPromptRunnerState();

  const canRun = computed(() => {
    return (
      !state.value.isRunning &&
      !state.value.isRunningRepeated &&
      providersStore.validProviders.length > 0
    );
  });

  const runPrompt = createRunPromptFunction(state, providersStore);
  const runRepeated = createRunRepeatedFunction(state, providersStore);
  const cancelRun = createCancelRunFunction(state);
  const clearResults = createClearResultsFunction(state);

  return {
    state,
    canRun,
    runPrompt,
    runRepeated,
    cancelRun,
    clearResults,
  };
}

// Helper function to create initial state
function createPromptRunnerState(): Ref<PromptRunnerState> {
  return ref<PromptRunnerState>({
    isRunning: false,
    result: null,
    error: null,
    abortController: null,
    // Multi-run state
    isRunningRepeated: false,
    repeatedResults: [],
    repeatedErrors: [],
    completedRuns: 0,
    totalRuns: 0,
  });
}

// Helper function to create runPrompt method
function createRunPromptFunction(
  state: Ref<PromptRunnerState>,
  providersStore: ReturnType<typeof useProvidersStore>,
) {
  return async (
    providerId: string,
    request: ProviderRequest,
  ): Promise<void> => {
    if (state.value.isRunning) {
      return;
    }

    // Reset previous results
    state.value.result = null;
    state.value.error = null;
    state.value.isRunning = true;
    state.value.abortController = new AbortController();

    try {
      const provider = providersStore.activeProviders.find(
        (p) => p.getId() === providerId,
      );
      if (!provider) {
        throw new Error(`Provider ${providerId} not found or not active`);
      }

      const response = await executeSingleCall(provider, request, providerId);
      state.value.result = response;
    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          state.value.error = "Request was cancelled by user";
        } else {
          state.value.error = error.message;
        }
      } else {
        state.value.error = "An unknown error occurred";
      }
    } finally {
      state.value.isRunning = false;
      state.value.abortController = null;
    }
  };
}

// Helper function to create runRepeated method
function createRunRepeatedFunction(
  state: Ref<PromptRunnerState>,
  providersStore: ReturnType<typeof useProvidersStore>,
) {
  return async (
    providerId: string,
    request: ProviderRequest,
    config: RepeatedRunConfig,
  ): Promise<void> => {
    if (state.value.isRunning || state.value.isRunningRepeated) {
      return;
    }

    // Reset previous results
    state.value.result = null;
    state.value.error = null;
    state.value.isRunningRepeated = true;
    state.value.repeatedResults = [];
    state.value.repeatedErrors = [];
    state.value.completedRuns = 0;
    state.value.totalRuns = config.runCount;
    state.value.abortController = new AbortController();

    try {
      const provider = providersStore.activeProviders.find(
        (p) => p.getId() === providerId,
      );
      if (!provider) {
        throw new Error(`Provider ${providerId} not found or not active`);
      }

      let results: ProviderResponse[];
      let errors: string[];

      if (config.allowParallel && config.runCount > 1) {
        // Parallel execution
        const parallelResult = await executeParallelRuns({
          provider,
          request,
          providerId,
          config,
          abortController: state.value.abortController,
        });
        results = parallelResult.results;
        errors = parallelResult.errors;
        state.value.completedRuns = config.runCount;
      } else {
        // Sequential execution
        const sequentialResult = await executeSequentialRuns({
          provider,
          request,
          providerId,
          config,
          abortController: state.value.abortController,
          updateProgress: (completed: number) => {
            state.value.completedRuns = completed;
          },
        });
        results = sequentialResult.results;
        errors = sequentialResult.errors;
      }

      state.value.repeatedResults = results;
      state.value.repeatedErrors = errors;

      // Set the first successful result as the main result for compatibility
      const firstResult = state.value.repeatedResults[0];
      if (firstResult) {
        state.value.result = firstResult;
      }
    } catch (error) {
      // Handle overall errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          state.value.error = "Request was cancelled by user";
        } else {
          state.value.error = error.message;
        }
      } else {
        state.value.error = "An unknown error occurred";
      }
    } finally {
      state.value.isRunningRepeated = false;
      state.value.abortController = null;
    }
  };
}

// Helper function to create cancelRun method
function createCancelRunFunction(state: Ref<PromptRunnerState>) {
  return (): void => {
    if (
      state.value.abortController &&
      (state.value.isRunning || state.value.isRunningRepeated)
    ) {
      state.value.abortController.abort();
    }
  };
}

// Helper function to create clearResults method
function createClearResultsFunction(state: Ref<PromptRunnerState>) {
  return (): void => {
    state.value.result = null;
    state.value.error = null;
    state.value.repeatedResults = [];
    state.value.repeatedErrors = [];
    state.value.completedRuns = 0;
    state.value.totalRuns = 0;
  };
}
