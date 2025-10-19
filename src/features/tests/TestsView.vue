<template>
  <div class="tests-view">
    <!-- Header with Actions -->
    <div class="tests-header">
      <div class="header-content">
        <div class="title-section">
          <h1>{{ $t("tests.title") }}</h1>
          <p>{{ $t("tests.description") }}</p>
        </div>
        <div class="header-actions">
          <test-export-import />
          <base-button variant="outline" @click="openEditor">
            + {{ $t("testManagement.addTestCase") }}
          </base-button>
          <base-button variant="primary" @click="showCreateProject = true">
            + {{ $t("testManagement.createProject") }}
          </base-button>
        </div>
      </div>
    </div>

    <!-- Test Case Detail View -->
    <test-case-detail-view
      v-if="selectedTestCase"
      :test-case="selectedTestCase"
      @back="selectedTestCase = null"
      @quick-run="handleQuickRun"
      @open-in-editor="openTestCaseInEditor"
      @delete="confirmDeleteTestCase"
    />

    <!-- Projects and Test Cases List -->
    <projects-test-cases-list
      v-else
      :projects="projects"
      :all-test-cases="allTestCases"
      :test-case-batch-runs="testCaseBatchRuns"
      :is-loading="isLoading"
      :error="error"
      @select-test-case="selectTestCase"
      @delete-project="confirmDeleteProject"
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

    <delete-test-case-dialog
      ref="deleteTestCaseDialogRef"
      v-model="showDeleteTestCaseDialog"
      :test-case="testCaseToDelete"
      @delete="handleDeleteTestCase"
    />

    <!-- Quick Run Dialog -->
    <quick-run-dialog
      :is-open="showRunQuick"
      :test-case="testCaseForQuickRun"
      @close="showRunQuick = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestManagement } from "../../composables/useTestManagement";
import { testDB } from "services/testManagementDatabase";
import { BaseButton } from "components/ui";
import {
  TestExportImport,
  CreateProjectDialog,
  DeleteProjectDialog,
  DeleteTestCaseDialog,
  TestCaseDetailView,
  ProjectsTestCasesList,
  QuickRunDialog,
} from "./components";
import type { Project, TestCase } from "types/testManagement";

// Composables
const router = useRouter();
const testManager = useTestManagement();

// State
const selectedTestCase = ref<TestCase | null>(null);
const showCreateProject = ref(false);
const showDeleteProjectDialog = ref(false);
const showDeleteTestCaseDialog = ref(false);
const showRunQuick = ref(false);
const testCaseForQuickRun = ref<TestCase | null>(null);
const projectToDelete = ref<Project | null>(null);
const testCaseToDelete = ref<TestCase | null>(null);

// Component refs for controlling dialog state
const createProjectDialogRef = ref<InstanceType<typeof CreateProjectDialog>>();
const deleteProjectDialogRef = ref<InstanceType<typeof DeleteProjectDialog>>();
const deleteTestCaseDialogRef =
  ref<InstanceType<typeof DeleteTestCaseDialog>>();

// Test management state
const { projects, isLoading, error } = testManager;

// Local state for all test cases (since testManager.testCases only has current project's test cases)
const allTestCases = ref<TestCase[]>([]);

// Batch runs data for calculating actual run counts
const testCaseBatchRuns = ref<Map<string, number>>(new Map());

// Project and test case management
const selectTestCase = (testCase: TestCase): void => {
  selectedTestCase.value = testCase;
};

// Navigation functions
const openEditor = (): void => {
  void router.push("/editor");
};

const openTestCaseInEditor = (testCase?: TestCase): void => {
  const targetTestCase = testCase || selectedTestCase.value;
  if (!targetTestCase) return;

  // Navigate to editor with only test case ID for prefilling
  void router.push({
    path: "/editor",
    query: {
      testCaseId: targetTestCase.id,
    },
  });
};

const handleQuickRun = (testCase: TestCase): void => {
  testCaseForQuickRun.value = testCase;
  showRunQuick.value = true;
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

const confirmDeleteTestCase = (testCase?: TestCase): void => {
  const targetTestCase = testCase || selectedTestCase.value;
  if (targetTestCase) {
    testCaseToDelete.value = targetTestCase;
    showDeleteTestCaseDialog.value = true;
  }
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

const handleDeleteTestCase = async (testCase: TestCase): Promise<void> => {
  try {
    deleteTestCaseDialogRef.value?.setLoading(true);
    await testManager.deleteTestCase(testCase.id);

    // Clear selected test case if it was deleted
    if (selectedTestCase.value?.id === testCase.id) {
      selectedTestCase.value = null;
    }

    deleteTestCaseDialogRef.value?.closeDialog();
    testCaseToDelete.value = null;
  } catch (error) {
    console.error("Failed to delete test case:", error);
  } finally {
    deleteTestCaseDialogRef.value?.setLoading(false);
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
/* Main layout */
.tests-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.tests-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.title-section h1 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 2rem;
  font-weight: 600;
}

.title-section p {
  margin: 0;
  color: #6b7280;
  font-size: 1.125rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}
</style>
