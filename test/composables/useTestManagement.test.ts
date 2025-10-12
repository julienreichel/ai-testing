/**
 * Test Management Composable Tests - Boston School Style
 * Tests focus on user behavior and experience with the ACTUAL composable
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

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
    getTestRunsByProject: vi.fn(),
    getTestRunsByTestCase: vi.fn(),
    createTestRun: vi.fn(),
    updateTestRun: vi.fn(),
    exportProject: vi.fn(),
    importProject: vi.fn(),
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
    getTestRunsByProject: ReturnType<typeof vi.fn>;
    getTestRunsByTestCase: ReturnType<typeof vi.fn>;
    createTestRun: ReturnType<typeof vi.fn>;
    updateTestRun: ReturnType<typeof vi.fn>;
    exportProject: ReturnType<typeof vi.fn>;
    importProject: ReturnType<typeof vi.fn>;
  };
};

describe("useTestManagement - User Experience with Actual Composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTestDB.init.mockResolvedValue(undefined);
    mockTestDB.getProjects.mockResolvedValue([]);
  });

  it("should initialize database and load projects for user", async () => {
    // Arrange - Fresh system startup
    const mockProjects = [
      {
        id: "project-1",
        name: "User Project 1",
        description: "User's test project",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      },
    ];
    mockTestDB.getProjects.mockResolvedValue(mockProjects);

    const management = useTestManagement();

    // Act - User starts the application
    await management.initialize();

    // Assert - User sees system ready with their projects
    expect(mockTestDB.init).toHaveBeenCalled();
    expect(management.projects.value).toEqual(mockProjects);
    expect(management.isLoading.value).toBe(false);
  });

  it("should allow users to create new projects", async () => {
    // Arrange - User wants to create a project
    const mockProject = {
      id: "project-1",
      name: "My New Project",
      description: "A project for testing",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    mockTestDB.createProject.mockResolvedValue(mockProject);
    mockTestDB.getProjects.mockResolvedValue([mockProject]);

    const management = useTestManagement();

    // Act - User creates a project
    const result = await management.createProject({
      name: "My New Project",
      description: "A project for testing",
    });

    // Assert - User sees successful project creation
    expect(result).toEqual(mockProject);
    expect(mockTestDB.createProject).toHaveBeenCalled();
  });

  it("should handle errors gracefully for users", async () => {
    // Arrange - Database operation fails
    const error = new Error("Project name already exists");
    mockTestDB.createProject.mockRejectedValue(error);

    const management = useTestManagement();

    // Act & Assert - User sees clear error message
    await expect(
      management.createProject({ name: "Duplicate Project" }),
    ).rejects.toThrow("Project name already exists");
    // User sees error state updated (actual behavior from composable)
    expect(management.error.value).toBeTruthy();
  });

  it("should provide all necessary methods for user operations", () => {
    // Arrange - User needs comprehensive operation access
    const management = useTestManagement();

    // Act - Check available methods
    const methods = [
      "initialize",
      "clearError",
      "loadProjects",
      "createProject",
      "selectProject",
      "updateProject",
      "deleteProject",
      "createTestCase",
      "selectTestCase",
      "updateTestCase",
      "deleteTestCase",
      "createTestRun",
      "updateTestRun",
      "getTestCaseRuns",
      "exportProject",
      "importProject",
    ];

    // Assert - User has access to all necessary operations
    methods.forEach((method) => {
      expect(management).toHaveProperty(method);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(typeof (management as any)[method]).toBe("function");
    });
  });
});
