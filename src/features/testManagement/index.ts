/**
 * Test Management System - Main Export File
 *
 * This module provides a complete Test Management system for organizing
 * and executing tests with the rules engine. It includes:
 * - Project management
 * - Test case organization
 * - Test run tracking and evaluation
 * - Import/export capabilities
 * - IndexedDB persistence
 */

// Main composable (note: has ESLint complexity warning but is functional)
export { useTestManagement } from '../../composables/useTestManagement';
export type { CreateProjectData, CreateTestCaseData, CreateTestRunData } from '../../composables/useTestManagement';

// State management
export { useTestManagementState } from './state';
export type { ProjectStats } from './state';

// Database service
export { testDB } from './database';

// Core types
export type {
  Project,
  TestCase,
  TestRun,
  QueryOptions,
  ExportProject,
  ImportResult,
  ProjectTreeNode,
} from './types';

// Re-export rules types for convenience
export type { RuleSet, RuleSetResult } from '../rules/types';

/**
 * Usage Example:
 *
 * ```vue
 * <script setup>
 * import { useTestManagement } from '@/features/testManagement';
 *
 * const testManager = useTestManagement();
 *
 * // Create a project
 * const project = await testManager.createProject({
 *   name: 'My Test Project',
 *   description: 'Testing AI outputs'
 * });
 *
 * // Create a test case
 * const testCase = await testManager.createTestCase({
 *   name: 'Basic Response Test',
 *   prompt: 'What is the capital of France?',
 *   rules: [{ id: '1', rules: [{ id: 'r1', type: 'contains', value: 'Paris' }], aggregation: 'OR' }]
 * });
 *
 * // Run a test
 * const testRun = await testManager.createTestRun({
 *   projectId: project.id,
 *   testCaseId: testCase.id,
 *   modelProvider: 'openai',
 *   modelName: 'gpt-4',
 *   prompt: testCase.prompt,
 *   response: 'The capital of France is Paris.',
 *   executionTime: 1200,
 *   status: 'completed'
 * });
 * </script>
 * ```
 */
