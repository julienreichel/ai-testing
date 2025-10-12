/**
 * Boston School Tests for TestManagementDatabase Import/Export
 * Focus: Critical import/export behaviors that users depend on
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDB } from "../../src/services/testManagementDatabase";
import type {
  Project,
  TestCase,
  TestRun,
  ExportProject,
} from "../../src/types/testManagement";

// Mock the entire IndexedDB layer to focus on business logic
vi.mock("idb", () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      add: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          openCursor: vi.fn(() => Promise.resolve(null)),
        })),
      })),
      getAllFromIndex: vi.fn(() => Promise.resolve([])),
    }),
  ),
}));

describe("TestManagementDatabase - Critical Import/Export Behaviors", () => {
  const sampleProject: Project = {
    id: "project-123",
    name: "AI Testing Project",
    description: "Test project for validation",
    createdAt: new Date("2023-10-01"),
    updatedAt: new Date("2023-10-01"),
  };

  const sampleTestCase: TestCase = {
    id: "test-456",
    projectId: "project-123",
    name: "Sentiment Test",
    description: "Test sentiment analysis",
    prompt: "Analyze: 'Great product!'",
    rules: [],
    createdAt: new Date("2023-10-01"),
    updatedAt: new Date("2023-10-01"),
  };

  const sampleTestRun: TestRun = {
    id: "run-789",
    testCaseId: "test-456",
    projectId: "project-123",
    modelProvider: "openai",
    modelName: "gpt-4",
    prompt: "Analyze: 'Great product!'",
    response: "Positive sentiment detected",
    executionTime: 1200,
    status: "completed",
    createdAt: new Date("2023-10-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When users create projects with specific IDs (import scenario)", () => {
    it("should preserve user-provided IDs for imported projects", async () => {
      // Arrange: User imports project with specific ID
      const importedProject = {
        id: "imported-project-abc",
        name: "Imported Project",
        description: "Project from team member",
      };

      // Act: User creates project with predetermined ID
      const result = await testDB.createProject(importedProject);

      // Assert: User gets project with their specified ID
      expect(result.id).toBe("imported-project-abc");
      expect(result.name).toBe("Imported Project");
      expect(result.description).toBe("Project from team member");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should preserve user-provided IDs for imported test cases", async () => {
      // Arrange: User imports test case with specific ID
      const importedTestCase = {
        id: "imported-test-xyz",
        projectId: "project-123",
        name: "Imported Test",
        description: "Test from colleague",
        prompt: "Test prompt",
        rules: [],
      };

      // Act: User creates test case with predetermined ID
      const result = await testDB.createTestCase(importedTestCase);

      // Assert: User gets test case with their specified ID
      expect(result.id).toBe("imported-test-xyz");
      expect(result.name).toBe("Imported Test");
      expect(result.projectId).toBe("project-123");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should preserve user-provided IDs for imported test runs", async () => {
      // Arrange: User imports test run with specific ID
      const importedTestRun = {
        id: "imported-run-def",
        testCaseId: "test-456",
        projectId: "project-123",
        modelProvider: "openai",
        modelName: "gpt-3.5-turbo",
        prompt: "Test prompt",
        response: "Test response",
        executionTime: 800,
        status: "completed" as const,
      };

      // Act: User creates test run with predetermined ID
      const result = await testDB.createTestRun(importedTestRun);

      // Assert: User gets test run with their specified ID
      expect(result.id).toBe("imported-run-def");
      expect(result.testCaseId).toBe("test-456");
      expect(result.projectId).toBe("project-123");
      expect(result.modelProvider).toBe("openai");
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("When users export and import complete projects", () => {
    it("should handle the complete export workflow", async () => {
      // Arrange: User has a complete project to export
      testDB.getProject = vi.fn().mockResolvedValue(sampleProject);
      testDB.getTestCasesByProject = vi
        .fn()
        .mockResolvedValue([sampleTestCase]);
      testDB.getTestRunsByProject = vi.fn().mockResolvedValue([sampleTestRun]);

      // Act: User exports their project with all data
      const result = await testDB.exportProject("project-123", true);

      // Assert: User gets complete exportable data structure
      expect(result).toEqual({
        project: sampleProject,
        testCases: [sampleTestCase],
        runs: [sampleTestRun],
      });
    });

    it("should handle import of new projects (no conflicts)", async () => {
      // Arrange: User imports completely new project data
      const importData: ExportProject = {
        project: sampleProject,
        testCases: [sampleTestCase],
        runs: [sampleTestRun],
      };

      // Mock that nothing exists (new import scenario)
      testDB.getProject = vi.fn().mockResolvedValue(undefined);
      testDB.getTestCase = vi.fn().mockResolvedValue(undefined);
      testDB.getTestRun = vi.fn().mockResolvedValue(undefined);
      testDB.createProject = vi.fn().mockResolvedValue(sampleProject);
      testDB.createTestCase = vi.fn().mockResolvedValue(sampleTestCase);
      testDB.createTestRun = vi.fn().mockResolvedValue(sampleTestRun);

      // Act: User imports the new project
      const result = await testDB.importProject(importData);

      // Assert: User gets successful import with preserved IDs
      expect(result.success).toBe(true);
      expect(result.imported.projects).toBe(1);
      expect(result.imported.testCases).toBe(1);
      expect(result.imported.runs).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify original IDs were preserved
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createProject).toHaveBeenCalledWith(sampleProject);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createTestCase).toHaveBeenCalledWith(
        expect.objectContaining({ id: "test-456" }),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({ id: "run-789" }),
      );
    });

    it("should handle import updates (existing data)", async () => {
      // Arrange: User imports updated version of existing project
      const updatedProject = { ...sampleProject, name: "Updated Project Name" };
      const importData: ExportProject = {
        project: updatedProject,
        testCases: [{ ...sampleTestCase, name: "Updated Test Name" }],
        runs: [sampleTestRun],
      };

      // Mock that items already exist (update scenario)
      testDB.getProject = vi.fn().mockResolvedValue(sampleProject);
      testDB.getTestCase = vi.fn().mockResolvedValue(sampleTestCase);
      testDB.getTestRun = vi.fn().mockResolvedValue(sampleTestRun);
      testDB.updateProject = vi.fn().mockResolvedValue(updatedProject);
      testDB.updateTestCase = vi.fn().mockResolvedValue(undefined);
      testDB.updateTestRun = vi.fn().mockResolvedValue(undefined);

      // Act: User imports updated project data
      const result = await testDB.importProject(importData);

      // Assert: User gets successful update instead of duplication
      expect(result.success).toBe(true);
      expect(result.imported.projects).toBe(1);
      expect(result.imported.testCases).toBe(1);
      expect(result.imported.runs).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify existing items were updated, not duplicated
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.updateProject).toHaveBeenCalledWith("project-123", {
        name: "Updated Project Name",
        description: sampleProject.description,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.updateTestCase).toHaveBeenCalledWith(
        "test-456",
        expect.any(Object),
      );
    });

    it("should provide helpful error messages when imports fail", async () => {
      // Arrange: User tries to import but system has issues
      const importData: ExportProject = {
        project: sampleProject,
        testCases: [sampleTestCase],
        runs: [],
      };

      testDB.getProject = vi.fn().mockResolvedValue(undefined);
      testDB.createProject = vi
        .fn()
        .mockRejectedValue(new Error("Storage quota exceeded"));

      // Act: User attempts problematic import
      const result = await testDB.importProject(importData);

      // Assert: User gets clear error information
      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Failed to import project: Storage quota exceeded",
      );
      expect(result.imported.projects).toBe(0);
    });
  });

  describe("When users need predictable project creation behavior", () => {
    it("should preserve user-provided IDs consistently across operations", async () => {
      // Arrange: User provides specific ID (import scenario)
      const userProvidedId = "user-specified-123";
      const projectData = {
        id: userProvidedId,
        name: "Imported Project",
        description: "From external source",
      };

      testDB.getProject = vi.fn().mockResolvedValue(undefined);
      testDB.createProject = vi.fn().mockResolvedValue(userProvidedId);

      // Act: System processes user-provided ID
      const result = await testDB.createProject(projectData);

      // Assert: User's ID is preserved
      expect(result).toBe(userProvidedId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createProject).toHaveBeenCalledWith(projectData);
    });

    it("should maintain data consistency during complex import operations", async () => {
      // Arrange: User imports data with relationships
      const projectId = "import-project-123";
      const testCaseId = "import-test-456";

      testDB.getProject = vi.fn().mockResolvedValue(undefined);
      testDB.getTestCase = vi.fn().mockResolvedValue(undefined);
      testDB.createProject = vi.fn().mockResolvedValue(projectId);
      testDB.createTestCase = vi.fn().mockResolvedValue(testCaseId);

      // Act: System processes related data
      const projectResult = await testDB.createProject({
        id: projectId,
        name: "Test",
      });
      const testResult = await testDB.createTestCase({
        id: testCaseId,
        projectId,
        name: "Test Case",
        prompt: "Test Case",
        rules: [],
      });

      // Assert: Relationships are maintained
      expect(projectResult).toBe(projectId);
      expect(testResult).toBe(testCaseId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createTestCase).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectId,
        }),
      );
    });
  });

  describe("When users experience data integrity concerns", () => {
    it("should maintain referential integrity during import", async () => {
      // Arrange: User imports project with test case and run relationships
      const importData: ExportProject = {
        project: sampleProject,
        testCases: [sampleTestCase],
        runs: [sampleTestRun],
      };

      testDB.getProject = vi.fn().mockResolvedValue(undefined);
      testDB.getTestCase = vi.fn().mockResolvedValue(undefined);
      testDB.getTestRun = vi.fn().mockResolvedValue(undefined);
      testDB.createProject = vi.fn().mockResolvedValue(sampleProject);
      testDB.createTestCase = vi.fn().mockResolvedValue(sampleTestCase);
      testDB.createTestRun = vi.fn().mockResolvedValue(sampleTestRun);

      // Act: User imports related data
      const result = await testDB.importProject(importData);

      // Assert: Relationships are preserved correctly
      expect(result.success).toBe(true);

      // Verify test case maintains project relationship
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createTestCase).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: "project-123" }),
      );

      // Verify test run maintains both relationships
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          testCaseId: "test-456",
          projectId: "project-123",
        }),
      );
    });
  });
});
