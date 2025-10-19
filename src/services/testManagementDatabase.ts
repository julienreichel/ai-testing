/**
 * IndexedDB Database Service for Test Management
 * Handles all database operations for Projects, Test Cases, and Runs
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Project,
  TestCase,
  QueryOptions,
  ExportProject,
  ImportResult,
} from "types/testManagement";
import type {
  BatchRunResult,
  BatchRunConfig,
  BatchStatistics,
} from "composables/useBatchRunner";

// Clean batch run session - no data duplication, proper relational design
export interface BatchRunSession {
  id: string;
  testCaseId: string; // Reference to test case - no duplication!
  projectId: string; // Denormalized for quick filtering, but could be derived from testCase

  // Simple run configuration - no complex objects to serialize
  providerId: string;
  model: string;
  runCount: number;
  maxRetries: number;
  delayMs: number;

  // All individual run results
  results: BatchRunResult[];

  // Aggregated statistics for quick comparison
  statistics: BatchStatistics;

  // Execution metadata
  status: "running" | "completed" | "cancelled" | "failed";
  startTime: Date;
  endTime?: Date;
  duration?: number; // Total execution time in ms

  // Comparison tags for easier filtering
  tags: string[]; // e.g., ["prompt-v1", "gpt-4", "production-test"]

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}

// Database schema definition
interface TestManagementDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: {
      "by-created": Date;
      "by-updated": Date;
      "by-name": string;
    };
  };
  testCases: {
    key: string;
    value: TestCase;
    indexes: {
      "by-project": string;
      "by-created": Date;
      "by-updated": Date;
      "by-name": string;
    };
  };
  batchRuns: {
    key: string;
    value: BatchRunSession;
    indexes: {
      "by-testcase": string;
      "by-project": string;
      "by-created": Date;
      "by-status": string;
      "by-updated": Date;
      "by-model": string;
      "by-provider": string;
    };
  };
}

const DB_NAME = "TestManagementDB";
const DB_VERSION = 1;

class TestManagementDatabase {
  private db: IDBPDatabase<TestManagementDB> | null = null;

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    this.db = await openDB<TestManagementDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, _transaction) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${newVersion}`,
        );

        const CURRENT_VERSION = 2;

        // Version 1 -> 2: Remove testRuns, add batchRuns
        if (oldVersion < 1) {
          // Fresh installation - create all stores

          // Projects store
          const projectStore = db.createObjectStore("projects", {
            keyPath: "id",
          });
          projectStore.createIndex("by-created", "createdAt");
          projectStore.createIndex("by-updated", "updatedAt");
          projectStore.createIndex("by-name", "name");

          // Test Cases store
          const testCaseStore = db.createObjectStore("testCases", {
            keyPath: "id",
          });
          testCaseStore.createIndex("by-project", "projectId");
          testCaseStore.createIndex("by-created", "createdAt");
          testCaseStore.createIndex("by-updated", "updatedAt");
          testCaseStore.createIndex("by-name", "name");
        }

        if (oldVersion < CURRENT_VERSION) {
          // Add batchRuns store (main focus)
          if (!db.objectStoreNames.contains("batchRuns")) {
            const batchRunStore = db.createObjectStore("batchRuns", {
              keyPath: "id",
            });
            batchRunStore.createIndex("by-testcase", "testCaseId");
            batchRunStore.createIndex("by-project", "projectId");
            batchRunStore.createIndex("by-created", "createdAt");
            batchRunStore.createIndex("by-status", "status");
            batchRunStore.createIndex("by-updated", "updatedAt");
            batchRunStore.createIndex("by-model", "config.model");
            batchRunStore.createIndex("by-provider", "config.providerId");
            console.log("Created batchRuns store with indexes");
          }
        }
      },
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBPDatabase<TestManagementDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ==================== PROJECT OPERATIONS ====================

  /**
   * Create a new project
   */
  async createProject(
    data:
      | Omit<Project, "createdAt" | "updatedAt">
      | Omit<Project, "id" | "createdAt" | "updatedAt">,
  ): Promise<Project> {
    const db = await this.ensureDB();
    const now = new Date();
    const project: Project = {
      id: "id" in data ? data.id : this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await db.add("projects", project);
    return project;
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | undefined> {
    const db = await this.ensureDB();
    return db.get("projects", id);
  }

  /**
   * Get all projects
   */
  async getProjects(options: QueryOptions = {}): Promise<Project[]> {
    const db = await this.ensureDB();
    const tx = db.transaction("projects", "readonly");
    const store = tx.objectStore("projects");

    let cursor = await store.openCursor();
    const results: Project[] = [];
    let count = 0;

    while (cursor && (!options.limit || count < options.limit)) {
      if (!options.offset || count >= options.offset) {
        results.push(cursor.value);
      }
      count++;
      cursor = await cursor.continue();
    }

    return this.sortResults(results, options);
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    updates: Partial<Omit<Project, "id" | "createdAt">>,
  ): Promise<Project | null> {
    const db = await this.ensureDB();
    const existing = await db.get("projects", id);

    if (!existing) {
      return null;
    }

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await db.put("projects", updated);
    return updated;
  }

  /**
   * Delete project and all associated data
   */
  async deleteProject(id: string): Promise<boolean> {
    const db = await this.ensureDB();
    const tx = db.transaction(
      ["projects", "testCases", "batchRuns"],
      "readwrite",
    );

    try {
      // Delete project
      await tx.objectStore("projects").delete(id);

      // Delete all test cases in project
      const testCases = await tx
        .objectStore("testCases")
        .index("by-project")
        .getAll(id);
      for (const testCase of testCases) {
        await tx.objectStore("testCases").delete(testCase.id);
      }

      // Delete all batch runs in project
      const batchRuns = await tx
        .objectStore("batchRuns")
        .index("by-project")
        .getAll(id);
      for (const batchRun of batchRuns) {
        await tx.objectStore("batchRuns").delete(batchRun.id);
      }

      await tx.done;
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  }

  // ==================== TEST CASE OPERATIONS ====================

  /**
   * Create a new test case
   */
  async createTestCase(
    data:
      | Omit<TestCase, "createdAt" | "updatedAt">
      | Omit<TestCase, "id" | "createdAt" | "updatedAt">,
  ): Promise<TestCase> {
    const db = await this.ensureDB();
    const now = new Date();
    const testCase: TestCase = {
      id: "id" in data ? data.id : this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await db.add("testCases", testCase);
    return testCase;
  }

  /**
   * Get test case by ID
   */
  async getTestCase(id: string): Promise<TestCase | undefined> {
    const db = await this.ensureDB();
    return db.get("testCases", id);
  }

  /**
   * Get test cases by project
   */
  async getTestCasesByProject(
    projectId: string,
    options: QueryOptions = {},
  ): Promise<TestCase[]> {
    const db = await this.ensureDB();
    const results = await db.getAllFromIndex(
      "testCases",
      "by-project",
      projectId,
    );
    return this.sortResults(results, options);
  }

  /**
   * Update test case
   */
  async updateTestCase(
    id: string,
    updates: Partial<Omit<TestCase, "id" | "createdAt">>,
  ): Promise<TestCase | null> {
    const db = await this.ensureDB();
    const existing = await db.get("testCases", id);

    if (!existing) {
      return null;
    }

    const updated: TestCase = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await db.put("testCases", updated);
    return updated;
  }

  /**
   * Delete test case and all associated batch runs
   */
  async deleteTestCase(id: string): Promise<boolean> {
    const db = await this.ensureDB();
    const tx = db.transaction(["testCases", "batchRuns"], "readwrite");

    try {
      // Delete test case
      await tx.objectStore("testCases").delete(id);

      // Delete all batch runs for this test case
      const batchRuns = await tx
        .objectStore("batchRuns")
        .index("by-testcase")
        .getAll(id);
      for (const batchRun of batchRuns) {
        await tx.objectStore("batchRuns").delete(batchRun.id);
      }

      await tx.done;
      return true;
    } catch (error) {
      console.error("Error deleting test case:", error);
      return false;
    }
  }

  /**
   * Get total count of all test cases across all projects
   */
  async getTotalTestCaseCount(): Promise<number> {
    const db = await this.ensureDB();
    const allTestCases = await db.getAll("testCases");
    return allTestCases.length;
  }

  // ==================== BATCH RUN OPERATIONS ====================
  // Note: Individual test runs are stored within BatchRunSession.results[]
  // This simplifies the schema and focuses on batch comparisons

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  /**
   * Export project with all test cases and batch runs
   */
  async exportProject(projectId: string): Promise<ExportProject | null> {
    const project = await this.getProject(projectId);
    if (!project) {
      return null;
    }

    const testCases = await this.getTestCasesByProject(projectId);
    // Note: Individual test runs are now stored within batch runs
    // We keep the runs array empty for backward compatibility
    const runs: never[] = [];

    return {
      project,
      testCases,
      runs,
    };
  }

  /**
   * Import project data
   */
  async importProject(data: ExportProject): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: {
        projects: 0,
        testCases: 0,
        runs: 0,
      },
      errors: [],
    };

    try {
      // Check if project with the same ID already exists
      const existingProject = await this.getProject(data.project.id);
      let targetProject: Project;

      if (existingProject) {
        // Update existing project
        const updatedProject = await this.updateProject(data.project.id, {
          name: data.project.name,
          description: data.project.description,
        });
        if (!updatedProject) {
          throw new Error("Failed to update existing project");
        }
        targetProject = updatedProject;
        result.imported.projects = 1;
      } else {
        // Create new project with original ID preserved
        targetProject = await this.createProject(data.project);
        result.imported.projects = 1;
      }

      // Import test cases
      for (const testCase of data.testCases) {
        try {
          // Check if test case with the same ID already exists
          const existingTestCase = await this.getTestCase(testCase.id);

          if (existingTestCase) {
            // Update existing test case
            await this.updateTestCase(testCase.id, {
              name: testCase.name,
              description: testCase.description,
              prompt: testCase.prompt,
              rules: testCase.rules,
              projectId: targetProject.id,
            });
          } else {
            // Create new test case with original ID preserved
            const testCaseData = {
              ...testCase,
              projectId: targetProject.id,
            };
            await this.createTestCase(testCaseData);
          }
          result.imported.testCases++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.errors.push(
            `Failed to import test case "${testCase.name}": ${errorMessage}`,
          );
        }
      }

      // Note: Individual test runs are now stored within batch runs
      // Legacy runs data is ignored for simplified schema

      result.success = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to import project: ${errorMessage}`);
    }

    return result;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    const BASE_36 = 36;
    const RANDOM_SUFFIX_LENGTH = 2;
    return (
      Date.now().toString(BASE_36) +
      Math.random().toString(BASE_36).substr(RANDOM_SUFFIX_LENGTH)
    );
  }

  /**
   * Sort results based on options
   */
  private sortResults<T>(results: T[], options: QueryOptions): T[] {
    if (!options.sortBy) {
      return results;
    }

    return results.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[options.sortBy!];
      const bVal = (b as Record<string, unknown>)[options.sortBy!];

      let comparison = 0;

      // Handle different data types for comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        // Fallback to string comparison
        const aStr = String(aVal);
        const bStr = String(bVal);
        comparison = aStr.localeCompare(bStr);
      }

      return options.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // =============================================
  // BATCH RUN OPERATIONS
  // =============================================

  /**
   * Create a new batch run session
   */
  async createBatchRun(
    config: BatchRunConfig,
    testCaseId: string,
    projectId: string,
    tags: string[] = [],
  ): Promise<BatchRunSession> {
    const db = await this.ensureDB();
    const now = new Date();

    // Verify test case exists
    const testCase = await this.getTestCase(testCaseId);
    if (!testCase) {
      throw new Error(`Test case with ID ${testCaseId} not found`);
    }

    // Clean batch run - no data duplication, just references and simple config
    const batchRun: BatchRunSession = {
      id: crypto.randomUUID(),
      testCaseId, // Just the ID reference - proper relational design!
      projectId,

      // Simple configuration - no complex objects
      providerId: config.providerId,
      model: config.model,
      runCount: config.runCount,
      maxRetries: config.maxRetries,
      delayMs: config.delayMs,

      // Results and metadata
      results: [],
      statistics: {
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        passedRuns: 0,
        passRate: 0,
        avgDuration: 0,
        p50Duration: 0,
        p90Duration: 0,
        avgTokens: 0,
        totalCost: 0,
        avgCost: 0,
        errorRate: 0,
      },
      status: "running",
      startTime: now,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    await db.add("batchRuns", batchRun);
    return batchRun;
  }

  /**
   * Update batch run session
   */
  async updateBatchRun(
    id: string,
    updates: Partial<
      Pick<BatchRunSession, "results" | "statistics" | "status" | "endTime">
    >,
  ): Promise<BatchRunSession> {
    const db = await this.ensureDB();
    const existing = await db.get("batchRuns", id);

    if (!existing) {
      throw new Error(`Batch run with ID ${id} not found`);
    }

    // Serialize the updates to remove any non-cloneable data
    const serializableUpdates = JSON.parse(JSON.stringify(updates));

    const updated: BatchRunSession = {
      ...existing,
      ...serializableUpdates,
      updatedAt: new Date(),
    };

    await db.put("batchRuns", updated);
    return updated;
  }

  /**
   * Get batch run by ID
   */
  async getBatchRun(id: string): Promise<BatchRunSession | undefined> {
    const db = await this.ensureDB();
    return db.get("batchRuns", id);
  }

  /**
   * Get all batch runs for a test case
   */
  async getBatchRunsByTestCase(testCaseId: string): Promise<BatchRunSession[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex("batchRuns", "by-testcase", testCaseId);
  }

  /**
   * Get all batch runs for a project
   */
  async getBatchRunsByProject(projectId: string): Promise<BatchRunSession[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex("batchRuns", "by-project", projectId);
  }

  /**
   * Get recent batch runs with optional filters
   */
  async getRecentBatchRuns(
    limit = 10,
    projectId?: string,
  ): Promise<BatchRunSession[]> {
    const db = await this.ensureDB();

    let batchRuns: BatchRunSession[];

    if (projectId) {
      batchRuns = await db.getAllFromIndex(
        "batchRuns",
        "by-project",
        projectId,
      );
    } else {
      batchRuns = await db.getAll("batchRuns");
    }

    return batchRuns
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Delete a batch run
   */
  async deleteBatchRun(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete("batchRuns", id);
  }

  /**
   * Delete all batch runs for a test case
   */
  async deleteBatchRunsByTestCase(testCaseId: string): Promise<void> {
    const db = await this.ensureDB();
    const batchRuns = await db.getAllFromIndex(
      "batchRuns",
      "by-testcase",
      testCaseId,
    );

    const tx = db.transaction("batchRuns", "readwrite");
    await Promise.all([
      ...batchRuns.map((batchRun) => tx.store.delete(batchRun.id)),
      tx.done,
    ]);
  }
}

// Export singleton instance
export const testDB = new TestManagementDatabase();
