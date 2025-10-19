/**
 * Batch Run Persistence Composable
 * Handles saving and loading batch run sessions from the database
 */

import { ref, type Ref } from "vue";
import { testDB, type BatchRunSession } from "services/testManagementDatabase";
import type {
  BatchRunConfig,
  BatchRunResult,
  BatchStatistics,
} from "composables/useBatchRunner";

export interface BatchRunPersistence {
  currentSession: Ref<BatchRunSession | null>;
  recentSessions: Ref<BatchRunSession[]>;
  saveBatchRunStart: (
    config: BatchRunConfig,
    testCaseId: string,
    projectId: string,
  ) => Promise<BatchRunSession>;
  updateBatchRunProgress: (
    results: BatchRunResult[],
    statistics: BatchStatistics,
  ) => Promise<void>;
  completeBatchRun: (
    results: BatchRunResult[],
    statistics: BatchStatistics,
    status: "completed" | "cancelled" | "failed",
  ) => Promise<void>;
  loadRecentBatchRuns: (projectId?: string, limit?: number) => Promise<void>;
  loadBatchRunsByTestCase: (testCaseId: string) => Promise<BatchRunSession[]>;
  deleteBatchRun: (id: string) => Promise<void>;
  clearCurrentSession: () => void;
}

// Private helper functions
const handleDatabaseError = (operation: string, error: unknown): never => {
  console.error(`Failed to ${operation}:`, error);
  throw error;
};

const handleProgressUpdateError = (error: unknown): void => {
  console.error("Failed to update batch run progress:", error);
  // Don't throw here to avoid interrupting batch execution
};

const generateBatchRunTags = (config: BatchRunConfig): string[] => {
  return [
    config.model,
    config.providerId,
    `runs-${config.runCount}`,
    `delay-${config.delayMs}ms`,
  ];
};

const createBatchRunSession = async (
  config: BatchRunConfig,
  testCaseId: string,
  projectId: string,
): Promise<BatchRunSession> => {
  const tags = generateBatchRunTags(config);
  return await testDB.createBatchRun(config, testCaseId, projectId, tags);
};

// eslint-disable-next-line max-lines-per-function
export function useBatchRunPersistence(): BatchRunPersistence {
  const currentSession = ref<BatchRunSession | null>(null);
  const recentSessions = ref<BatchRunSession[]>([]);

  const saveBatchRunStart = async (
    config: BatchRunConfig,
    testCaseId: string,
    projectId: string,
  ): Promise<BatchRunSession> => {
    try {
      const session = await createBatchRunSession(
        config,
        testCaseId,
        projectId,
      );
      currentSession.value = session;
      return session;
    } catch (error) {
      return handleDatabaseError("save batch run start", error);
    }
  };

  const updateBatchRunProgress = async (
    results: BatchRunResult[],
    statistics: BatchStatistics,
  ): Promise<void> => {
    if (!currentSession.value) {
      console.warn("No current batch run session to update");
      return;
    }

    try {
      const updated = await testDB.updateBatchRun(currentSession.value.id, {
        results,
        statistics,
      });
      currentSession.value = updated;
    } catch (error) {
      handleProgressUpdateError(error);
    }
  };

  const completeBatchRun = async (
    results: BatchRunResult[],
    statistics: BatchStatistics,
    status: "completed" | "cancelled" | "failed",
  ): Promise<void> => {
    if (!currentSession.value) {
      console.warn("No current batch run session to complete");
      return;
    }

    try {
      const updated = await testDB.updateBatchRun(currentSession.value.id, {
        results,
        statistics,
        status,
        endTime: new Date(),
      });
      currentSession.value = updated;
    } catch (error) {
      return handleDatabaseError("complete batch run", error);
    }
  };

  const loadRecentBatchRuns = async (
    projectId?: string,
    limit = 10,
  ): Promise<void> => {
    try {
      const sessions = await testDB.getRecentBatchRuns(limit, projectId);
      recentSessions.value = sessions;
    } catch (error) {
      return handleDatabaseError("load recent batch runs", error);
    }
  };

  const loadBatchRunsByTestCase = async (
    testCaseId: string,
  ): Promise<BatchRunSession[]> => {
    try {
      return await testDB.getBatchRunsByTestCase(testCaseId);
    } catch (error) {
      return handleDatabaseError("load batch runs by test case", error);
    }
  };

  const deleteBatchRun = async (id: string): Promise<void> => {
    try {
      await testDB.deleteBatchRun(id);

      if (currentSession.value?.id === id) {
        currentSession.value = null;
      }
      recentSessions.value = recentSessions.value.filter(
        (session) => session.id !== id,
      );
    } catch (error) {
      return handleDatabaseError("delete batch run", error);
    }
  };

  const clearCurrentSession = (): void => {
    currentSession.value = null;
  };

  return {
    currentSession,
    recentSessions,
    saveBatchRunStart,
    updateBatchRunProgress,
    completeBatchRun,
    loadRecentBatchRuns,
    loadBatchRunsByTestCase,
    deleteBatchRun,
    clearCurrentSession,
  };
}
