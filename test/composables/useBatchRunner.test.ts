import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBatchRunner } from "../../src/composables/useBatchRunner";
import type { TestCase } from "../../src/types/testManagement";

// Mock all dependencies to focus on composable behavior
vi.mock("../../src/store/providers", () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useProvidersStore: () => ({
    getProviderAdapter: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock("../../src/composables/useRulesEngine", () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useRulesEngine: () => ({
    validateRuleSet: vi.fn().mockReturnValue({
      overallPass: true,
      message: "All rules passed",
      ruleSetResults: [],
    }),
  }),
}));

vi.mock("../../src/composables/useBatchRunPersistence", () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useBatchRunPersistence: () => ({
    saveBatchRunStart: vi.fn().mockResolvedValue({ id: "batch-session-1" }),
    updateBatchRunProgress: vi.fn().mockResolvedValue(undefined),
    completeBatchRun: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("useBatchRunner - User Behavior", () => {
  let mockTestCase: TestCase;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTestCase = {
      id: "test-case-1",
      projectId: "project-1",
      name: "Sample Test Case",
      description: "A test case for batch running",
      prompt: "Write a hello world program",
      rules: [
        {
          id: "rule-1",
          rules: [
            {
              id: "contains-rule",
              type: "contains",
              value: "hello",
            },
          ],
          aggregation: "AND",
        },
      ],
      tags: ["test"],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
  });

  describe("When user initializes batch runner", () => {
    it("should provide clean initial state for new batch runs", () => {
      const { state, statistics, progress } = useBatchRunner();

      // User should see a clean slate for starting batch runs
      expect(state.isRunning).toBe(false);
      expect(state.isCancelled).toBe(false);
      expect(state.results).toEqual([]);
      expect(state.completedRuns).toBe(0);
      expect(state.totalRuns).toBe(0);
      expect(state.errors).toEqual([]);

      // User should see zero progress and empty statistics
      expect(progress.value).toBe(0);
      expect(statistics.value.totalRuns).toBe(0);
      expect(statistics.value.passRate).toBe(0);
    });

    it("should allow user to cancel batch runs", () => {
      const { state, cancelBatch } = useBatchRunner();

      // User starts with non-cancelled state
      expect(state.isCancelled).toBe(false);

      // User cancels the batch run
      cancelBatch();

      // User should see cancelled state
      expect(state.isCancelled).toBe(true);
    });

    it("should allow user to reset batch runner state", () => {
      const { state, resetBatch } = useBatchRunner();

      // Simulate some state changes
      state.completedRuns = 5;
      state.totalRuns = 10;
      state.results = [
        {
          id: "test",
          runIndex: 0,
          status: "completed",
          startTime: new Date(),
          retryCount: 0,
        },
      ];
      state.errors = ["Test error"];

      // User resets the batch runner
      resetBatch();

      // User should see clean state again
      expect(state.isRunning).toBe(false);
      expect(state.isCancelled).toBe(false);
      expect(state.completedRuns).toBe(0);
      expect(state.totalRuns).toBe(0);
      expect(state.results).toEqual([]);
      expect(state.errors).toEqual([]);
    });

    it("should handle invalid provider configuration gracefully", async () => {
      const { runBatch, state } = useBatchRunner();

      const config = {
        testCase: mockTestCase,
        providerId: "nonexistent-provider",
        model: "test-model",
        runCount: 2,
        maxRetries: 1,
        delayMs: 10,
      };

      // User gets feedback through state errors rather than promise rejection
      await runBatch(config);

      // Should complete the batch run but with error states
      expect(state.isRunning).toBe(false);
      expect(state.errors.length).toBeGreaterThan(0);
      expect(state.results.some((r) => r.status === "failed")).toBe(true);
    });
  });
});
