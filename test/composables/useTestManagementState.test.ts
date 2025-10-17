import { describe, it, expect, beforeEach } from "vitest";
import { useTestManagementState } from "../../src/composables/useTestManagementState";
import type {
  Project,
  TestCase,
  TestRun,
} from "../../src/types/testManagement";

// eslint-disable-next-line max-lines-per-function
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

  describe("When user views project tree hierarchy", () => {
    let state: ReturnType<typeof useTestManagementState>;

    beforeEach(() => {
      state = useTestManagementState();
    });

    it("should provide hierarchical project tree with run metadata for user navigation", () => {
      const now = new Date();
      const earlierTime = new Date(now.getTime() - 60000); // 1 minute ago

      // Arrange - User has projects with test cases and runs
      const project: Project = {
        id: "proj-1",
        name: "AI Testing Project",
        description: "Main testing project",
        createdAt: now,
        updatedAt: now,
      };

      const testCase1: TestCase = {
        id: "test-1",
        projectId: "proj-1",
        name: "Response Quality Test",
        description: "Test AI response quality",
        prompt: "Test prompt 1",
        rules: [],
        createdAt: now,
        updatedAt: now,
      };

      const testCase2: TestCase = {
        id: "test-2",
        projectId: "proj-1",
        name: "Speed Test",
        description: "Test AI response speed",
        prompt: "Test prompt 2",
        rules: [],
        createdAt: now,
        updatedAt: now,
      };

      const testRun1: TestRun = {
        id: "run-1",
        projectId: "proj-1",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "Test prompt 1",
        response: "Test response 1",
        executionTime: 1500,
        status: "completed",
        createdAt: now,
      };

      const testRun2: TestRun = {
        id: "run-2",
        projectId: "proj-1",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-3.5-turbo",
        prompt: "Test prompt 1",
        response: "Test response 2",
        executionTime: 1200,
        status: "completed",
        createdAt: earlierTime,
      };

      const testRun3: TestRun = {
        id: "run-3",
        projectId: "proj-1",
        testCaseId: "test-2",
        modelProvider: "anthropic",
        modelName: "claude-3",
        prompt: "Test prompt 2",
        response: "Test response 3",
        executionTime: 800,
        status: "completed",
        createdAt: now,
      };

      // Act - User populates data
      state.projects.value = [project];
      state.testCases.value = [testCase1, testCase2];
      state.testRuns.value = [testRun1, testRun2, testRun3];

      // Assert - User sees hierarchical tree with metadata
      const tree = state.projectTree.value;

      expect(tree).toHaveLength(1);

      const projectNode = tree[0];
      expect(projectNode?.id).toBe("proj-1");
      expect(projectNode?.name).toBe("AI Testing Project");
      expect(projectNode?.type).toBe("project");
      expect(projectNode?.metadata?.runCount).toBe(3); // Total project runs
      expect(projectNode?.metadata?.status).toBe("active");

      // User sees test case children with run metadata
      expect(projectNode?.children).toHaveLength(2);

      const testCase1Node = projectNode?.children?.find(
        (child) => child.id === "test-1",
      );
      expect(testCase1Node?.name).toBe("Response Quality Test");
      expect(testCase1Node?.type).toBe("testCase");
      expect(testCase1Node?.parentId).toBe("proj-1");
      expect(testCase1Node?.metadata?.runCount).toBe(2); // Test case 1 has 2 runs
      expect(testCase1Node?.metadata?.lastRun).toEqual(now); // Most recent run time

      const testCase2Node = projectNode?.children?.find(
        (child) => child.id === "test-2",
      );
      expect(testCase2Node?.name).toBe("Speed Test");
      expect(testCase2Node?.metadata?.runCount).toBe(1); // Test case 2 has 1 run
      expect(testCase2Node?.metadata?.lastRun).toEqual(now);
    });

    it("should handle multiple projects with cross-references correctly", () => {
      // Arrange - User has multiple projects
      const project1: Project = {
        id: "proj-1",
        name: "Project Alpha",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const project2: Project = {
        id: "proj-2",
        name: "Project Beta",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testCase1: TestCase = {
        id: "test-1",
        projectId: "proj-1",
        name: "Alpha Test",
        prompt: "Alpha prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testCase2: TestCase = {
        id: "test-2",
        projectId: "proj-2",
        name: "Beta Test",
        prompt: "Beta prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testRun1: TestRun = {
        id: "run-1",
        projectId: "proj-1",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "Alpha prompt",
        response: "Alpha response",
        executionTime: 1000,
        status: "completed",
        createdAt: new Date(),
      };

      const testRun2: TestRun = {
        id: "run-2",
        projectId: "proj-2",
        testCaseId: "test-2",
        modelProvider: "anthropic",
        modelName: "claude-3",
        prompt: "Beta prompt",
        response: "Beta response",
        executionTime: 1200,
        status: "completed",
        createdAt: new Date(),
      };

      // Act - User sets up multiple projects
      state.projects.value = [project1, project2];
      state.testCases.value = [testCase1, testCase2];
      state.testRuns.value = [testRun1, testRun2];

      // Assert - User sees correctly separated project trees
      const tree = state.projectTree.value;
      expect(tree).toHaveLength(2);

      const alpha = tree.find((p) => p.id === "proj-1");
      const beta = tree.find((p) => p.id === "proj-2");

      expect(alpha?.children).toHaveLength(1);
      expect(beta?.children).toHaveLength(1);
      expect(alpha?.children?.[0]?.name).toBe("Alpha Test");
      expect(beta?.children?.[0]?.name).toBe("Beta Test");

      // Each project shows only its own runs
      expect(alpha?.metadata?.runCount).toBe(1);
      expect(beta?.metadata?.runCount).toBe(1);
    });

    it("should handle projects with no test cases gracefully", () => {
      // Arrange - User has project but no test cases yet
      const emptyProject: Project = {
        id: "empty-proj",
        name: "Empty Project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act - User creates project without test cases
      state.projects.value = [emptyProject];
      state.testCases.value = [];
      state.testRuns.value = [];

      // Assert - User sees project with empty children
      const tree = state.projectTree.value;
      expect(tree).toHaveLength(1);
      expect(tree[0]?.children).toHaveLength(0);
      expect(tree[0]?.metadata?.runCount).toBe(0);
    });

    it("should handle test cases with no runs correctly", () => {
      // Arrange - User has test cases but hasn't run them yet
      const project: Project = {
        id: "proj-1",
        name: "New Project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testCase: TestCase = {
        id: "test-1",
        projectId: "proj-1",
        name: "Unrun Test",
        prompt: "Test prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act - User creates test case but hasn't run it
      state.projects.value = [project];
      state.testCases.value = [testCase];
      state.testRuns.value = [];

      // Assert - User sees test case with no run metadata
      const tree = state.projectTree.value;
      const testCaseNode = tree[0]?.children?.[0];

      expect(testCaseNode?.metadata?.runCount).toBe(0);
      expect(testCaseNode?.metadata?.lastRun).toBeUndefined();
    });
  });

  describe("When user views current project statistics", () => {
    let state: ReturnType<typeof useTestManagementState>;

    beforeEach(() => {
      state = useTestManagementState();
    });

    it("should return null when no project is selected", () => {
      // Arrange - User has not selected any project
      state.currentProject.value = null;

      // Assert - User sees no stats without project selection
      expect(state.currentProjectStats.value).toBeNull();
    });

    it("should calculate comprehensive project statistics for user", () => {
      const now = new Date();
      const hour1Ago = new Date(now.getTime() - 3600000);
      const hour2Ago = new Date(now.getTime() - 7200000);

      // Arrange - User has selected project with test cases and runs
      const project: Project = {
        id: "proj-stats",
        name: "Statistics Project",
        createdAt: now,
        updatedAt: now,
      };

      const testCase1: TestCase = {
        id: "test-1",
        projectId: "proj-stats",
        name: "Quality Test",
        prompt: "Test quality",
        rules: [],
        createdAt: now,
        updatedAt: now,
      };

      const testCase2: TestCase = {
        id: "test-2",
        projectId: "proj-stats",
        name: "Performance Test",
        prompt: "Test performance",
        rules: [],
        createdAt: now,
        updatedAt: now,
      };

      // Successful run
      const successfulRun: TestRun = {
        id: "run-success",
        projectId: "proj-stats",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "Test quality",
        response: "Great response",
        executionTime: 1500,
        status: "completed",
        evaluationResults: {
          overallPass: true,
          message: "All tests passed",
          ruleSetResults: [],
        },
        createdAt: now,
      };

      // Failed run (completed but evaluation failed)
      const failedRun: TestRun = {
        id: "run-failed",
        projectId: "proj-stats",
        testCaseId: "test-2",
        modelProvider: "anthropic",
        modelName: "claude-3",
        prompt: "Test performance",
        response: "Poor response",
        executionTime: 3000,
        status: "completed",
        evaluationResults: {
          overallPass: false,
          message: "Tests failed",
          ruleSetResults: [],
        },
        createdAt: hour1Ago,
      };

      // Failed run (status failed)
      const errorRun: TestRun = {
        id: "run-error",
        projectId: "proj-stats",
        testCaseId: "test-1",
        modelProvider: "openai",
        modelName: "gpt-3.5-turbo",
        prompt: "Test quality",
        response: "",
        executionTime: 0,
        status: "failed",
        createdAt: hour2Ago,
      };

      // Act - User selects project and populates data
      state.currentProject.value = project;
      state.testCases.value = [testCase1, testCase2];
      state.testRuns.value = [successfulRun, failedRun, errorRun];

      // Assert - User sees comprehensive statistics
      const stats = state.currentProjectStats.value;

      expect(stats).not.toBeNull();
      expect(stats?.testCaseCount).toBe(2);
      expect(stats?.totalRuns).toBe(3);
      expect(stats?.successfulRuns).toBe(1); // Only the successful run
      expect(stats?.failedRuns).toBe(2); // Both failed and error runs
      expect(stats?.recentRuns).toHaveLength(3);

      // User sees runs sorted by most recent first
      expect(stats?.recentRuns[0]?.id).toBe("run-success");
      expect(stats?.recentRuns[1]?.id).toBe("run-failed");
      expect(stats?.recentRuns[2]?.id).toBe("run-error");
    });

    it("should limit recent runs to maximum allowed for user interface", () => {
      const now = new Date();

      // Arrange - User has project with many runs (more than MAX_RECENT_RUNS)
      const project: Project = {
        id: "proj-many-runs",
        name: "Project with Many Runs",
        createdAt: now,
        updatedAt: now,
      };

      const testCase: TestCase = {
        id: "test-many",
        projectId: "proj-many-runs",
        name: "Frequently Run Test",
        prompt: "Test prompt",
        rules: [],
        createdAt: now,
        updatedAt: now,
      };

      // Create 15 test runs (more than MAX_RECENT_RUNS = 10)
      const testRuns: TestRun[] = [];
      for (let i = 0; i < 15; i++) {
        testRuns.push({
          id: `run-${i}`,
          projectId: "proj-many-runs",
          testCaseId: "test-many",
          modelProvider: "openai",
          modelName: "gpt-4",
          prompt: "Test prompt",
          response: `Response ${i}`,
          executionTime: 1000 + i * 100,
          status: "completed",
          evaluationResults: {
            overallPass: i % 2 === 0, // Alternate pass/fail
            message: `Test ${i}`,
            ruleSetResults: [],
          },
          createdAt: new Date(now.getTime() - i * 60000), // Each 1 minute apart
        });
      }

      // Act - User creates many runs
      state.currentProject.value = project;
      state.testCases.value = [testCase];
      state.testRuns.value = testRuns;

      // Assert - User sees limited recent runs (most recent 10)
      const stats = state.currentProjectStats.value;

      expect(stats?.totalRuns).toBe(15);
      expect(stats?.recentRuns).toHaveLength(10); // Limited to MAX_RECENT_RUNS

      // User sees most recent runs first
      expect(stats?.recentRuns[0]?.id).toBe("run-0"); // Most recent
      expect(stats?.recentRuns[9]?.id).toBe("run-9"); // 10th most recent
    });

    it("should handle runs without evaluation results correctly", () => {
      // Arrange - User has runs without evaluation results
      const project: Project = {
        id: "proj-no-eval",
        name: "Project with Incomplete Runs",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testCase: TestCase = {
        id: "test-no-eval",
        projectId: "proj-no-eval",
        name: "Test without Evaluation",
        prompt: "Test prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const runWithoutEval: TestRun = {
        id: "run-no-eval",
        projectId: "proj-no-eval",
        testCaseId: "test-no-eval",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "Test prompt",
        response: "Response",
        executionTime: 1000,
        status: "completed",
        // No evaluationResults
        createdAt: new Date(),
      };

      const runWithEvalUndefined: TestRun = {
        id: "run-eval-undefined",
        projectId: "proj-no-eval",
        testCaseId: "test-no-eval",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "Test prompt",
        response: "Response",
        executionTime: 1000,
        status: "completed",
        evaluationResults: undefined,
        createdAt: new Date(),
      };

      // Act - User has runs without evaluation results
      state.currentProject.value = project;
      state.testCases.value = [testCase];
      state.testRuns.value = [runWithoutEval, runWithEvalUndefined];

      // Assert - User sees these treated as failed runs
      const stats = state.currentProjectStats.value;

      expect(stats?.totalRuns).toBe(2);
      expect(stats?.successfulRuns).toBe(0); // No successful runs without evaluation
      expect(stats?.failedRuns).toBe(2); // Both treated as failed
    });

    it("should exclude runs from other projects in statistics", () => {
      // Arrange - User has multiple projects but selects one
      const selectedProject: Project = {
        id: "proj-selected",
        name: "Selected Project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherProject: Project = {
        id: "proj-other",
        name: "Other Project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const selectedTestCase: TestCase = {
        id: "test-selected",
        projectId: "proj-selected",
        name: "Selected Test",
        prompt: "Selected prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherTestCase: TestCase = {
        id: "test-other",
        projectId: "proj-other",
        name: "Other Test",
        prompt: "Other prompt",
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const selectedRun: TestRun = {
        id: "run-selected",
        projectId: "proj-selected",
        testCaseId: "test-selected",
        modelProvider: "openai",
        modelName: "gpt-4",
        prompt: "Selected prompt",
        response: "Selected response",
        executionTime: 1000,
        status: "completed",
        evaluationResults: {
          overallPass: true,
          message: "Passed",
          ruleSetResults: [],
        },
        createdAt: new Date(),
      };

      const otherRun: TestRun = {
        id: "run-other",
        projectId: "proj-other",
        testCaseId: "test-other",
        modelProvider: "anthropic",
        modelName: "claude-3",
        prompt: "Other prompt",
        response: "Other response",
        executionTime: 1200,
        status: "completed",
        evaluationResults: {
          overallPass: false,
          message: "Failed",
          ruleSetResults: [],
        },
        createdAt: new Date(),
      };

      // Act - User selects one project among many
      state.currentProject.value = selectedProject;
      state.projects.value = [selectedProject, otherProject];
      state.testCases.value = [selectedTestCase, otherTestCase];
      state.testRuns.value = [selectedRun, otherRun];

      // Assert - User sees only selected project statistics
      const stats = state.currentProjectStats.value;

      expect(stats?.testCaseCount).toBe(1); // Only selected project test cases
      expect(stats?.totalRuns).toBe(1); // Only selected project runs
      expect(stats?.successfulRuns).toBe(1); // Only selected project successful runs
      expect(stats?.failedRuns).toBe(0); // Only selected project failed runs
      expect(stats?.recentRuns).toHaveLength(1);
      expect(stats?.recentRuns[0]?.id).toBe("run-selected");
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
