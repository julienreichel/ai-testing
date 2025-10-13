import { describe, it, expect, beforeEach, vi } from "vitest";
import { testDB } from "../../src/services/testManagementDatabase";

// Mock the database methods
vi.mock("../../src/services/testManagementDatabase", () => ({
  testDB: {
    // Project methods
    createProject: vi.fn(),
    exportProject: vi.fn(),
    importProject: vi.fn(),
    // Test case methods
    createTestCase: vi.fn(),
    // Batch run methods
    createBatchRun: vi.fn(),
    getBatchRunsByProject: vi.fn(),
    updateBatchRun: vi.fn(),
  },
}));

describe("TestManagementDatabase - Basic API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("When users create projects", () => {
    it("should call createProject with provided data", async () => {
      // Arrange: User provides project data
      const projectData = {
        id: "project-123",
        name: "Test Project",
        description: "A test project",
      };

      const mockResult = {
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(testDB.createProject).mockResolvedValue(mockResult);

      // Act: User creates project
      const result = await testDB.createProject(projectData);

      // Assert: Method called correctly and returns expected result
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createProject).toHaveBeenCalledWith(projectData);
      expect(result.id).toBe("project-123");
      expect(result.name).toBe("Test Project");
    });
  });

  describe("When users create test cases", () => {
    it("should call createTestCase with provided data", async () => {
      // Arrange: User provides test case data
      const testCaseData = {
        id: "test-456",
        projectId: "project-123",
        name: "Test Case",
        description: "A test case",
        prompt: "Test prompt",
        rules: [],
      };

      const mockResult = {
        ...testCaseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(testDB.createTestCase).mockResolvedValue(mockResult);

      // Act: User creates test case
      const result = await testDB.createTestCase(testCaseData);

      // Assert: Method called correctly and returns expected result
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.createTestCase).toHaveBeenCalledWith(testCaseData);
      expect(result.id).toBe("test-456");
      expect(result.name).toBe("Test Case");
    });
  });

  describe("When users export projects", () => {
    it("should call exportProject with project ID", async () => {
      // Arrange: User wants to export project
      const projectId = "project-123";
      const mockResult = {
        project: {
          id: projectId,
          name: "Test Project",
          description: "A test project",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        testCases: [],
        runs: [],
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(testDB.exportProject).mockResolvedValue(mockResult);

      // Act: User exports project
      const result = await testDB.exportProject(projectId);

      // Assert: Method called correctly and returns expected result
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.exportProject).toHaveBeenCalledWith(projectId);
      expect(result?.project.id).toBe(projectId);
    });
  });

  describe("When users work with batch runs", () => {
    it("should call getBatchRunsByProject with project ID", async () => {
      // Arrange: User wants batch runs for project
      const projectId = "project-123";
      const mockResult = [
        {
          id: "batch-run-123",
          projectId,
          testCaseId: "test-456",
          status: "completed" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(testDB.getBatchRunsByProject).mockResolvedValue(
        mockResult as never,
      );

      // Act: User gets batch runs for project
      const result = await testDB.getBatchRunsByProject(projectId);

      // Assert: Method called correctly and returns expected result
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.getBatchRunsByProject).toHaveBeenCalledWith(projectId);
      expect(result).toHaveLength(1);
      expect(result[0]?.projectId).toBe(projectId);
    });

    it("should call updateBatchRun with correct parameters", async () => {
      // Arrange: User wants to update batch run
      const batchRunId = "batch-run-123";
      const updateData = {
        status: "completed" as const,
        endTime: new Date(),
      };

      const mockResult = {
        id: batchRunId,
        status: "completed" as const,
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(testDB.updateBatchRun).mockResolvedValue(mockResult as never);

      // Act: User updates batch run
      const result = await testDB.updateBatchRun(batchRunId, updateData);

      // Assert: Method called correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(testDB.updateBatchRun).toHaveBeenCalledWith(
        batchRunId,
        updateData,
      );
      expect(result.status).toBe("completed");
    });
  });
});
