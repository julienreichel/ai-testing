/**
 * Test Management Composable - Core State and Types
 * Provides reactive state and type definitions
 */

import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import type {
  Project,
  TestCase,
  TestRun,
  ProjectTreeNode,
  ImportResult
} from './types';
import type { RuleSet } from '../rules/types';

// Constants
const MAX_RECENT_RUNS = 10;

export interface ProjectStats {
  testCaseCount: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  recentRuns: TestRun[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface CreateTestCaseData {
  name: string;
  description?: string;
  prompt: string;
  rules: RuleSet[];
  tags?: string[];
}

export type CreateTestRunData = Omit<TestRun, 'id' | 'createdAt'>;

export interface TestManagementComposable {
  // State
  projects: Readonly<Ref<Project[]>>;
  currentProject: Readonly<Ref<Project | null>>;
  currentTestCase: Readonly<Ref<TestCase | null>>;
  testCases: Readonly<Ref<TestCase[]>>;
  testRuns: Readonly<Ref<TestRun[]>>;
  projectTree: Readonly<Ref<ProjectTreeNode[]>>;
  currentProjectStats: Readonly<Ref<ProjectStats | null>>;
  isLoading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;

  // Methods
  initialize: () => Promise<void>;
  clearError: () => void;
  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  selectProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  createTestCase: (data: CreateTestCaseData) => Promise<TestCase>;
  selectTestCase: (testCaseId: string) => Promise<void>;
  updateTestCase: (testCaseId: string, updates: Partial<TestCase>) => Promise<void>;
  deleteTestCase: (testCaseId: string) => Promise<void>;
  createTestRun: (data: CreateTestRunData) => Promise<TestRun>;
  updateTestRun: (runId: string, updates: Partial<TestRun>) => Promise<void>;
  getTestCaseRuns: (testCaseId: string) => TestRun[];
  exportProject: (projectId: string, includeRuns?: boolean) => Promise<string>;
  importProject: (jsonData: string) => Promise<ImportResult>;
}

/**
 * Core state management for test management system
 */
export function useTestManagementState(): {
  projects: Ref<Project[]>;
  currentProject: Ref<Project | null>;
  currentTestCase: Ref<TestCase | null>;
  testCases: Ref<TestCase[]>;
  testRuns: Ref<TestRun[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  projectTree: Readonly<Ref<ProjectTreeNode[]>>;
  currentProjectStats: Readonly<Ref<ProjectStats | null>>;
} {
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const currentTestCase = ref<TestCase | null>(null);
  const testCases = ref<TestCase[]>([]);
  const testRuns = ref<TestRun[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const projectTree = computed<ProjectTreeNode[]>(() => {
    return projects.value.map(project => ({
      id: project.id,
      type: 'project' as const,
      name: project.name,
      children: testCases.value
        .filter(tc => tc.projectId === project.id)
        .map(testCase => ({
          id: testCase.id,
          type: 'testCase' as const,
          name: testCase.name,
          parentId: project.id,
          metadata: {
            runCount: testRuns.value.filter(run => run.testCaseId === testCase.id).length,
            lastRun: testRuns.value
              .filter(run => run.testCaseId === testCase.id)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt,
          },
        })),
      metadata: {
        runCount: testRuns.value.filter(run => run.projectId === project.id).length,
        status: 'active' as const,
      },
    }));
  });

  const currentProjectStats = computed<ProjectStats | null>(() => {
    if (!currentProject.value) return null;

    const projectTestCases = testCases.value.filter(tc => tc.projectId === currentProject.value!.id);
    const projectRuns = testRuns.value.filter(run => run.projectId === currentProject.value!.id);
    const recentRuns = projectRuns
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, MAX_RECENT_RUNS);

    return {
      testCaseCount: projectTestCases.length,
      totalRuns: projectRuns.length,
      successfulRuns: projectRuns.filter(run => run.status === 'completed' && run.evaluationResults?.overallPass).length,
      failedRuns: projectRuns.filter(run => run.status === 'failed' || (run.status === 'completed' && !run.evaluationResults?.overallPass)).length,
      recentRuns,
    };
  });

  return {
    projects,
    currentProject,
    currentTestCase,
    testCases,
    testRuns,
    isLoading,
    error,
    projectTree,
    currentProjectStats,
  };
}
