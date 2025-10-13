/**
 * Test Management Main Composable
 * Clean implementation with proper type safety
 */

import { computed } from "vue";
import { useTestManagementState } from "./useTestManagementState";
import { testDB } from "../services/testManagementDatabase";
import type {
  Project,
  TestCase,
  ExportProject,
  ImportResult,
} from "../types/testManagement";
import type { RuleSet } from "../types/rules";

const JSON_INDENT_SPACES = 2;

// Input interfaces for operations
export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface CreateTestCaseData {
  name: string;
  description?: string;
  prompt: string;
  rules: RuleSet[];
  tags?: string[];
}

// Note: Individual test run creation is now handled through batch runs
// Use useBatchRunner composable for running tests and creating batch sessions

/**
 * Main Test Management Composable
 */
// eslint-disable-next-line max-lines-per-function, @typescript-eslint/explicit-function-return-type
export function useTestManagement() {
  const state = useTestManagementState();

  // ==================== INITIALIZATION ====================

  const initialize = async (): Promise<void> => {
    try {
      state.isLoading.value = true;
      state.error.value = null;
      await testDB.init();
      await loadProjects();
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to initialize database";
      console.error("Failed to initialize test management:", err);
    } finally {
      state.isLoading.value = false;
    }
  };

  const clearError = (): void => {
    state.error.value = null;
  };

  // ==================== PROJECT OPERATIONS ====================

  const loadProjects = async (): Promise<void> => {
    try {
      state.projects.value = await testDB.getProjects({
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to load projects";
      throw err;
    }
  };

  const createProject = async (data: CreateProjectData): Promise<Project> => {
    try {
      state.isLoading.value = true;
      const project = await testDB.createProject(data);
      await loadProjects();
      return project;
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to create project";
      throw err;
    } finally {
      state.isLoading.value = false;
    }
  };

  const selectProject = async (projectId: string): Promise<void> => {
    try {
      state.isLoading.value = true;
      state.currentProject.value = (await testDB.getProject(projectId)) || null;
      if (state.currentProject.value) {
        state.testCases.value = await testDB.getTestCasesByProject(projectId, {
          sortBy: "updatedAt",
          sortOrder: "desc",
        });
        // Note: Batch runs are now handled separately via BatchRunHistory component
        // Individual test runs are no longer managed at this level
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to select project";
      throw err;
    } finally {
      state.isLoading.value = false;
    }
  };

  const updateProject = async (
    projectId: string,
    updates: Partial<Project>,
  ): Promise<void> => {
    try {
      await testDB.updateProject(projectId, updates);
      await loadProjects();
      if (state.currentProject.value?.id === projectId) {
        state.currentProject.value = {
          ...state.currentProject.value,
          ...updates,
          updatedAt: new Date(),
        };
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to update project";
      throw err;
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      await testDB.deleteProject(projectId);
      await loadProjects();
      if (state.currentProject.value?.id === projectId) {
        state.currentProject.value = null;
        state.testCases.value = [];
        state.testRuns.value = [];
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to delete project";
      throw err;
    }
  };

  // ==================== TEST CASE OPERATIONS ====================

  const createTestCase = async (
    data: CreateTestCaseData,
  ): Promise<TestCase> => {
    if (!state.currentProject.value) {
      throw new Error("No project selected");
    }

    try {
      const testCase = await testDB.createTestCase({
        ...data,
        projectId: state.currentProject.value.id,
      });
      state.testCases.value = [testCase, ...state.testCases.value];
      return testCase;
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to create test case";
      throw err;
    }
  };

  const selectTestCase = async (testCaseId: string): Promise<void> => {
    try {
      state.currentTestCase.value =
        (await testDB.getTestCase(testCaseId)) || null;
      if (state.currentTestCase.value) {
        // Note: Individual test runs are now part of batch run sessions
        // Use the batch run history component to view individual run results
        // Batch runs can be accessed via getBatchRunsByTestCase if needed
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to select test case";
      throw err;
    }
  };

  const updateTestCase = async (
    testCaseId: string,
    updates: Partial<TestCase>,
  ): Promise<void> => {
    try {
      const updatedTestCase = await testDB.updateTestCase(testCaseId, updates);
      if (updatedTestCase) {
        const index = state.testCases.value.findIndex(
          (tc: TestCase) => tc.id === testCaseId,
        );
        if (index !== -1) {
          state.testCases.value[index] = updatedTestCase;
        }
        if (state.currentTestCase.value?.id === testCaseId) {
          state.currentTestCase.value = updatedTestCase;
        }
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to update test case";
      throw err;
    }
  };

  const deleteTestCase = async (testCaseId: string): Promise<void> => {
    try {
      await testDB.deleteTestCase(testCaseId);
      state.testCases.value = state.testCases.value.filter(
        (tc: TestCase) => tc.id !== testCaseId,
      );
      // Note: Individual test runs are no longer managed here
      // Batch runs are handled separately via useBatchRunPersistence
      if (state.currentTestCase.value?.id === testCaseId) {
        state.currentTestCase.value = null;
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to delete test case";
      throw err;
    }
  };

  // ==================== TEST RUN OPERATIONS ====================

  // Note: Individual test run creation/updates are now handled through batch runs
  // Use useBatchRunner composable for running tests and useBatchRunPersistence for data management

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  const exportProject = async (projectId: string): Promise<string> => {
    try {
      const exportData = await testDB.exportProject(projectId);
      if (!exportData) {
        throw new Error("Project not found");
      }
      return JSON.stringify(exportData, null, JSON_INDENT_SPACES);
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to export project";
      throw err;
    }
  };

  const importProject = async (jsonData: string): Promise<ImportResult> => {
    try {
      const data: ExportProject = JSON.parse(jsonData);
      const result = await testDB.importProject(data);
      await loadProjects();
      return result;
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to import project";
      throw err;
    }
  };

  const getTotalTestCaseCount = async (): Promise<number> => {
    try {
      return await testDB.getTotalTestCaseCount();
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to get test case count";
      throw err;
    }
  };

  // ==================== RETURN API ====================

  return {
    // State (readonly computed refs)
    projects: computed(() => state.projects.value),
    currentProject: computed(() => state.currentProject.value),
    currentTestCase: computed(() => state.currentTestCase.value),
    testCases: computed(() => state.testCases.value),
    testRuns: computed(() => state.testRuns.value),
    projectTree: state.projectTree,
    currentProjectStats: state.currentProjectStats,
    isLoading: computed(() => state.isLoading.value),
    error: computed(() => state.error.value),

    // Methods
    initialize,
    clearError,
    loadProjects,
    createProject,
    selectProject,
    updateProject,
    deleteProject,
    createTestCase,
    selectTestCase,
    updateTestCase,
    deleteTestCase,
    exportProject,
    importProject,
    getTotalTestCaseCount,
  };
}
