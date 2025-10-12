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
      maxTokens: 150,
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
});
