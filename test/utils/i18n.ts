/**
 * Test utilities for i18n configuration in component tests
 * Provides complete i18n setup to eliminate translation warnings
 */

import { createI18n, type I18n } from "vue-i18n";

/**
 * Create a complete i18n instance for component tests
 * Includes all commonly used translation keys to prevent warnings
 */
export function createTestI18n(): I18n {
  return createI18n({
    legacy: false,
    locale: "en",
    messages: {
      en: {
        common: {
          export: "Export",
          import: "Import",
          save: "Save",
          cancel: "Cancel",
          delete: "Delete",
          edit: "Edit",
          create: "Create",
          update: "Update",
          submit: "Submit",
          loading: "Loading...",
          error: "Error",
          success: "Success",
        },
        dashboard: {
          title: "Dashboard",
          subtitle: "Monitor your AI testing environment and manage providers",
          activeProviders: "Active Providers",
          totalTests: "Total Tests",
          recentRuns: "Recent Runs",
          outOf: "out of {total}",
          testCasesReady: "ready to run",
          last24Hours: "last 24 hours",
          quickActions: "Quick Actions",
          createTest: "Create Test Case",
          createTestDescription: "Design new test scenarios for your AI models",
          viewResults: "View Results",
          viewResultsDescription: "Analyze test run results and performance metrics",
        },
        testManagement: {
          title: "Test Management",
          export: "Export",
          import: "Import",
          exportProject: "Export Project",
          importProject: "Import Project",
          createProject: "Create Project",
          testCases: "test cases",
          runs: "runs",
        },
        providers: {
          title: "AI Providers",
          addProvider: "Add Provider",
          configured: "Configured",
          notConfigured: "Not Configured",
        },
      },
    },
  });
}

/**
 * Minimal i18n instance for simple component tests
 * Use when you need basic i18n support but don't mount complex components
 */
export function createMinimalTestI18n(): I18n {
  return createI18n({
    legacy: false,
    locale: "en",
    messages: {
      en: {
        common: {
          export: "Export",
          import: "Import",
          save: "Save",
          cancel: "Cancel",
        },
      },
    },
  });
}