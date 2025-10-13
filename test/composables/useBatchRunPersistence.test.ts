import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBatchRunPersistence } from "../../src/composables/useBatchRunPersistence";
import type {
  BatchRunConfig,
  BatchRunResult,
  BatchStatistics,
} from "../../src/composables/useBatchRunner";
import type { BatchRunSession } from "../../src/services/testManagementDatabase";

// Mock the testManagementDatabase service (external dependency)
vi.mock("../../src/services/testManagementDatabase", () => {
  const mockBatchRunSession: BatchRunSession = {
    id: "session-123",
    testCaseId: "test-case-456",
    projectId: "project-789",
    providerId: "openai",
    model: "gpt-4",
    runCount: 3,
    maxRetries: 2,
    delayMs: 1000,
    results: [],
    statistics: {
      totalRuns: 0,
      passedRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      passRate: 0,
      avgDuration: 0,
      p50Duration: 0,
      p90Duration: 0,
      avgTokens: 0,
      totalCost: 0,
      avgCost: 0,
      errorRate: 0,
    },
    tags: ["gpt-4", "openai", "runs-3", "delay-1000ms"],
    status: "running",
    startTime: new Date("2024-01-01T10:00:00Z"),
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    endTime: undefined,
  };

  return {
    testDB: {
      createBatchRun: vi.fn().mockResolvedValue(mockBatchRunSession),
      updateBatchRun: vi
        .fn()
        .mockImplementation((id, updates) =>
          Promise.resolve({...mockBatchRunSession, ...updates, id }),
        ),
      getRecentBatchRuns: vi.fn().mockResolvedValue([mockBatchRunSession]),
      getBatchRunsByTestCase: vi.fn().mockResolvedValue([mockBatchRunSession]),
      deleteBatchRun: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe("useBatchRunPersistence - Developer Experience", () => {
  const SAMPLE_BATCH_CONFIG: BatchRunConfig = {
    testCase: {
      id: "test-case-456",
      projectId: "project-789",
      name: "Sample Test Case",
      description: "Sample test case for batch runs",
      prompt: "Test prompt",
      rules: [],
      tags: ["test"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    providerId: "openai",
    model: "gpt-4",
    runCount: 3,
    maxRetries: 2,
    delayMs: 1000,
  };

  const SAMPLE_BATCH_RESULTS: BatchRunResult[] = [
    {
      id: "result-1",
      runIndex: 0,
      status: "completed",
      startTime: new Date("2024-01-01T10:00:00Z"),
      endTime: new Date("2024-01-01T10:00:01Z"),
      duration: 1000,
      response: "Test response",
      tokenUsage: {
        promptTokens: 25,
        completionTokens: 25,
        totalTokens: 50,
      },
      cost: 0.01,
      passed: true,
      error: undefined,
      retryCount: 0,
    },
  ];

  const SAMPLE_STATISTICS: BatchStatistics = {
    totalRuns: 3,
    completedRuns: 3,
    failedRuns: 0,
    passedRuns: 3,
    passRate: 1.0,
    avgDuration: 1000,
    p50Duration: 1000,
    p90Duration: 1200,
    avgTokens: 50,
    totalCost: 0.03,
    avgCost: 0.01,
    errorRate: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When developers start a batch run session", () => {
    it("should initialize session and update reactive state", async () => {
      // Developer starts a new batch run
      const { saveBatchRunStart, currentSession } = useBatchRunPersistence();

      // Should have no current session initially
      expect(currentSession.value).toBeNull();

      // Developer starts batch run
      const session = await saveBatchRunStart(
        SAMPLE_BATCH_CONFIG,
        "test-case-456",
        "project-789",
      );

      // Should create session successfully
      expect(session).toBeDefined();
      expect(session.id).toBe("session-123");

      // Should update reactive state
      expect(currentSession.value).toEqual(session);
    });

    it("should handle database errors gracefully during session start", async () => {
      // Mock console.error to suppress expected error logs during test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock database error
      const { testDB } = await import(
        "../../src/services/testManagementDatabase"
      );
      (testDB.createBatchRun as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      const { saveBatchRunStart } = useBatchRunPersistence();

      // Developer attempts to start batch run with database error
      await expect(
        saveBatchRunStart(SAMPLE_BATCH_CONFIG, "test-case-456", "project-789"),
      ).rejects.toThrow("Database connection failed");

      // Verify error was logged (but suppressed during test)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save batch run start:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("When developers track batch run progress", () => {
    it("should update session progress without blocking execution", async () => {
      const { saveBatchRunStart, updateBatchRunProgress, currentSession } =
        useBatchRunPersistence();

      // Start session first
      await saveBatchRunStart(
        SAMPLE_BATCH_CONFIG,
        "test-case-456",
        "project-789",
      );

      // Developer updates progress
      await updateBatchRunProgress(SAMPLE_BATCH_RESULTS, SAMPLE_STATISTICS);

      // Should update current session
      expect(currentSession.value).toBeDefined();
      expect(currentSession.value?.results).toEqual(SAMPLE_BATCH_RESULTS);
    });

    it("should handle progress updates gracefully when no session exists", async () => {
      const { updateBatchRunProgress } = useBatchRunPersistence();

      // Console.warn should be called but no error thrown
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Should not throw when no current session
      await expect(
        updateBatchRunProgress(SAMPLE_BATCH_RESULTS, SAMPLE_STATISTICS),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "No current batch run session to update",
      );
      consoleSpy.mockRestore();
    });

    it("should continue execution even if progress update fails", async () => {
      const { saveBatchRunStart, updateBatchRunProgress } =
        useBatchRunPersistence();

      // Start session
      await saveBatchRunStart(
        SAMPLE_BATCH_CONFIG,
        "test-case-456",
        "project-789",
      );

      // Mock database error for update
      const { testDB } = await import(
        "../../src/services/testManagementDatabase"
      );
      (testDB.updateBatchRun as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Update failed"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Should not throw - batch execution should continue
      await expect(
        updateBatchRunProgress(SAMPLE_BATCH_RESULTS, SAMPLE_STATISTICS),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to update batch run progress:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("When developers complete batch runs", () => {
    it("should finalize session with completion status", async () => {
      const { saveBatchRunStart, completeBatchRun, currentSession } =
        useBatchRunPersistence();

      // Start session
      await saveBatchRunStart(
        SAMPLE_BATCH_CONFIG,
        "test-case-456",
        "project-789",
      );

      // Developer completes batch run
      await completeBatchRun(
        SAMPLE_BATCH_RESULTS,
        SAMPLE_STATISTICS,
        "completed",
      );

      // Should update session status
      expect(currentSession.value?.status).toBe("completed");
      expect(currentSession.value?.results).toEqual(SAMPLE_BATCH_RESULTS);
    });

    it("should handle completion gracefully when no session exists", async () => {
      const { completeBatchRun } = useBatchRunPersistence();

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Should not throw when no current session
      await expect(
        completeBatchRun(SAMPLE_BATCH_RESULTS, SAMPLE_STATISTICS, "completed"),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "No current batch run session to complete",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("When developers load batch run history", () => {
    it("should populate recent sessions reactive state", async () => {
      const { loadRecentBatchRuns, recentSessions } = useBatchRunPersistence();

      // Should start with empty history
      expect(recentSessions.value).toEqual([]);

      // Developer loads recent batch runs
      await loadRecentBatchRuns("project-789", 10);

      // Should populate reactive state
      expect(recentSessions.value).toHaveLength(1);
      expect(recentSessions.value[0]?.id).toBe("session-123");
    });

    it("should load test case specific batch runs", async () => {
      const { loadBatchRunsByTestCase } = useBatchRunPersistence();

      // Developer loads batch runs for specific test case
      const sessions = await loadBatchRunsByTestCase("test-case-456");

      // Should return sessions
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.testCaseId).toBe("test-case-456");
    });
  });

  describe("When developers manage batch run sessions", () => {
    it("should delete sessions and update state", async () => {
      const {
        saveBatchRunStart,
        deleteBatchRun,
        currentSession,
        loadRecentBatchRuns,
      } = useBatchRunPersistence();

      // Start session and add to recent
      await saveBatchRunStart(
        SAMPLE_BATCH_CONFIG,
        "test-case-456",
        "project-789",
      );
      await loadRecentBatchRuns();

      const sessionId = currentSession.value?.id || "session-123";

      // Developer deletes session
      await deleteBatchRun(sessionId);

      // Should clear current session if it was deleted
      expect(currentSession.value).toBeNull();
    });

    it("should clear current session manually", async () => {
      const { saveBatchRunStart, clearCurrentSession, currentSession } =
        useBatchRunPersistence();

      // Start session first
      await saveBatchRunStart(
        SAMPLE_BATCH_CONFIG,
        "test-case-456",
        "project-789",
      );

      // Developer clears session
      clearCurrentSession();

      // Should clear reactive state
      expect(currentSession.value).toBeNull();
    });
  });
});
