/**
 * Test Management Composable Tests - Boston School Style
 * Tests focus on user behavior and experience with test project management workflows
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  Project,
  TestCase,
  ExportProject,
  ImportResult,
} from "../../src/types/testManagement";

// Mock the database service (external dependency) - must be before imports
vi.mock("../../src/services/testManagementDatabase", () => ({
  testDB: {
    init: vi.fn(),
    getProjects: vi.fn(),
    createProject: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getTestCasesByProject: vi.fn(),
    createTestCase: vi.fn(),
    getTestCase: vi.fn(),
    updateTestCase: vi.fn(),
    deleteTestCase: vi.fn(),
    exportProject: vi.fn(),
    importProject: vi.fn(),
    getTotalTestCaseCount: vi.fn(),
  },
}));

import { useTestManagement } from "../../src/composables/useTestManagement";

// Get reference to mocked testDB
const { testDB: mockTestDB } = (await vi.importMock(
  "../../src/services/testManagementDatabase",
)) as {
  testDB: {
    init: ReturnType<typeof vi.fn>;
    getProjects: ReturnType<typeof vi.fn>;
    createProject: ReturnType<typeof vi.fn>;
    getProject: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    deleteProject: ReturnType<typeof vi.fn>;
    getTestCasesByProject: ReturnType<typeof vi.fn>;
    createTestCase: ReturnType<typeof vi.fn>;
    getTestCase: ReturnType<typeof vi.fn>;
    updateTestCase: ReturnType<typeof vi.fn>;
    deleteTestCase: ReturnType<typeof vi.fn>;
    exportProject: ReturnType<typeof vi.fn>;
    importProject: ReturnType<typeof vi.fn>;
    getTotalTestCaseCount: ReturnType<typeof vi.fn>;
  };
};

// Test data factories to create realistic scenarios
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: `project-${Date.now()}`,
  name: "My AI Testing Project",
  description: "A project for testing AI prompts and responses",
  createdAt: new Date("2024-01-01T10:00:00Z"),
  updatedAt: new Date("2024-01-01T10:00:00Z"),
  ...overrides,
});

const createMockTestCase = (overrides: Partial<TestCase> = {}): TestCase => ({
  id: `testcase-${Date.now()}`,
  projectId: "project-123",
  name: "Test AI Response Quality",
  description: "Verify that AI responses meet quality standards",
  prompt: "Explain quantum computing in simple terms",
  rules: [],
  tags: ["quality", "explanation"],
  createdAt: new Date("2024-01-01T10:30:00Z"),
  updatedAt: new Date("2024-01-01T10:30:00Z"),
  ...overrides,
});

describe("useTestManagement - User Project Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When user views their project dashboard", () => {
    it("should display all projects available to the user", async () => {
      // Arrange - User has multiple projects
      const userProjects = [
        createMockProject({ id: "p1", name: "Chatbot Testing" }),
        createMockProject({ id: "p2", name: "Content Generation" }),
      ];
      mockTestDB.getProjects.mockResolvedValue(userProjects);

      // Act - User views dashboard
      const management = useTestManagement();
      await management.loadProjects();

      // Assert - User sees all their projects
      expect(management.projects.value).toEqual(userProjects);
    });

    it("should show empty state when user has no projects", async () => {
      // Arrange - User has no projects
      mockTestDB.getProjects.mockResolvedValue([]);

      // Act - User views dashboard
      const management = useTestManagement();
      await management.loadProjects();

      // Assert - User sees empty project list
      expect(management.projects.value).toEqual([]);
    });
  });

  describe("When user creates a new project", () => {
    it("should allow user to create project with basic information", async () => {
      // Arrange - User wants to create a project
      const newProjectData = {
        name: "AI Response Analysis",
        description: "Testing various AI model responses",
      };
      const createdProject = createMockProject({
        id: "new-project-123",
        ...newProjectData,
      });
      mockTestDB.createProject.mockResolvedValue(createdProject);

      // Act - User creates project
      const management = useTestManagement();
      const result = await management.createProject(newProjectData);

      // Assert - User sees successful project creation
      expect(result).toEqual(createdProject);
      expect(mockTestDB.createProject).toHaveBeenCalledWith(newProjectData);
    });

    it("should handle project creation errors gracefully", async () => {
      // Arrange - Creation will fail
      const projectData = { name: "Test Project", description: "Test" };
      const errorMessage = "Database connection failed";
      mockTestDB.createProject.mockRejectedValue(new Error(errorMessage));

      // Act - User attempts to create project
      const management = useTestManagement();

      // Assert - User sees appropriate error handling
      await expect(management.createProject(projectData)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe("When user selects a project", () => {
    it("should display project details and associated test cases", async () => {
      // Arrange - User selects a project
      const selectedProject = createMockProject({ id: "project-123" });
      const associatedTestCases = [
        createMockTestCase({ projectId: "project-123", name: "Quality Test" }),
        createMockTestCase({ projectId: "project-123", name: "Speed Test" }),
      ];
      mockTestDB.getProject.mockResolvedValue(selectedProject);
      mockTestDB.getTestCasesByProject.mockResolvedValue(associatedTestCases);

      // Act - User selects project
      const management = useTestManagement();
      await management.selectProject("project-123");

      // Assert - User sees project details and test cases
      expect(management.currentProject.value).toEqual(selectedProject);
      expect(management.testCases.value).toEqual(associatedTestCases);
    });

    it("should handle selection of non-existent project", async () => {
      // Arrange - User selects invalid project
      mockTestDB.getProject.mockResolvedValue(null);

      // Act - User attempts to select project
      const management = useTestManagement();
      await management.selectProject("non-existent");

      // Assert - User sees appropriate error handling
      expect(management.currentProject.value).toBeNull();
    });
  });

  describe("When user deletes a project", () => {
    it("should allow user to remove project and clear current selection", async () => {
      // Arrange - User has selected a project and wants to delete it
      const projectToDelete = createMockProject({ id: "project-delete" });
      mockTestDB.getProject.mockResolvedValue(projectToDelete);
      mockTestDB.getTestCasesByProject.mockResolvedValue([]);
      mockTestDB.deleteProject.mockResolvedValue(undefined);

      // Act - User selects project first, then deletes it
      const management = useTestManagement();
      await management.selectProject("project-delete");
      await management.deleteProject("project-delete");

      // Assert - User sees successful deletion and cleared state
      expect(mockTestDB.deleteProject).toHaveBeenCalledWith("project-delete");
      expect(management.currentProject.value).toBeNull();
      expect(management.testCases.value).toEqual([]);
    });
  });
});

describe("useTestManagement - User Test Case Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When user creates test cases", () => {
    it("should allow user to create test cases within selected project", async () => {
      // Arrange - User has selected a project and wants to create test case
      const selectedProject = createMockProject({ id: "project-123" });
      const newTestCaseData = {
        name: "Email Response Quality",
        description: "Test AI email response generation",
        prompt: "Generate a professional email response",
        rules: [],
        tags: ["email", "professional"],
      };
      const createdTestCase = createMockTestCase({
        id: "tc-new",
        ...newTestCaseData,
        projectId: "project-123",
      });

      mockTestDB.getProject.mockResolvedValue(selectedProject);
      mockTestDB.getTestCasesByProject.mockResolvedValue([]);
      mockTestDB.createTestCase.mockResolvedValue(createdTestCase);
      mockTestDB.getTestCasesByProject
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createdTestCase]);

      // Act - User selects project and creates test case
      const management = useTestManagement();
      await management.selectProject("project-123");
      const result = await management.createTestCase(newTestCaseData);

      // Assert - User sees test case added to project
      expect(result).toEqual(createdTestCase);
      expect(mockTestDB.createTestCase).toHaveBeenCalledWith({
        ...newTestCaseData,
        projectId: "project-123",
      });
    });

    it("should prevent creation when no project is selected", async () => {
      // Arrange - User tries to create test case without project
      const testCaseData = {
        name: "Orphaned Test Case",
        prompt: "Test prompt",
        rules: [],
      };

      // Act & Assert - User sees error about missing project
      const management = useTestManagement();
      await expect(management.createTestCase(testCaseData)).rejects.toThrow(
        /No project selected/,
      );
    });
  });

  describe("When user manages test cases", () => {
    it("should allow user to select and view test case details", async () => {
      // Arrange - User wants to examine a test case
      const testCaseDetails = createMockTestCase({
        id: "tc-123",
        name: "Complex Reasoning Test",
        description: "Tests logical reasoning capabilities",
      });
      mockTestDB.getTestCase.mockResolvedValue(testCaseDetails);

      // Act - User selects test case
      const management = useTestManagement();
      await management.selectTestCase("tc-123");

      // Assert - User sees test case details
      expect(management.currentTestCase.value).toEqual(testCaseDetails);
    });

    it("should allow user to update test case details", async () => {
      // Arrange - User wants to refine test case
      const updatedData = {
        name: "Improved Test Case",
        prompt: "Enhanced prompt with better context",
      };
      const updatedTestCase = createMockTestCase({
        id: "tc-123",
        ...updatedData,
      });

      mockTestDB.updateTestCase.mockResolvedValue(updatedTestCase);

      // Act - User updates test case
      const management = useTestManagement();
      await management.updateTestCase("tc-123", updatedData);

      // Assert - User sees update operation completed
      expect(mockTestDB.updateTestCase).toHaveBeenCalledWith(
        "tc-123",
        updatedData,
      );
    });

    it("should allow user to delete unwanted test cases", async () => {
      // Arrange - User wants to remove test case
      mockTestDB.deleteTestCase.mockResolvedValue(undefined);

      // Act - User deletes test case
      const management = useTestManagement();
      await management.deleteTestCase("tc-delete");

      // Assert - User sees test case removed
      expect(mockTestDB.deleteTestCase).toHaveBeenCalledWith("tc-delete");
    });
  });
});

describe("useTestManagement - Import/Export Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When user exports projects", () => {
    it("should allow user to export project for backup or sharing", async () => {
      // Arrange - User wants to export project
      const exportData: ExportProject = {
        project: createMockProject({ id: "project-123" }),
        testCases: [
          createMockTestCase({ id: "tc-1", projectId: "project-123" }),
        ],
      };
      const expectedJson = JSON.stringify(exportData, null, 2);
      mockTestDB.exportProject.mockResolvedValue(exportData);

      // Act - User exports project
      const management = useTestManagement();
      const result = await management.exportProject("project-123");

      // Assert - User receives export JSON string
      expect(result).toBe(expectedJson);
      expect(mockTestDB.exportProject).toHaveBeenCalledWith("project-123");
    });
  });

  describe("When user imports projects", () => {
    it("should allow user to import project data successfully", async () => {
      // Arrange - User has valid JSON import data
      const importData: ExportProject = {
        project: createMockProject({ name: "Imported Project" }),
        testCases: [createMockTestCase({ name: "Imported Test" })],
      };
      const jsonData = JSON.stringify(importData);
      const importResult: ImportResult = {
        success: true,
        imported: {
          projects: 1,
          testCases: 1,
          runs: 0,
        },
        errors: [],
      };
      mockTestDB.importProject.mockResolvedValue(importResult);

      // Act - User imports project JSON
      const management = useTestManagement();
      const result = await management.importProject(jsonData);

      // Assert - User sees successful import
      expect(result).toEqual(importResult);
      // Note: JSON.parse converts Date strings back to Date objects, so we check the parsed data
      expect(mockTestDB.importProject).toHaveBeenCalledWith(
        JSON.parse(jsonData),
      );
    });

    it("should handle import errors gracefully", async () => {
      // Arrange - Import will fail
      const importData: ExportProject = {
        project: createMockProject(),
        testCases: [],
      };
      const jsonData = JSON.stringify(importData);
      const importResult: ImportResult = {
        success: false,
        imported: {
          projects: 0,
          testCases: 0,
          runs: 0,
        },
        errors: ["Invalid project data format", "Missing required fields"],
      };
      mockTestDB.importProject.mockResolvedValue(importResult);

      // Act - User attempts import
      const management = useTestManagement();
      const result = await management.importProject(jsonData);

      // Assert - User sees error details
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Invalid project data format");
    });
  });
});

describe("useTestManagement - Loading States and Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When user interacts with loading states", () => {
    it("should show loading state during project operations", async () => {
      // Arrange - Operation will take time
      let resolvePromise: (value: Project) => void;
      const delayedPromise = new Promise<Project>((resolve) => {
        resolvePromise = resolve;
      });
      mockTestDB.createProject.mockReturnValue(delayedPromise);
      mockTestDB.getProjects.mockResolvedValue([]);

      // Act - User initiates project creation
      const management = useTestManagement();
      const createPromise = management.createProject({
        name: "Test",
        description: "Test",
      });

      // Give Vue reactivity time to update
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert - User sees loading indicator
      expect(management.isLoading.value).toBe(true);

      // Complete operation
      resolvePromise!(createMockProject());
      await createPromise;

      // Assert - Loading state cleared
      expect(management.isLoading.value).toBe(false);
    });

    it("should handle operation errors appropriately", async () => {
      // Arrange - Operation will fail
      const errorMessage = "Network connection failed";
      mockTestDB.getProjects.mockRejectedValue(new Error(errorMessage));

      // Act - User attempts operation that fails
      const management = useTestManagement();

      // Assert - User sees error handling
      await expect(management.loadProjects()).rejects.toThrow(errorMessage);
      expect(management.isLoading.value).toBe(false);
    });
  });

  describe("When user encounters errors", () => {
    it("should provide clear error feedback for failed operations", async () => {
      // Arrange - Database operation fails
      const errorMessage = "Failed to connect to database";
      mockTestDB.createProject.mockRejectedValue(new Error(errorMessage));

      // Act - User attempts operation
      const management = useTestManagement();

      // Assert - User gets clear error message
      await expect(
        management.createProject({ name: "Test", description: "Test" }),
      ).rejects.toThrow(errorMessage);
    });
  });
});

describe("useTestManagement - Statistics and Insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When user views project statistics", () => {
    it("should display total test case count across all projects", async () => {
      // Arrange - User has multiple test cases
      const totalCount = 42;
      mockTestDB.getTotalTestCaseCount.mockResolvedValue(totalCount);

      // Act - User gets total test case count
      const management = useTestManagement();
      const result = await management.getTotalTestCaseCount();

      // Assert - User sees accurate count
      expect(result).toBe(totalCount);
      expect(mockTestDB.getTotalTestCaseCount).toHaveBeenCalled();
    });

    it("should handle statistics loading errors", async () => {
      // Arrange - Statistics loading fails
      mockTestDB.getTotalTestCaseCount.mockRejectedValue(
        new Error("Stats unavailable"),
      );

      // Act - User attempts to get statistics
      const management = useTestManagement();

      // Assert - Error is handled gracefully
      await expect(management.getTotalTestCaseCount()).rejects.toThrow(
        "Stats unavailable",
      );
    });
  });
});
