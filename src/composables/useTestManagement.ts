/**
 * Test Management Main Composable
 * Clean implementation with proper type safety
 */

import { computed, onMounted } from "vue";
import { useTestManagementState } from "./useTestManagementState";
import { testDB } from "../services/testManagementDatabase";
import type {
  Project,
  TestCase,
  TestRun,
  ExportProject,
  ImportResult,
} from "../types/testManagement";
import type { RuleSet, RuleSetResult } from "../types/rules";

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

export interface CreateTestRunData {
  projectId: string;
  testCaseId: string;
  modelProvider: string;
  modelName: string;
  prompt: string;
  response: string;
  executionTime: number;
  status: "running" | "completed" | "failed" | "cancelled";
  modelConfig?: Record<string, unknown>;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  evaluationResults?: {
    overallPass: boolean;
    message: string;
    ruleSetResults: RuleSetResult[];
  };
}

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
        state.testRuns.value = await testDB.getTestRunsByProject(projectId, {
          sortBy: "createdAt",
          sortOrder: "desc",
        });
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
        const runs = await testDB.getTestRunsByTestCase(testCaseId, {
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        // Update runs for this test case
        state.testRuns.value = [
          ...state.testRuns.value.filter(
            (run: TestRun) => run.testCaseId !== testCaseId,
          ),
          ...runs,
        ];
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
      state.testRuns.value = state.testRuns.value.filter(
        (run: TestRun) => run.testCaseId !== testCaseId,
      );
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

  const createTestRun = async (data: CreateTestRunData): Promise<TestRun> => {
    try {
      const testRun = await testDB.createTestRun(data);
      state.testRuns.value = [testRun, ...state.testRuns.value];
      return testRun;
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to create test run";
      throw err;
    }
  };

  const updateTestRun = async (
    runId: string,
    updates: Partial<TestRun>,
  ): Promise<void> => {
    try {
      const updatedRun = await testDB.updateTestRun(runId, updates);
      if (updatedRun) {
        const index = state.testRuns.value.findIndex(
          (run: TestRun) => run.id === runId,
        );
        if (index !== -1) {
          state.testRuns.value[index] = updatedRun;
        }
      }
    } catch (err) {
      state.error.value =
        err instanceof Error ? err.message : "Failed to update test run";
      throw err;
    }
  };

  const getTestCaseRuns = (testCaseId: string): TestRun[] => {
    return state.testRuns.value.filter(
      (run: TestRun) => run.testCaseId === testCaseId,
    );
  };

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  const exportProject = async (
    projectId: string,
    includeRuns = false,
  ): Promise<string> => {
    try {
      const exportData = await testDB.exportProject(projectId, includeRuns);
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

  // Initialize on mount
  onMounted(() => {
    void initialize().catch(console.error);
  });

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
    createTestRun,
    updateTestRun,
    getTestCaseRuns,
    exportProject,
    importProject,
  };
}
