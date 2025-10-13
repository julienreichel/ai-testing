import { describe, it, expect, beforeEach } from "vitest";

// Mock persistence service for behavior testing
class MockBatchRunPersistence {
  private readonly storage = new Map<string, unknown>();

  saveBatchRun(data: Record<string, unknown>): Promise<string> {
    if (!data.id || !data.timestamp) {
      return Promise.reject(new Error("Invalid batch run data"));
    }
    this.storage.set(data.id as string, data);
    return Promise.resolve(data.id as string);
  }

  getBatchRun(id: string): Promise<unknown> {
    return Promise.resolve(this.storage.get(id) || null);
  }

  getAllBatchRuns(): Promise<unknown[]> {
    return Promise.resolve(Array.from(this.storage.values()));
  }

  updateBatchRun(data: Record<string, unknown>): Promise<string> {
    if (!data.id) return Promise.reject(new Error("ID required for update"));
    this.storage.set(data.id as string, data);
    return Promise.resolve(data.id as string);
  }

  deleteBatchRun(id: string): Promise<void> {
    this.storage.delete(id);
    return Promise.resolve();
  }

  clearAllBatchRuns(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }
}

describe("BatchRunPersistence - User Data Management", () => {
  let persistence: MockBatchRunPersistence;

  const SAMPLE_BATCH_RESULT = {
    id: "test-run-1",
    timestamp: new Date().toISOString(),
    providerId: "openai",
    ruleIds: ["rule-1", "rule-2"],
    results: [
      {
        id: "result-1",
        ruleId: "rule-1",
        providerId: "openai",
        prompt: "Test prompt",
        response: "Test response",
        success: true,
        timestamp: new Date().toISOString(),
        cost: 0.01,
        duration: 1000,
      },
    ],
    statistics: {
      totalRuns: 1,
      successfulRuns: 1,
      totalCost: 0.01,
      avgCost: 0.01,
      errorRate: 0,
    },
    status: "completed" as const,
  };

  beforeEach(() => {
    persistence = new MockBatchRunPersistence();
  });

  describe("When users save batch run results", () => {
    it("should store user's batch run data reliably", async () => {
      // User saves their batch run results
      const savedId = await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);

      // Should successfully store the data
      expect(savedId).toBe(SAMPLE_BATCH_RESULT.id);

      // Should be retrievable
      const retrieved = await persistence.getBatchRun(SAMPLE_BATCH_RESULT.id);
      expect(retrieved).toEqual(SAMPLE_BATCH_RESULT);
    });

    it("should handle storage errors gracefully for users", async () => {
      const invalidData = { id: "", timestamp: "" };

      // User attempts to save invalid data
      await expect(persistence.saveBatchRun(invalidData))
        .rejects.toThrow("Invalid batch run data");
    });
  });

  describe("When users retrieve their saved data", () => {
    it("should load user's specific batch run details", async () => {
      // Setup data first
      await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);

      // User requests specific batch run details
      const retrieved = await persistence.getBatchRun(SAMPLE_BATCH_RESULT.id);

      // Should return the user's data
      expect(retrieved).toEqual(SAMPLE_BATCH_RESULT);
    });

    it("should return null when user requests non-existent data", async () => {
      // User requests data that doesn't exist
      const retrieved = await persistence.getBatchRun("non-existent-id");

      // Should handle gracefully
      expect(retrieved).toBeNull();
    });

    it("should load user's complete batch run history", async () => {
      // Setup multiple results
      await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);
      const secondResult = { ...SAMPLE_BATCH_RESULT, id: "test-run-2" };
      await persistence.saveBatchRun(secondResult);

      // User wants to see their complete history
      const history = await persistence.getAllBatchRuns();

      // Should return user's complete history
      expect(history).toHaveLength(2);
      expect(history).toContainEqual(SAMPLE_BATCH_RESULT);
      expect(history).toContainEqual(secondResult);
    });
  });

  describe("When users update existing data", () => {
    it("should allow users to update their batch run records", async () => {
      // Setup existing data
      await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);

      const updatedResult = {
        ...SAMPLE_BATCH_RESULT,
        status: "cancelled" as const,
      };

      // User updates their batch run
      const updatedId = await persistence.updateBatchRun(updatedResult);

      // Should successfully update the data
      expect(updatedId).toBe(updatedResult.id);

      // Should reflect the update
      const retrieved = await persistence.getBatchRun(updatedResult.id);
      expect(retrieved).toEqual(updatedResult);
    });
  });

  describe("When users delete their data", () => {
    it("should allow users to delete specific batch runs", async () => {
      // Setup data first
      await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);

      // User deletes a specific batch run
      await persistence.deleteBatchRun(SAMPLE_BATCH_RESULT.id);

      // Should be removed
      const retrieved = await persistence.getBatchRun(SAMPLE_BATCH_RESULT.id);
      expect(retrieved).toBeNull();
    });

    it("should allow users to clear all their batch run history", async () => {
      // Setup multiple results
      await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);
      await persistence.saveBatchRun({ ...SAMPLE_BATCH_RESULT, id: "test-run-2" });

      // User wants to clear all their history
      await persistence.clearAllBatchRuns();

      // Should remove all user data
      const history = await persistence.getAllBatchRuns();
      expect(history).toHaveLength(0);
    });
  });

  describe("Data integrity and validation", () => {
    it("should validate user data before storage", async () => {
      const invalidData = {
        id: "",
        timestamp: "",
      };

      // User attempts to save invalid data
      await expect(persistence.saveBatchRun(invalidData))
        .rejects.toThrow("Invalid batch run data");
    });

    it("should ensure data consistency for user operations", async () => {
      // User saves data with consistent structure
      const savedId = await persistence.saveBatchRun(SAMPLE_BATCH_RESULT);

      // Should maintain data integrity
      expect(savedId).toBe(SAMPLE_BATCH_RESULT.id);

      // Retrieved data should match exactly
      const retrieved = await persistence.getBatchRun(SAMPLE_BATCH_RESULT.id);
      expect(retrieved).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(String),
        results: expect.any(Array),
        statistics: expect.any(Object),
      });
    });
  });
});
