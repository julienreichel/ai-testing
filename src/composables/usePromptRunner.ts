import { ref, computed, type Ref } from "vue";
import type { ProviderRequest, ProviderResponse } from "../types/providers";
import { useProvidersStore } from "../store/providers";

export interface PromptRunnerState {
  isRunning: boolean;
  result: ProviderResponse | null;
  error: string | null;
  abortController: AbortController | null;
}

interface PromptRunnerReturn {
  state: Ref<PromptRunnerState>;
  canRun: Ref<boolean>;
  runPrompt: (providerId: string, request: ProviderRequest) => Promise<void>;
  cancelRun: () => void;
  clearResults: () => void;
}

export function usePromptRunner(): PromptRunnerReturn {
  const providersStore = useProvidersStore();

  const state = ref<PromptRunnerState>({
    isRunning: false,
    result: null,
    error: null,
    abortController: null,
  });

  const canRun = computed(() => {
    return !state.value.isRunning && providersStore.validProviders.length > 0;
  });

  const runPrompt = async (
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
      const startTime = performance.now();

      // Use real provider execution instead of mock
      const provider = providersStore.activeProviders.find(
        (p) => p.getId() === providerId,
      );
      if (!provider) {
        throw new Error(`Provider ${providerId} not found or not active`);
      }

      // Execute the actual request
      const response = await provider.call(request);

      const endTime = performance.now();

      // Add metadata to the response
      response.metadata = {
        ...response.metadata,
        latency: endTime - startTime,
        provider: providerId,
        timestamp: new Date(),
      };

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

  const cancelRun = (): void => {
    if (state.value.abortController && state.value.isRunning) {
      state.value.abortController.abort();
    }
  };

  const clearResults = (): void => {
    state.value.result = null;
    state.value.error = null;
  };

  return {
    state: state as Ref<PromptRunnerState>,
    canRun,
    runPrompt,
    cancelRun,
    clearResults,
  };
}
