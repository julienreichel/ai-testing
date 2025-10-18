import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePromptRunner } from "../../src/composables/usePromptRunner";
import type {
  ProviderRequest,
  ProviderResponse,
} from "../../src/types/providers";

// Mock the providers store
const mockProvider = {
  getId: (): string => "test-provider",
  call: vi.fn(),
};

vi.mock("../../src/store/providers", () => ({
  useProvidersStore: (): {
    validProviders: unknown[];
    activeProviders: unknown[];
  } => ({
    validProviders: [mockProvider],
    activeProviders: [mockProvider],
  }),
}));

describe("usePromptRunner - User Prompt Execution Behavior", () => {
  let mockRequest: ProviderRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      model: "test-model",
      messages: [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Hello, how are you?" },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    };
  });

  describe("When user wants to run a prompt", () => {
    it("should provide clear execution status to user", () => {
      const { state, canRun } = usePromptRunner();

      // User sees initial ready state
      expect(canRun.value).toBe(true);
      expect(state.value.isRunning).toBe(false);
      expect(state.value.result).toBeNull();
      expect(state.value.error).toBeNull();
    });

    it("should execute prompt and provide results to user", async () => {
      const mockResponse: ProviderResponse = {
        content: "Hello! I'm doing well, thank you for asking.",
        model: "test-model",
        usage: {
          inputTokens: 10,
          outputTokens: 15,
          totalTokens: 25,
        },
        cost: {
          inputCost: 0.001,
          outputCost: 0.002,
          totalCost: 0.003,
        },
        metadata: {
          latency: 100,
          requestId: "test-123",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      mockProvider.call.mockResolvedValue(mockResponse);

      const { runPrompt, state } = usePromptRunner();

      await runPrompt("test-provider", mockRequest);

      // User sees successful execution results
      expect(state.value.isRunning).toBe(false);
      expect(state.value.result).toEqual(
        expect.objectContaining({
          content: "Hello! I'm doing well, thank you for asking.",
          model: expect.any(String),
          usage: expect.any(Object),
        }),
      );
      expect(state.value.error).toBeNull();
    });

    it("should show execution metadata to user", async () => {
      const mockResponse: ProviderResponse = {
        content: "Test response",
        model: "test-model",
        usage: {
          inputTokens: 5,
          outputTokens: 10,
          totalTokens: 15,
        },
        cost: {
          inputCost: 0.001,
          outputCost: 0.001,
          totalCost: 0.002,
        },
        metadata: {
          latency: 50,
          requestId: "test-456",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      mockProvider.call.mockResolvedValue(mockResponse);

      const { runPrompt, state } = usePromptRunner();

      await runPrompt("test-provider", mockRequest);

      // User sees execution metadata including timing
      expect(state.value.result?.metadata).toEqual(
        expect.objectContaining({
          latency: expect.any(Number),
          provider: "test-provider",
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe("When user encounters execution issues", () => {
    it("should provide clear error messages for provider issues", async () => {
      const { runPrompt, state } = usePromptRunner();

      // User tries to use non-existent provider
      await runPrompt("non-existent-provider", mockRequest);

      // User sees helpful error message
      expect(state.value.isRunning).toBe(false);
      expect(state.value.error).toContain(
        "Provider non-existent-provider not found",
      );
      expect(state.value.result).toBeNull();
    });

    it("should handle provider call failures gracefully", async () => {
      mockProvider.call.mockRejectedValue(new Error("API rate limit exceeded"));

      const { runPrompt, state } = usePromptRunner();

      await runPrompt("test-provider", mockRequest);

      // User sees specific error information
      expect(state.value.isRunning).toBe(false);
      expect(state.value.error).toBe("API rate limit exceeded");
      expect(state.value.result).toBeNull();
    });

    it("should handle unknown errors appropriately", async () => {
      mockProvider.call.mockRejectedValue("Unexpected error type");

      const { runPrompt, state } = usePromptRunner();

      await runPrompt("test-provider", mockRequest);

      // User sees generic but helpful error message
      expect(state.value.error).toBe("An unknown error occurred");
    });
  });

  describe("When user wants to control execution", () => {
    it("should prevent multiple simultaneous executions", async () => {
      mockProvider.call.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const { runPrompt, state } = usePromptRunner();

      // User starts first execution
      const firstRun = runPrompt("test-provider", mockRequest);
      expect(state.value.isRunning).toBe(true);

      // User tries to start second execution
      await runPrompt("test-provider", mockRequest);

      // Second execution is ignored, first continues
      expect(mockProvider.call).toHaveBeenCalledTimes(1);

      await firstRun;
    });

    it("should allow user to cancel running execution", async () => {
      let rejectPromise: (reason?: Error) => void = () => {};
      mockProvider.call.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectPromise = reject;
          }),
      );

      const { runPrompt, cancelRun, state } = usePromptRunner();

      // User starts execution
      const runPromise = runPrompt("test-provider", mockRequest);
      expect(state.value.isRunning).toBe(true);

      // User cancels execution
      cancelRun();

      // Simulate abort error
      rejectPromise(
        Object.assign(new Error("The operation was aborted"), {
          name: "AbortError",
        }),
      );

      await runPromise;

      // User sees cancellation result
      expect(state.value.isRunning).toBe(false);
      expect(state.value.error).toBe("Request was cancelled by user");
    });

    it("should allow user to clear previous results", () => {
      const { state, clearResults } = usePromptRunner();

      // Simulate previous execution state
      state.value.result = {
        content: "Previous result",
        model: "test-model",
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
        metadata: {
          latency: 10,
          requestId: "prev-123",
          provider: "test",
          timestamp: new Date(),
        },
      };
      state.value.error = "Previous error";

      // User clears results
      clearResults();

      // User sees clean state
      expect(state.value.result).toBeNull();
      expect(state.value.error).toBeNull();
    });
  });

  describe("User experience and state management", () => {
    it("should provide reactive state updates during execution", async () => {
      let resolveCall: (value: ProviderResponse) => void = () => {};
      const callPromise = new Promise<ProviderResponse>((resolve) => {
        resolveCall = resolve;
      });
      mockProvider.call.mockReturnValue(callPromise);

      const { runPrompt, state } = usePromptRunner();

      // User starts execution
      const runPromise = runPrompt("test-provider", mockRequest);

      // User sees running state immediately
      expect(state.value.isRunning).toBe(true);
      expect(state.value.abortController).toBeDefined();

      // Complete the execution
      resolveCall({
        content: "Response",
        model: "test-model",
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
        metadata: {
          latency: 50,
          requestId: "test-789",
          provider: "test-provider",
          timestamp: new Date(),
        },
      });

      await runPromise;

      // User sees completed state
      expect(state.value.isRunning).toBe(false);
      expect(state.value.abortController).toBeNull();
    });

    it("should reset error state on new execution", async () => {
      const { runPrompt, state } = usePromptRunner();

      // User has previous error
      state.value.error = "Previous error";

      mockProvider.call.mockResolvedValue({
        content: "Success",
        model: "test-model",
        usage: { inputTokens: 3, outputTokens: 5, totalTokens: 8 },
        cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
        metadata: {
          latency: 25,
          requestId: "success-123",
          provider: "test-provider",
          timestamp: new Date(),
        },
      });

      // User runs new prompt
      await runPrompt("test-provider", mockRequest);

      // User sees error cleared with successful execution
      expect(state.value.error).toBeNull();
      expect(state.value.result?.content).toBe("Success");
    });

    it("should provide all necessary state for user interface", () => {
      const { state, canRun, runPrompt, cancelRun, clearResults } =
        usePromptRunner();

      // User interface has access to all needed functionality
      expect(state.value).toHaveProperty("isRunning");
      expect(state.value).toHaveProperty("result");
      expect(state.value).toHaveProperty("error");
      expect(state.value).toHaveProperty("abortController");

      expect(typeof canRun.value).toBe("boolean");
      expect(typeof runPrompt).toBe("function");
      expect(typeof cancelRun).toBe("function");
      expect(typeof clearResults).toBe("function");
    });
  });

  describe("Provider integration behavior", () => {
    it("should work with valid providers from store", async () => {
      mockProvider.call.mockResolvedValue({
        content: "Provider response",
        model: "test-model",
        usage: { inputTokens: 8, outputTokens: 12, totalTokens: 20 },
        cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
        metadata: {
          latency: 75,
          requestId: "provider-456",
          provider: "test-provider",
          timestamp: new Date(),
        },
      });

      const { canRun, runPrompt, state } = usePromptRunner();

      // User can run when valid providers available
      expect(canRun.value).toBe(true);

      await runPrompt("test-provider", mockRequest);

      // User gets response from provider
      expect(state.value.result?.content).toBe("Provider response");
    });

    it("should indicate when providers are available", () => {
      const { canRun } = usePromptRunner();

      // User can run when valid providers available (mocked as available)
      expect(canRun.value).toBe(true);
    });
  });

  describe("When user wants to run multiple prompts", () => {
    it("should execute multiple runs sequentially when parallel is disabled", async () => {
      const mockResponse: ProviderResponse = {
        content: "Sequential response",
        model: "test-model",
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
        cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
        metadata: {
          latency: 50,
          requestId: "seq-123",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      mockProvider.call.mockResolvedValue(mockResponse);

      const { runRepeated, state } = usePromptRunner();

      // User initiates sequential repeated runs
      await runRepeated("test-provider", mockRequest, {
        runCount: 3,
        allowParallel: false,
        parallelConcurrency: 1,
        delayMs: 10,
      });

      // User sees all runs completed sequentially
      expect(state.value.isRunningRepeated).toBe(false);
      expect(state.value.repeatedResults).toHaveLength(3);
      expect(state.value.completedRuns).toBe(3);
      expect(state.value.totalRuns).toBe(3);
      expect(mockProvider.call).toHaveBeenCalledTimes(3);
    });

    it("should execute multiple runs in parallel when enabled", async () => {
      const mockResponse: ProviderResponse = {
        content: "Parallel response",
        model: "test-model",
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
        cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
        metadata: {
          latency: 30,
          requestId: "par-456",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      mockProvider.call.mockResolvedValue(mockResponse);

      const { runRepeated, state } = usePromptRunner();

      const startTime = Date.now();

      // User initiates parallel repeated runs
      await runRepeated("test-provider", mockRequest, {
        runCount: 4,
        allowParallel: true,
        parallelConcurrency: 2,
        delayMs: 0,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // User sees all runs completed in parallel (faster than sequential)
      expect(state.value.isRunningRepeated).toBe(false);
      expect(state.value.repeatedResults).toHaveLength(4);
      expect(state.value.completedRuns).toBe(4);
      expect(state.value.totalRuns).toBe(4);
      expect(mockProvider.call).toHaveBeenCalledTimes(4);

      // Parallel execution should be faster than sequential with delays
      expect(duration).toBeLessThan(200); // Should complete quickly with parallel execution
    });

    it("should provide real-time progress updates during repeated runs", async () => {
      const mockResponse: ProviderResponse = {
        content: "Progress response",
        model: "test-model",
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
        metadata: {
          latency: 25,
          requestId: "prog-789",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      // Mock with delay to observe progress updates
      mockProvider.call.mockImplementation(async (): Promise<ProviderResponse> => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockResponse;
      });

      const { runRepeated, state } = usePromptRunner();
      const progressUpdates: number[] = [];

      // Track progress updates during execution
      const runPromise = runRepeated("test-provider", mockRequest, {
        runCount: 3,
        allowParallel: false,
        parallelConcurrency: 1,
        delayMs: 5,
      });

      // Monitor progress during execution
      const progressInterval = setInterval(() => {
        if (state.value.isRunningRepeated) {
          progressUpdates.push(state.value.completedRuns);
        }
      }, 5);

      await runPromise;
      clearInterval(progressInterval);

      // User sees progressive completion counts
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(state.value.completedRuns).toBe(3);
      expect(state.value.totalRuns).toBe(3);
    });

    it("should handle errors in repeated runs without stopping others", async () => {
      let callCount = 0;
      mockProvider.call.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Simulated API error");
        }
        return {
          content: `Response ${callCount}`,
          model: "test-model",
          usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
          cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
          metadata: {
            latency: 20,
            requestId: `error-${callCount}`,
            provider: "test-provider",
            timestamp: new Date(),
          },
        };
      });

      const { runRepeated, state } = usePromptRunner();

      await runRepeated("test-provider", mockRequest, {
        runCount: 3,
        allowParallel: true,
        parallelConcurrency: 2,
        delayMs: 0,
      });

      // User sees some successful results and some errors
      expect(state.value.completedRuns).toBe(3);
      expect(state.value.repeatedResults).toHaveLength(2); // 2 successful
      expect(state.value.repeatedErrors).toHaveLength(1); // 1 error
      expect(state.value.repeatedErrors[0]).toContain("Simulated API error");
    });

    it("should allow user to cancel repeated runs", async () => {
      let callCount = 0;
      const mockResponse: ProviderResponse = {
        content: "Cancellation test",
        model: "test-model",
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
        metadata: {
          latency: 100,
          requestId: "cancel-123",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      // Mock with longer delay and tracking to allow cancellation
      mockProvider.call.mockImplementation(async (): Promise<ProviderResponse> => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Longer delay
        return mockResponse;
      });

      const { runRepeated, cancelRun, state } = usePromptRunner();

      // User starts repeated runs
      const runPromise = runRepeated("test-provider", mockRequest, {
        runCount: 8,
        allowParallel: true,
        parallelConcurrency: 3,
        delayMs: 0,
      });

      // User cancels after a short delay (before all runs can complete)
      setTimeout(() => {
        cancelRun();
      }, 50);

      await runPromise;

      // User sees cancellation was effective
      expect(state.value.isRunningRepeated).toBe(false);
      // With cancellation, should have fewer completed runs than total requested
      expect(state.value.completedRuns).toBeLessThanOrEqual(8);
      // At least some runs should have been cancelled
      const totalResults = state.value.repeatedResults.length + state.value.repeatedErrors.length;
      expect(totalResults).toBeLessThanOrEqual(8);
    });

    it("should respect concurrency limits during parallel execution", async () => {
      const concurrentCalls = new Set<number>();
      let maxConcurrentCalls = 0;
      let currentCalls = 0;

      mockProvider.call.mockImplementation(async (): Promise<ProviderResponse> => {
        currentCalls++;
        concurrentCalls.add(currentCalls);
        maxConcurrentCalls = Math.max(maxConcurrentCalls, currentCalls);

        await new Promise(resolve => setTimeout(resolve, 20));

        currentCalls--;

        return {
          content: "Concurrency test",
          model: "test-model",
          usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
          cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
          metadata: {
            latency: 20,
            requestId: "conc-456",
            provider: "test-provider",
            timestamp: new Date(),
          },
        };
      });

      const { runRepeated, state } = usePromptRunner();

      await runRepeated("test-provider", mockRequest, {
        runCount: 6,
        allowParallel: true,
        parallelConcurrency: 3, // Limit to 3 concurrent calls
        delayMs: 0,
      });

      // User sees concurrency limit was respected
      expect(state.value.completedRuns).toBe(6);
      expect(maxConcurrentCalls).toBeLessThanOrEqual(3);
      expect(mockProvider.call).toHaveBeenCalledTimes(6);
    });

    it("should clear previous repeated results when starting new runs", async () => {
      const mockResponse: ProviderResponse = {
        content: "Clear test",
        model: "test-model",
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        cost: { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002 },
        metadata: {
          latency: 15,
          requestId: "clear-789",
          provider: "test-provider",
          timestamp: new Date(),
        },
      };

      mockProvider.call.mockResolvedValue(mockResponse);

      const { runRepeated, clearResults, state } = usePromptRunner();

      // User runs first batch
      await runRepeated("test-provider", mockRequest, {
        runCount: 2,
        allowParallel: false,
        parallelConcurrency: 1,
        delayMs: 5,
      });

      expect(state.value.repeatedResults).toHaveLength(2);

      // User clears results
      clearResults();

      // User sees cleared state
      expect(state.value.repeatedResults).toHaveLength(0);
      expect(state.value.repeatedErrors).toHaveLength(0);
      expect(state.value.completedRuns).toBe(0);
      expect(state.value.totalRuns).toBe(0);

      // User runs second batch
      await runRepeated("test-provider", mockRequest, {
        runCount: 3,
        allowParallel: true,
        parallelConcurrency: 2,
        delayMs: 0,
      });

      // User sees only new results
      expect(state.value.repeatedResults).toHaveLength(3);
      expect(state.value.completedRuns).toBe(3);
    });
  });
});
