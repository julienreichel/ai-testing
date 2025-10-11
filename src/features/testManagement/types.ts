/**
 * Test Management System Types
 * Defines the structure for Projects, Test Cases, and Runs
 */

import type { RuleSet, RuleSetResult } from "../rules/types";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TestCase {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  prompt: string;
  rules: RuleSet[]; // Using existing rules system
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TestRun {
  id: string;
  testCaseId: string;
  projectId: string;
  modelProvider: string;
  modelName: string;
  modelConfig?: Record<string, unknown>;
  prompt: string; // Snapshot of prompt at run time
  response: string;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  evaluationResults?: {
    overallPass: boolean;
    message: string;
    ruleSetResults: RuleSetResult[];
  };
  executionTime: number; // in milliseconds
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

// Types are already imported above

/**
 * Database query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

/**
 * Import/Export data structures
 */
export interface ExportProject {
  project: Project;
  testCases: TestCase[];
  runs?: TestRun[];
}

export interface ImportResult {
  success: boolean;
  imported: {
    projects: number;
    testCases: number;
    runs: number;
  };
  errors: string[];
}

/**
 * Navigation tree structure
 */
export interface ProjectTreeNode {
  id: string;
  type: 'project' | 'testCase';
  name: string;
  children?: ProjectTreeNode[];
  parentId?: string;
  metadata?: {
    runCount?: number;
    lastRun?: Date;
    status?: 'active' | 'archived';
  };
}
