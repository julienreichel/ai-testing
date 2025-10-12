/**
 * IndexedDB Database Service for Test Management
 * Handles all database operations for Projects, Test Cases, and Runs
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Project,
  TestCase,
  TestRun,
  QueryOptions,
  ExportProject,
  ImportResult,
} from "../types/testManagement";

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
  testRuns: {
    key: string;
    value: TestRun;
    indexes: {
      "by-testcase": string;
      "by-project": string;
      "by-created": Date;
      "by-status": string;
      "by-model": string;
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
      upgrade(db) {
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

        // Test Runs store
        const testRunStore = db.createObjectStore("testRuns", {
          keyPath: "id",
        });
        testRunStore.createIndex("by-testcase", "testCaseId");
        testRunStore.createIndex("by-project", "projectId");
        testRunStore.createIndex("by-created", "createdAt");
        testRunStore.createIndex("by-status", "status");
        testRunStore.createIndex("by-model", "modelProvider");
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
      ["projects", "testCases", "testRuns"],
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

      // Delete all test runs in project
      const testRuns = await tx
        .objectStore("testRuns")
        .index("by-project")
        .getAll(id);
      for (const testRun of testRuns) {
        await tx.objectStore("testRuns").delete(testRun.id);
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
   * Delete test case and all associated runs
   */
  async deleteTestCase(id: string): Promise<boolean> {
    const db = await this.ensureDB();
    const tx = db.transaction(["testCases", "testRuns"], "readwrite");

    try {
      // Delete test case
      await tx.objectStore("testCases").delete(id);

      // Delete all test runs for this test case
      const testRuns = await tx
        .objectStore("testRuns")
        .index("by-testcase")
        .getAll(id);
      for (const testRun of testRuns) {
        await tx.objectStore("testRuns").delete(testRun.id);
      }

      await tx.done;
      return true;
    } catch (error) {
      console.error("Error deleting test case:", error);
      return false;
    }
  }

  // ==================== TEST RUN OPERATIONS ====================

  /**
   * Create a new test run
   */
  async createTestRun(
    data: Omit<TestRun, "createdAt"> | Omit<TestRun, "id" | "createdAt">,
  ): Promise<TestRun> {
    const db = await this.ensureDB();
    const testRun: TestRun = {
      id: "id" in data ? data.id : this.generateId(),
      ...data,
      createdAt: new Date(),
    };

    await db.add("testRuns", testRun);
    return testRun;
  }

  /**
   * Get test run by ID
   */
  async getTestRun(id: string): Promise<TestRun | undefined> {
    const db = await this.ensureDB();
    return db.get("testRuns", id);
  }

  /**
   * Get test runs by test case
   */
  async getTestRunsByTestCase(
    testCaseId: string,
    options: QueryOptions = {},
  ): Promise<TestRun[]> {
    const db = await this.ensureDB();
    const results = await db.getAllFromIndex(
      "testRuns",
      "by-testcase",
      testCaseId,
    );
    return this.sortResults(results, options);
  }

  /**
   * Get test runs by project
   */
  async getTestRunsByProject(
    projectId: string,
    options: QueryOptions = {},
  ): Promise<TestRun[]> {
    const db = await this.ensureDB();
    const results = await db.getAllFromIndex(
      "testRuns",
      "by-project",
      projectId,
    );
    return this.sortResults(results, options);
  }

  /**
   * Update test run
   */
  async updateTestRun(
    id: string,
    updates: Partial<Omit<TestRun, "id" | "createdAt">>,
  ): Promise<TestRun | null> {
    const db = await this.ensureDB();
    const existing = await db.get("testRuns", id);

    if (!existing) {
      return null;
    }

    const updated: TestRun = {
      ...existing,
      ...updates,
    };

    await db.put("testRuns", updated);
    return updated;
  }

  /**
   * Delete test run
   */
  async deleteTestRun(id: string): Promise<boolean> {
    const db = await this.ensureDB();
    try {
      await db.delete("testRuns", id);
      return true;
    } catch (error) {
      console.error("Error deleting test run:", error);
      return false;
    }
  }

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  /**
   * Export project with all test cases and runs
   */
  async exportProject(
    projectId: string,
    includeRuns = false,
  ): Promise<ExportProject | null> {
    const project = await this.getProject(projectId);
    if (!project) {
      return null;
    }

    const testCases = await this.getTestCasesByProject(projectId);
    const runs = includeRuns ? await this.getTestRunsByProject(projectId) : [];

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

      // Import runs if provided
      if (data.runs) {
        await this.importTestRuns(
          data.runs,
          data.testCases,
          targetProject.id,
          result,
        );
      }

      result.success = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to import project: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Import test runs (extracted to reduce nesting complexity)
   */
  private async importTestRuns(
    runs: TestRun[],
    originalTestCases: TestCase[],
    projectId: string,
    result: ImportResult,
  ): Promise<void> {
    for (const run of runs) {
      try {
        // Check if the test case ID from the run still exists
        const testCaseExists = originalTestCases.some(
          (tc) => tc.id === run.testCaseId,
        );

        if (testCaseExists) {
          // Check if run with same ID already exists
          const existingRun = await this.getTestRun(run.id);

          if (existingRun) {
            // Update existing run
            await this.updateTestRun(run.id, {
              testCaseId: run.testCaseId,
              projectId: projectId,
              modelProvider: run.modelProvider,
              modelName: run.modelName,
              modelConfig: run.modelConfig,
              prompt: run.prompt,
              response: run.response,
              tokens: run.tokens,
              evaluationResults: run.evaluationResults,
              executionTime: run.executionTime,
              status: run.status,
              error: run.error,
              metadata: run.metadata,
            });
          } else {
            // Create new run with original ID preserved
            const runData = {
              ...run,
              projectId: projectId,
            };
            await this.createTestRun(runData);
          }
          result.imported.runs++;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to import test run: ${errorMessage}`);
      }
    }
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
}

// Export singleton instance
export const testDB = new TestManagementDatabase();
