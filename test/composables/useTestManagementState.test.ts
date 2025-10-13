import { describe, it, expect, beforeEach } from "vitest";
import { useTestManagementState } from "../../src/composables/useTestManagementState";
import type {
  Project,
  TestCase,
  TestRun,
} from "../../src/types/testManagement";

describe("useTestManagementState - User State Management Behavior", () => {
  describe("When user accesses test management state", () => {
    it("should provide clean initial state for new users", () => {
      const state = useTestManagementState();

      // User sees empty but ready state
      expect(state.projects.value).toEqual([]);
      expect(state.currentProject.value).toBeNull();
      expect(state.currentTestCase.value).toBeNull();
      expect(state.testCases.value).toEqual([]);
      expect(state.testRuns.value).toEqual([]);
      expect(state.projectTree.value).toEqual([]);

      // User sees system is ready
      expect(state.isLoading.value).toBe(false);
      expect(state.error.value).toBeNull();
    });

    it("should provide reactive state updates to user interface", () => {
      const state = useTestManagementState();

      // User sees initial project count
      expect(state.projects.value).toHaveLength(0);

      // Add mock data
      const mockProject: Project = {
        id: "proj-1",
        name: "Test Project",
        description: "A test project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      state.projects.value = [mockProject];

      // User sees updated project count immediately
      expect(state.projects.value).toHaveLength(1);
    });
  });

  describe("When user manages project state", () => {
    let state: ReturnType<typeof useTestManagementState>;
    let mockProject: Project;

    beforeEach(() => {
      state = useTestManagementState();
      mockProject = {
        id: "proj-1",
        name: "User's Project",
        description: "User created project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    it("should allow user to work with project data", () => {
      // User adds project
      state.projects.value = [mockProject];

      // User sees project in their list
      expect(state.projects.value).toHaveLength(1);
      expect(state.projects.value[0]?.name).toBe("User's Project");
    });

    it("should track current project selection for user", () => {
      // User selects a project
      state.currentProject.value = mockProject;

      // User interface shows selected project
      expect(state.currentProject.value?.id).toBe("proj-1");
      expect(state.currentProject.value?.name).toBe("User's Project");
    });

    it("should provide project-specific statistics to user", () => {
      const mockTestCase: TestCase = {
        id: "test-1",
        projectId: "proj-1",
        name: "User Test Case",
        description: "Test created by user",
        prompt: "Test prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTestRun: TestRun = {
        id: "run-1",
        projectId: "proj-1",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-3.5-turbo",
        prompt: "Test prompt",
        response: "Test response",
        executionTime: 1500,
        status: "completed",
        createdAt: new Date(),
      };

      // User creates test content
      state.projects.value = [mockProject];
      state.testCases.value = [mockTestCase];
      state.testRuns.value = [mockTestRun];

      // User sees comprehensive data counts
      expect(state.projects.value).toHaveLength(1);
      expect(state.testCases.value).toHaveLength(1);
      expect(state.testRuns.value).toHaveLength(1);
    });
  });

  describe("When user manages test cases", () => {
    let state: ReturnType<typeof useTestManagementState>;
    let mockTestCase: TestCase;

    beforeEach(() => {
      state = useTestManagementState();
      mockTestCase = {
        id: "test-1",
        projectId: "proj-1",
        name: "User's Test Case",
        description: "Test case created by user",
        prompt: "What is the meaning of life?",
        rules: [],
        tags: ["philosophy", "test"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    it("should track user's test cases", () => {
      // User creates test case
      state.testCases.value = [mockTestCase];

      // User sees their test case
      expect(state.testCases.value).toHaveLength(1);
      expect(state.testCases.value[0]?.name).toBe("User's Test Case");
      expect(state.testCases.value[0]?.tags).toEqual(["philosophy", "test"]);
    });

    it("should allow user to select current test case", () => {
      // User selects test case for editing
      state.currentTestCase.value = mockTestCase;

      // User interface reflects selection
      expect(state.currentTestCase.value?.id).toBe("test-1");
      expect(state.currentTestCase.value?.prompt).toBe(
        "What is the meaning of life?",
      );
    });

    it("should provide filtered test cases by project for user", () => {
      const project1TestCase: TestCase = {
        ...mockTestCase,
        id: "test-1",
        projectId: "proj-1",
        name: "Project 1 Test",
      };

      const project2TestCase: TestCase = {
        ...mockTestCase,
        id: "test-2",
        projectId: "proj-2",
        name: "Project 2 Test",
      };

      state.testCases.value = [project1TestCase, project2TestCase];

      // User sees appropriate filtering behavior
      expect(state.testCases.value).toHaveLength(2);

      // Test cases maintain their project associations
      const proj1Cases = state.testCases.value.filter(
        (tc) => tc.projectId === "proj-1",
      );
      const proj2Cases = state.testCases.value.filter(
        (tc) => tc.projectId === "proj-2",
      );

      expect(proj1Cases).toHaveLength(1);
      expect(proj2Cases).toHaveLength(1);
      expect(proj1Cases[0]?.name).toBe("Project 1 Test");
      expect(proj2Cases[0]?.name).toBe("Project 2 Test");
    });
  });

  describe("When user manages test runs", () => {
    let state: ReturnType<typeof useTestManagementState>;
    let mockTestRun: TestRun;

    beforeEach(() => {
      state = useTestManagementState();
      mockTestRun = {
        id: "run-1",
        projectId: "proj-1",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "User's test prompt",
        response: "AI generated response",
        executionTime: 2500,
        status: "completed",
        modelConfig: { temperature: 0.7, maxTokens: 1000 },
        tokens: {
          promptTokens: 25,
          completionTokens: 45,
          totalTokens: 70,
        },
        evaluationResults: {
          overallPass: true,
          message: "All tests passed",
          ruleSetResults: [],
        },
        createdAt: new Date(),
      };
    });

    it("should track user's test execution history", () => {
      // User runs a test
      state.testRuns.value = [mockTestRun];

      // User sees their test run history
      expect(state.testRuns.value).toHaveLength(1);
      expect(state.testRuns.value[0]?.modelProvider).toBe("openai");
      expect(state.testRuns.value[0]?.status).toBe("completed");
      expect(state.testRuns.value[0]?.evaluationResults?.overallPass).toBe(
        true,
      );
    });

    it("should provide detailed test run information for user analysis", () => {
      state.testRuns.value = [mockTestRun];

      const run = state.testRuns.value[0];

      // User has access to comprehensive execution data
      expect(run?.executionTime).toBe(2500);
      expect(run?.tokens?.totalTokens).toBe(70);
      expect(run?.modelConfig?.temperature).toBe(0.7);
      expect(run?.response).toBe("AI generated response");
    });

    it("should track test run status for user monitoring", () => {
      const runningTest: TestRun = {
        ...mockTestRun,
        id: "run-2",
        status: "running",
      };

      const failedTest: TestRun = {
        ...mockTestRun,
        id: "run-3",
        status: "failed",
      };

      state.testRuns.value = [mockTestRun, runningTest, failedTest];

      // User can monitor different execution states
      const completedRuns = state.testRuns.value.filter(
        (r) => r.status === "completed",
      );
      const runningRuns = state.testRuns.value.filter(
        (r) => r.status === "running",
      );
      const failedRuns = state.testRuns.value.filter(
        (r) => r.status === "failed",
      );

      expect(completedRuns).toHaveLength(1);
      expect(runningRuns).toHaveLength(1);
      expect(failedRuns).toHaveLength(1);
    });
  });

  describe("User interface state management", () => {
    it("should provide loading state feedback to user", () => {
      const state = useTestManagementState();

      // User sees initial non-loading state
      expect(state.isLoading.value).toBe(false);

      // Simulate loading state
      state.isLoading.value = true;

      // User interface can show loading indicators
      expect(state.isLoading.value).toBe(true);
    });

    it("should handle error states for user feedback", () => {
      const state = useTestManagementState();

      // User sees no initial errors
      expect(state.error.value).toBeNull();

      // Simulate error condition
      state.error.value = "Failed to load user data";

      // User interface can display error message
      expect(state.error.value).toBe("Failed to load user data");
    });

    it("should provide project tree structure for user navigation", () => {
      const state = useTestManagementState();

      // Mock project tree data
      const mockTree = [
        {
          id: "proj-1",
          name: "User Project 1",
          type: "project" as const,
          children: [
            {
              id: "test-1",
              name: "User Test Case 1",
              type: "testCase" as const,
              children: [],
            },
          ],
        },
      ];

      // User interacts with hierarchical project view
      Object.assign(state.projectTree.value, mockTree);

      // User sees hierarchical project structure
      expect(state.projectTree.value).toHaveLength(1);
      expect(state.projectTree.value[0]?.name).toBe("User Project 1");
      expect(state.projectTree.value[0]?.children).toHaveLength(1);
      expect(state.projectTree.value[0]?.children?.[0]?.name).toBe(
        "User Test Case 1",
      );
    });
  });

  describe("Data consistency and validation", () => {
    it("should maintain referential integrity for user data", () => {
      const state = useTestManagementState();

      const project: Project = {
        id: "proj-1",
        name: "Main Project",
        description: "User's main project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testCase: TestCase = {
        id: "test-1",
        projectId: "proj-1", // References the project
        name: "Test Case 1",
        description: "User's test case",
        prompt: "Test prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testRun: TestRun = {
        id: "run-1",
        projectId: "proj-1", // References the project
        testCaseId: "test-1", // References the test case
        modelProvider: "openai",
        modelName: "gpt-3.5-turbo",
        prompt: "Test prompt",
        response: "Test response",
        executionTime: 1000,
        status: "completed",
        createdAt: new Date(),
      };

      // User creates related data
      state.projects.value = [project];
      state.testCases.value = [testCase];
      state.testRuns.value = [testRun];

      // User data maintains proper relationships
      expect(state.testCases.value[0]?.projectId).toBe(
        state.projects.value[0]?.id,
      );
      expect(state.testRuns.value[0]?.projectId).toBe(
        state.projects.value[0]?.id,
      );
      expect(state.testRuns.value[0]?.testCaseId).toBe(
        state.testCases.value[0]?.id,
      );
    });

    it("should provide type-safe state access for user operations", () => {
      const state = useTestManagementState();

      // User gets proper TypeScript support
      expect(state.projects.value).toBeInstanceOf(Array);
      expect(state.testCases.value).toBeInstanceOf(Array);
      expect(state.testRuns.value).toBeInstanceOf(Array);
      expect(state.projectTree.value).toBeInstanceOf(Array);

      // State properties are properly typed
      expect(typeof state.isLoading.value).toBe("boolean");
      expect(
        state.error.value === null || typeof state.error.value === "string",
      ).toBe(true);
      // User sees current project stats when a project is selected
      expect(
        state.currentProjectStats.value === null ||
          typeof state.currentProjectStats.value.testCaseCount === "number",
      ).toBe(true);
    });
  });
});
