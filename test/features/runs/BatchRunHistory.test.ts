import { describe, it, expect } from "vitest";

// Simple sorting logic test
describe("BatchRunHistory - Sorting Logic", () => {
  // Define mock data for testing sorting
  const mockBatchRuns = [
    {
      id: "run-1",
      testCaseId: "alpha-test",
      providerId: "openai",
      createdAt: new Date("2023-01-01"),
      statistics: {
        passRate: 0.8,
        totalCost: 10.5
      }
    },
    {
      id: "run-2",
      testCaseId: "beta-test",
      providerId: "anthropic",
      createdAt: new Date("2023-01-02"),
      statistics: {
        passRate: 0.6,
        totalCost: 8.2
      }
    },
    {
      id: "run-3",
      testCaseId: "gamma-test",
      providerId: "openai",
      createdAt: new Date("2023-01-03"),
      statistics: {
        passRate: 0.9,
        totalCost: 15.0
      }
    }
  ];

  // Test sorting function implementation
  function sortBatchRuns(runs: typeof mockBatchRuns, field: string, direction: "asc" | "desc") {
    return [...runs].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (field) {
        case "testName":
          aVal = a.testCaseId;
          bVal = b.testCaseId;
          break;
        case "provider":
          aVal = a.providerId;
          bVal = b.providerId;
          break;
        case "passRate":
          aVal = a.statistics.passRate;
          bVal = b.statistics.passRate;
          break;
        case "cost":
          aVal = a.statistics.totalCost;
          bVal = b.statistics.totalCost;
          break;
        case "date":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal);
        return direction === "asc" ? comparison : -comparison;
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  it("should sort by test name alphabetically", () => {
    const sortedAsc = sortBatchRuns(mockBatchRuns, "testName", "asc");
    expect(sortedAsc[0]!.testCaseId).toBe("alpha-test");
    expect(sortedAsc[1]!.testCaseId).toBe("beta-test");
    expect(sortedAsc[2]!.testCaseId).toBe("gamma-test");

    const sortedDesc = sortBatchRuns(mockBatchRuns, "testName", "desc");
    expect(sortedDesc[0]!.testCaseId).toBe("gamma-test");
    expect(sortedDesc[2]!.testCaseId).toBe("alpha-test");
  });

  it("should sort by provider name", () => {
    const sortedAsc = sortBatchRuns(mockBatchRuns, "provider", "asc");
    expect(sortedAsc[0]!.providerId).toBe("anthropic");
    expect(sortedAsc[1]!.providerId).toBe("openai");
    expect(sortedAsc[2]!.providerId).toBe("openai");
  });

  it("should sort by pass rate numerically", () => {
    const sortedAsc = sortBatchRuns(mockBatchRuns, "passRate", "asc");
    expect(sortedAsc[0]!.statistics.passRate).toBe(0.6);
    expect(sortedAsc[1]!.statistics.passRate).toBe(0.8);
    expect(sortedAsc[2]!.statistics.passRate).toBe(0.9);

    const sortedDesc = sortBatchRuns(mockBatchRuns, "passRate", "desc");
    expect(sortedDesc[0]!.statistics.passRate).toBe(0.9);
    expect(sortedDesc[2]!.statistics.passRate).toBe(0.6);
  });

  it("should sort by cost numerically", () => {
    const sortedAsc = sortBatchRuns(mockBatchRuns, "cost", "asc");
    expect(sortedAsc[0]!.statistics.totalCost).toBe(8.2);
    expect(sortedAsc[1]!.statistics.totalCost).toBe(10.5);
    expect(sortedAsc[2]!.statistics.totalCost).toBe(15.0);
  });

  it("should sort by date chronologically", () => {
    const sortedAsc = sortBatchRuns(mockBatchRuns, "date", "asc");
    expect(sortedAsc[0]!.createdAt.getTime()).toBe(new Date("2023-01-01").getTime());
    expect(sortedAsc[2]!.createdAt.getTime()).toBe(new Date("2023-01-03").getTime());

    const sortedDesc = sortBatchRuns(mockBatchRuns, "date", "desc");
    expect(sortedDesc[0]!.createdAt.getTime()).toBe(new Date("2023-01-03").getTime());
    expect(sortedDesc[2]!.createdAt.getTime()).toBe(new Date("2023-01-01").getTime());
  });

  it("should handle unknown sort fields gracefully", () => {
    const sorted = sortBatchRuns(mockBatchRuns, "unknown", "asc");
    expect(sorted).toHaveLength(3);
    // Should return original order for unknown fields
  });
});
