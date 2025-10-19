/**
 * CSV Export Composable
 * Provides utilities for exporting batch run results to CSV format
 * with proper escaping for multi-line content and special characters
 */

import type { BatchRunResult } from "composables/useBatchRunner";

// Constants to avoid magic numbers
const COST_DECIMAL_PLACES = 6;

/**
 * Escape CSV field content according to RFC 4180
 * - Wrap fields containing commas, quotes, or newlines in double quotes
 * - Escape double quotes by doubling them
 */
function escapeCsvField(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the field contains comma, quote, newline, or carriage return, wrap in quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    // Escape existing double quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }

  return stringValue;
}

/**
 * Convert batch run results to CSV format
 */
function convertResultsToCsv(results: BatchRunResult[]): string {
  // CSV Header
  const headers = [
    "Run",
    "Status",
    "Duration (ms)",
    "Cost ($)",
    "Passed",
    "Prompt Tokens",
    "Completion Tokens",
    "Total Tokens",
    "Retry Count",
    "Response",
  ];

  // Create CSV rows
  const csvRows = [
    // Header row
    headers.map((header) => escapeCsvField(header)).join(","),
    // Data rows
    ...results.map((result, index) => {
      const row = [
        index + 1, // Run number (1-indexed for user display)
        result.status,
        result.duration || 0,
        result.cost ? result.cost.toFixed(COST_DECIMAL_PLACES) : "0.000000", // More precision for cost
        result.passed ?? "N/A",
        result.tokenUsage?.promptTokens || 0,
        result.tokenUsage?.completionTokens || 0,
        result.tokenUsage?.totalTokens || 0,
        result.retryCount || 0,
        result.response || "", // This is where proper escaping is crucial
      ];

      return row.map((field) => escapeCsvField(field)).join(",");
    }),
  ];

  return csvRows.join("\n");
}

/**
 * Download CSV content as a file
 */
function downloadCsv(csvContent: string, filename: string): void {
  // Create blob with proper MIME type and BOM for Excel compatibility
  const BOM = "\uFEFF"; // Byte Order Mark for UTF-8
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL
  URL.revokeObjectURL(url);
}

/**
 * Generate a filename for batch run export
 */
function generateBatchRunFilename(
  batchRunId?: string,
  testCaseName?: string,
): string {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const baseFilename = testCaseName
    ? `batch_results_${testCaseName.replace(/[^a-zA-Z0-9]/g, "_")}`
    : `batch_results_${batchRunId || "export"}`;

  return `${baseFilename}_${timestamp}.csv`;
}

/**
 * CSV Export composable interface
 */
export interface CsvExportComposable {
  exportBatchResults: (
    results: BatchRunResult[],
    options?: {
      filename?: string;
      batchRunId?: string;
      testCaseName?: string;
    },
  ) => void;
  convertResultsToCsv: (results: BatchRunResult[]) => string;
  escapeCsvField: (
    value: string | number | boolean | null | undefined,
  ) => string;
}

/**
 * CSV Export composable
 *
 * Provides utilities for exporting batch run results to CSV format
 * with proper handling of multi-line content and special characters.
 *
 * @example
 * ```typescript
 * const csvExport = useCsvExport();
 *
 * // Export batch results
 * csvExport.exportBatchResults(batchResults, {
 *   testCaseName: "My Test Case",
 *   batchRunId: "batch-123"
 * });
 * ```
 */
export function useCsvExport(): CsvExportComposable {
  /**
   * Export batch run results to CSV file
   */
  const exportBatchResults = (
    results: BatchRunResult[],
    options: {
      filename?: string;
      batchRunId?: string;
      testCaseName?: string;
    } = {},
  ): void => {
    if (!results || results.length === 0) {
      console.warn("No results to export");
      return;
    }

    const csvContent = convertResultsToCsv(results);
    const filename =
      options.filename ||
      generateBatchRunFilename(options.batchRunId, options.testCaseName);

    downloadCsv(csvContent, filename);
  };

  return {
    exportBatchResults,
    convertResultsToCsv,
    escapeCsvField,
  };
}
