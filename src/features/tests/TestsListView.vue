<template>
  <base-page-layout
    :title="$t('tests.title')"
    :description="$t('tests.description')"
    :is-loading="isLoading"
    :error="error"
    :on-retry="loadData"
  >
    <template #headerActions>
      <test-export-import />
      <base-button variant="outline" @click="openEditor">
        + {{ $t("testManagement.addTestCase") }}
      </base-button>
      <base-button variant="primary" @click="showCreateProject = true">
        + {{ $t("testManagement.createProject") }}
      </base-button>
    </template>

    <!-- Projects and Test Cases List -->
    <projects-test-cases-list
      :projects="projects"
      :all-test-cases="allTestCases"
      :test-case-batch-runs="testCaseBatchRuns"
      :is-loading="isLoading"
      :error="error"
      @select-test-case="selectTestCase"
      @delete-project="confirmDeleteProject"
      @quick-run-project="navigateToProjectQuickRun"
      @create-project="showCreateProject = true"
      @retry="loadData"
    />

    <!-- Create Project Dialog -->
    <create-project-dialog
      ref="createProjectDialogRef"
      v-model="showCreateProject"
      @create="handleCreateProject"
    />

    <!-- Delete Dialogs -->
    <delete-project-dialog
      ref="deleteProjectDialogRef"
      v-model="showDeleteProjectDialog"
      :project="projectToDelete"
      @delete="handleDeleteProject"
    />
  </base-page-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestManagement } from "@/composables/useTestManagement";
import { testDB } from "@/services/testManagementDatabase";
import { BaseButton, BasePageLayout } from "@/components/ui";
import {
  TestExportImport,
  CreateProjectDialog,
  DeleteProjectDialog,
  ProjectsTestCasesList,
} from "./components";
import type { Project, TestCase } from "@/types/testManagement";

// Composables
const router = useRouter();
const testManager = useTestManagement();

// State
const showCreateProject = ref(false);
const showDeleteProjectDialog = ref(false);
const projectToDelete = ref<Project | null>(null);

// Component refs for controlling dialog state
const createProjectDialogRef = ref<InstanceType<typeof CreateProjectDialog>>();
const deleteProjectDialogRef = ref<InstanceType<typeof DeleteProjectDialog>>();

// Test management state
const { projects, isLoading, error } = testManager;

// Local state for all test cases (since testManager.testCases only has current project's test cases)
const allTestCases = ref<TestCase[]>([]);

// Batch runs data for calculating actual run counts
const testCaseBatchRuns = ref<Map<string, number>>(new Map());

// Navigation functions
const selectTestCase = (testCase: TestCase): void => {
  // Navigate to the test details view
  void router.push(`/tests/${testCase.id}`);
};

const navigateToProjectQuickRun = (project: Project): void => {
  // Navigate to the project quick run view
  void router.push(`/tests/project/${project.id}/run`);
};

const openEditor = (): void => {
  void router.push("/editor");
};

// Project management
const handleCreateProject = async (data: {
  name: string;
  description?: string;
}): Promise<void> => {
  try {
    createProjectDialogRef.value?.setLoading(true);
    await testManager.createProject(data);
    createProjectDialogRef.value?.closeDialog();
  } catch (err) {
    console.error("Failed to create project:", err);
  } finally {
    createProjectDialogRef.value?.setLoading(false);
  }
};

// Delete operations
const confirmDeleteProject = (project: Project): void => {
  projectToDelete.value = project;
  showDeleteProjectDialog.value = true;
};

const handleDeleteProject = async (project: Project): Promise<void> => {
  try {
    deleteProjectDialogRef.value?.setLoading(true);
    await testManager.deleteProject(project.id);
    deleteProjectDialogRef.value?.closeDialog();
    projectToDelete.value = null;
  } catch (error) {
    console.error("Failed to delete project:", error);
  } finally {
    deleteProjectDialogRef.value?.setLoading(false);
  }
};

// Load all test cases from all projects
const loadAllTestCases = async (): Promise<void> => {
  const allCases: TestCase[] = [];

  // Load test cases for each project
  for (const project of projects.value) {
    try {
      // Access the database directly to get test cases for each project
      const projectTestCases = await testDB.getTestCasesByProject(project.id, {
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      allCases.push(...projectTestCases);
    } catch (err) {
      console.error(
        `Failed to load test cases for project ${project.id}:`,
        err,
      );
    }
  }

  allTestCases.value = allCases;
};

// Load batch run counts for all test cases
const loadBatchRunCounts = async (): Promise<void> => {
  const counts = new Map<string, number>();

  for (const testCase of allTestCases.value) {
    try {
      const batchRuns = await testDB.getBatchRunsByTestCase(testCase.id);
      // Calculate total runs from all batch runs for this test case
      const totalRuns = batchRuns.reduce((total, batchRun) => {
        return total + (batchRun.results?.length || 0);
      }, 0);
      counts.set(testCase.id, totalRuns);
    } catch (err) {
      console.error(
        `Failed to load batch runs for test case ${testCase.id}:`,
        err,
      );
      counts.set(testCase.id, 0);
    }
  }

  testCaseBatchRuns.value = counts;
};

// Data loading
const loadData = async (): Promise<void> => {
  try {
    await testManager.initialize();
    await testManager.loadProjects();
    await loadAllTestCases();
    await loadBatchRunCounts();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
};

// Initialize on mount
onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
/* Any custom styles for TestsListView content */
</style>
