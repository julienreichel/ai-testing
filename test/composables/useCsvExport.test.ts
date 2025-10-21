import { describe, it, expect } from "vitest";
import { useCsvExport } from "composables/useCsvExport";
import type { BatchRunResult } from "composables/useBatchRunner";

describe("useCsvExport - CSV Export Functionality", () => {
  describe("escapeCsvField", () => {
    it("should escape fields containing commas", () => {
      const csvExport = useCsvExport();
      const result = csvExport.escapeCsvField("Hello, World");
      expect(result).toBe('"Hello, World"');
    });

    it("should escape fields containing quotes by doubling them", () => {
      const csvExport = useCsvExport();
      const result = csvExport.escapeCsvField('Say "Hello"');
      expect(result).toBe('"Say ""Hello"""');
    });

    it("should escape fields containing newlines", () => {
      const csvExport = useCsvExport();
      const result = csvExport.escapeCsvField("Line 1\nLine 2");
      expect(result).toBe('"Line 1\nLine 2"');
    });

    it("should handle null and undefined values", () => {
      const csvExport = useCsvExport();
      expect(csvExport.escapeCsvField(null)).toBe("");
      expect(csvExport.escapeCsvField(undefined)).toBe("");
    });

    it("should handle simple values without quotes", () => {
      const csvExport = useCsvExport();
      expect(csvExport.escapeCsvField("simple")).toBe("simple");
      expect(csvExport.escapeCsvField(123)).toBe("123");
      expect(csvExport.escapeCsvField(true)).toBe("true");
    });
  });

  describe("convertResultsToCsv", () => {
    it("should convert batch results to properly formatted CSV", () => {
      const csvExport = useCsvExport();

      const results: BatchRunResult[] = [
        {
          id: "test-1",
          runIndex: 0,
          status: "completed",
          startTime: new Date(),
          duration: 1500,
          cost: 0.001234,
          passed: true,
          retryCount: 0,
          response: "Simple response",
          tokenUsage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
          },
        },
        {
          id: "test-2",
          runIndex: 1,
          status: "completed",
          startTime: new Date(),
          duration: 2000,
          cost: 0.002345,
          passed: false,
          retryCount: 1,
          response: 'Response with "quotes" and\nmultiple lines\nand, commas',
          tokenUsage: {
            promptTokens: 15,
            completionTokens: 25,
            totalTokens: 40,
          },
        },
      ];

      const csv = csvExport.convertResultsToCsv(results);

      // Check header
      expect(csv).toContain(
        "Run,Status,Duration (ms),Cost ($),Passed,Prompt Tokens,Completion Tokens,Total Tokens,Retry Count,Response",
      );

      // Check that both simple and complex responses are present
      expect(csv).toContain("Simple response");
      expect(csv).toContain('Response with ""quotes""');
      expect(csv).toContain("multiple lines");
      expect(csv).toContain("and, commas");

      // Check structure for both rows
      expect(csv).toContain(
        "1,completed,1500,0.001234,true,10,20,30,0,Simple response",
      );
      expect(csv).toContain("2,completed,2000,0.002345,false,15,25,40,1,");

      // Verify proper CSV escaping is applied
      expect(csv).toMatch(/"Response with ""quotes""/); // Quotes are doubled
      expect(csv.split("\n").length).toBeGreaterThanOrEqual(3); // At least header + 2 data rows (but could be more due to multiline content)
    });

    it("should handle empty results array", () => {
      const csvExport = useCsvExport();
      const csv = csvExport.convertResultsToCsv([]);

      // Should only contain header
      const lines = csv.split("\n");
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe(
        "Run,Status,Duration (ms),Cost ($),Passed,Prompt Tokens,Completion Tokens,Total Tokens,Retry Count,Response",
      );
    });

    it("should handle missing optional fields", () => {
      const csvExport = useCsvExport();

      const results: BatchRunResult[] = [
        {
          id: "test-1",
          runIndex: 0,
          status: "failed",
          startTime: new Date(),
          retryCount: 0,
          // Missing duration, cost, passed, response, tokenUsage
        },
      ];

      const csv = csvExport.convertResultsToCsv(results);
      const lines = csv.split("\n");

      // Should handle missing fields gracefully
      expect(lines[1]).toBe("1,failed,0,0.000000,N/A,0,0,0,0,");
    });
  });

  describe("exportBatchResults", () => {
    it("should handle empty results gracefully", () => {
      const csvExport = useCsvExport();

      // Should not throw error (just console.warn for empty results)
      expect(() => {
        csvExport.exportBatchResults([]);
      }).not.toThrow();
    });

    // Note: Full download test skipped in Node.js environment due to browser APIs
    it("should generate CSV content for valid results", () => {
      const csvExport = useCsvExport();

      const results: BatchRunResult[] = [
        {
          id: "test-1",
          runIndex: 0,
          status: "completed",
          startTime: new Date(),
          duration: 1500,
          cost: 0.001234,
          passed: true,
          retryCount: 0,
          response: "Test response",
        },
      ];

      // Test the CSV generation part without the download
      const csvContent = csvExport.convertResultsToCsv(results);
      expect(csvContent).toContain("Test response");
      expect(csvContent).toContain("completed");
    });
  });

  describe("exportGenericCsv and convertDataToCsv", () => {
    it("should convert generic data to CSV format with auto-generated headers", () => {
      const csvExport = useCsvExport();

      const data = [
        { testName: "Test 1", provider: "OpenAI", model: "gpt-4", passRate: "85%" },
        { testName: "Test 2", provider: "Anthropic", model: "claude-3", passRate: "92%" },
      ];

      const csv = csvExport.convertDataToCsv(data);
      const lines = csv.split("\n");

      // Should have header + 2 data rows
      expect(lines).toHaveLength(3);

      // Check header (auto-generated from keys)
      expect(lines[0]).toBe("testName,provider,model,passRate");

      // Check data rows
      expect(lines[1]).toBe("Test 1,OpenAI,gpt-4,85%");
      expect(lines[2]).toBe("Test 2,Anthropic,claude-3,92%");
    });

    it("should convert generic data to CSV format with custom headers", () => {
      const csvExport = useCsvExport();

      const data = [
        { testName: "Test 1", provider: "OpenAI", model: "gpt-4" },
        { testName: "Test 2", provider: "Anthropic", model: "claude-3" },
      ];

      const customHeaders = ["Test Name", "Provider", "Model"];
      const csv = csvExport.convertDataToCsv(data, customHeaders);
      const lines = csv.split("\n");

      // Check custom header
      expect(lines[0]).toBe("Test Name,Provider,Model");

      // Data should use original keys but header displays custom names
      expect(lines[1]).toBe("Test 1,OpenAI,gpt-4");
    });

    it("should handle empty data gracefully", () => {
      const csvExport = useCsvExport();

      const emptyData: Array<Record<string, string>> = [];
      const csv = csvExport.convertDataToCsv(emptyData);

      expect(csv).toBe("");
    });

    it("should handle empty data with custom headers", () => {
      const csvExport = useCsvExport();

      const emptyData: Array<Record<string, string>> = [];
      const headers = ["Name", "Value"];
      const csv = csvExport.convertDataToCsv(emptyData, headers);

      expect(csv).toBe("Name,Value");
    });

    it("should properly escape CSV fields in generic data", () => {
      const csvExport = useCsvExport();

      const data = [
        {
          testName: 'Test with "quotes"',
          description: "Line 1\nLine 2",
          tags: "tag1, tag2, tag3",
        },
      ];

      const csv = csvExport.convertDataToCsv(data);

      // Should properly escape quotes, newlines, and commas
      expect(csv).toContain('"Test with ""quotes"""');
      expect(csv).toContain('"Line 1\nLine 2"');
      expect(csv).toContain('"tag1, tag2, tag3"');
    });

    it("should handle exportGenericCsv with empty data", () => {
      const csvExport = useCsvExport();

      // Should not throw error (just console.warn for empty data)
      expect(() => {
        csvExport.exportGenericCsv([], "test.csv");
      }).not.toThrow();
    });
  });
});
