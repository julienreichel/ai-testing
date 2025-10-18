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
    <div v-if="selectedTestCase" class="test-case-detail">
      <div class="detail-header">
        <div class="breadcrumb">
          <base-button
            variant="outline"
            @click="selectedTestCase = null"
            class="breadcrumb-link"
          >
            ← Back to Tests
          </base-button>
        </div>
      </div>

      <base-card variant="outlined" padding="lg" class="test-case-detail-card">
        <template #header>
          <div class="detail-title">
            <h2>{{ selectedTestCase.name }}</h2>
            <div class="detail-actions">
              <base-button variant="outline" @click="openTestCaseInEditor()">
                Open in Editor
              </base-button>
              <base-button variant="danger" @click="confirmDeleteTestCase">
                Delete
              </base-button>
            </div>
          </div>
          <p v-if="selectedTestCase.description">
            {{ selectedTestCase.description }}
          </p>
        </template>

        <div class="test-case-content">
          <base-card variant="default" padding="md" class="content-section">
            <template #header>
              <h3>Prompt</h3>
            </template>
            <div class="prompt-display">{{ selectedTestCase.prompt }}</div>
          </base-card>

          <base-card
            v-if="selectedTestCase.rules?.length"
            variant="default"
            padding="md"
            class="content-section"
          >
            <template #header>
              <h3>Validation Rules</h3>
            </template>
            <div class="rules-display">
              <div
                v-for="(ruleSet, index) in selectedTestCase.rules"
                :key="index"
                class="rule-set"
              >
                <h4>Rule Set {{ index + 1 }}</h4>
                <div class="rules-list">
                  <div
                    v-for="rule in ruleSet.rules"
                    :key="rule.id"
                    class="rule-item"
                  >
                    <span class="rule-type">{{ rule.type }}</span>
                    <span class="rule-details">
                      {{ formatRuleDetails(rule) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </base-card>
        </div>
      </base-card>
    </div>

    <!-- Projects and Test Cases List -->
    <div v-else class="tests-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <base-spinner />
        <p>Loading tests...</p>
      </div>

      <!-- Error State -->
      <base-empty-state
        v-else-if="error"
        title="Unable to Load Tests"
        :description="error"
        icon="❌"
        size="lg"
      >
        <template #action>
          <base-button variant="primary" @click="loadData">
            Try Again
          </base-button>
        </template>
      </base-empty-state>

      <!-- Empty State -->
      <base-empty-state
        v-else-if="projects.length === 0"
        title="No Projects Yet"
        description="Create your first project to start organizing your test cases."
        icon="📝"
        size="lg"
        action-label="Create Your First Project"
        @action="showCreateProject = true"
      />

      <!-- Projects List -->
      <div v-else class="projects-list">
        <base-card
          v-for="project in projects"
          :key="project.id"
          variant="outlined"
          padding="lg"
          class="project-card"
        >
          <template #header>
            <div
              class="project-header"
              :class="{ clickable: projects.length > 1 }"
              @click="
                projects.length > 1 ? toggleProject(project.id) : undefined
              "
            >
              <div class="project-main">
                <div class="project-toggle" v-if="projects.length > 1">
                  <span
                    class="chevron"
                    :class="{ expanded: isProjectExpanded(project.id) }"
                  >
                    ▶
                  </span>
                </div>
                <div class="project-info">
                  <h3>{{ project.name }}</h3>
                  <p v-if="project.description">{{ project.description }}</p>
                  <div class="project-stats">
                    <span class="stat"
                      >{{ getProjectTestCases(project.id).length }} test
                      cases</span
                    >
                    <span class="stat"
                      >{{ getProjectTotalRuns(project.id) }} runs</span
                    >
                  </div>
                </div>
              </div>
              <div class="project-actions" @click.stop>
                <base-button
                  variant="danger"
                  size="sm"
                  @click="confirmDeleteProject(project)"
                >
                  Delete Project
                </base-button>
              </div>
            </div>
          </template>

          <!-- Test Cases in Project -->
          <div
            v-if="
              getProjectTestCases(project.id).length > 0 &&
              (projects.length === 1 || isProjectExpanded(project.id))
            "
            class="test-cases-grid"
          >
            <base-card
              v-for="testCase in getProjectTestCases(project.id)"
              :key="testCase.id"
              variant="default"
              hover
              clickable
              padding="sm"
              class="test-case-card compact"
              @click="selectTestCase(testCase)"
            >
              <div class="test-case-compact">
                <!-- First line: Name, runs, and action button -->
                <div class="test-case-line-1">
                  <div class="test-case-main-info">
                    <h4 class="test-case-name">{{ testCase.name }}</h4>
                    <span class="run-count"
                      >{{ testCaseBatchRuns.get(testCase.id) || 0 }} runs</span
                    >
                  </div>
                </div>

                <!-- Second line: Prompt and rules inline -->
                <div class="test-case-line-2">
                  <span class="test-case-prompt">{{
                    truncateText(testCase.prompt, 120)
                  }}</span>
                  <span v-if="testCase.rules?.length" class="test-case-rules">
                    {{ getTotalRulesCount(testCase.rules) }} rules
                  </span>
                </div>
              </div>
            </base-card>
          </div>
          <!-- Empty Project State -->
          <base-empty-state
            v-if="
              getProjectTestCases(project.id).length === 0 &&
              (projects.length === 1 || isProjectExpanded(project.id))
            "
            title="No Test Cases Yet"
            description="Create test cases by saving prompts from the Editor."
            icon="🧪"
            size="md"
            variant="subtle"
          />
        </base-card>
      </div>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestManagement } from "../../composables/useTestManagement";
import { testDB } from "../../services/testManagementDatabase";
import {
  BaseButton,
  BaseSpinner,
  BaseCard,
  BaseEmptyState,
} from "../../components/ui";
import { 
  TestExportImport,
  CreateProjectDialog,
  DeleteProjectDialog,
  DeleteTestCaseDialog,
} from "./components";
import type { Rule } from "../../types/rules";
import type { Project, TestCase } from "../../types/testManagement";

// Composables
const router = useRouter();
const testManager = useTestManagement();

// State
const selectedTestCase = ref<TestCase | null>(null);
const showCreateProject = ref(false);
const showDeleteProjectDialog = ref(false);
const showDeleteTestCaseDialog = ref(false);
const projectToDelete = ref<Project | null>(null);
const testCaseToDelete = ref<TestCase | null>(null);

// Component refs for controlling dialog state
const createProjectDialogRef = ref<InstanceType<typeof CreateProjectDialog>>();
const deleteProjectDialogRef = ref<InstanceType<typeof DeleteProjectDialog>>();
const deleteTestCaseDialogRef = ref<InstanceType<typeof DeleteTestCaseDialog>>();

// Test management state
const { projects, isLoading, error } = testManager;

// Local state for all test cases (since testManager.testCases only has current project's test cases)
const allTestCases = ref<TestCase[]>([]);

// Batch runs data for calculating actual run counts
const testCaseBatchRuns = ref<Map<string, number>>(new Map());

// Collapsible projects state
const expandedProjects = ref<Set<string>>(new Set());

// Helper functions
const formatRuleDetails = (rule: Rule): string => {
  switch (rule.type) {
    case "equals":
    case "contains":
    case "startsWith":
    case "endsWith":
      return `${rule.type} "${rule.value}"`;
    case "regex":
      return `matches /${rule.pattern}/${rule.flags || ""}`;
    case "length": {
      const min = rule.min ? `≥ ${rule.min}` : "";
      const max = rule.max ? `≤ ${rule.max}` : "";
      return `length ${min} ${max}`.trim();
    }
    default:
      return JSON.stringify(rule);
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const getTotalRulesCount = (ruleSets: { rules?: Rule[] }[]): number => {
  return ruleSets.reduce((total: number, ruleSet: { rules?: Rule[] }) => {
    return total + (ruleSet.rules?.length || 0);
  }, 0);
};

// Project and test case management
const getProjectTestCases = (projectId: string): TestCase[] => {
  // Get test cases from our local allTestCases array for this project
  return allTestCases.value.filter((tc) => tc.projectId === projectId);
};

const getProjectTotalRuns = (projectId: string): number => {
  const testCases = getProjectTestCases(projectId);
  return testCases.reduce((total: number, tc) => {
    const runCount = testCaseBatchRuns.value.get(tc.id) || 0;
    return total + runCount;
  }, 0);
};

const selectTestCase = (testCase: TestCase): void => {
  selectedTestCase.value = testCase;
};

// Project collapse/expand functions
const isProjectExpanded = (projectId: string): boolean => {
  return expandedProjects.value.has(projectId);
};

const toggleProject = (projectId: string): void => {
  if (expandedProjects.value.has(projectId)) {
    expandedProjects.value.delete(projectId);
  } else {
    expandedProjects.value.add(projectId);
  }
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

// Project management
const handleCreateProject = async (data: { name: string; description?: string }): Promise<void> => {
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

const confirmDeleteTestCase = (): void => {
  if (selectedTestCase.value) {
    testCaseToDelete.value = selectedTestCase.value;
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

// Initialize project expansion state
const initializeProjectExpansion = (): void => {
  // If there's only one project, expand it by default
  // If there are multiple projects, keep them all collapsed by default
  if (projects.value.length === 1 && projects.value[0]) {
    expandedProjects.value.add(projects.value[0].id);
  } else {
    expandedProjects.value.clear();
  }
};

// Data loading
const loadData = async (): Promise<void> => {
  try {
    await testManager.initialize();
    await testManager.loadProjects();
    await loadAllTestCases();
    await loadBatchRunCounts();
    initializeProjectExpansion();
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

/* Test case detail view */
.test-case-detail {
  margin-bottom: 2rem;
}

.detail-header {
  margin-bottom: 1.5rem;
}

.breadcrumb-link {
  margin-bottom: 1rem;
}

.detail-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.detail-title h2 {
  margin: 0;
  color: #111827;
  font-size: 1.75rem;
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.test-case-content {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 1.5rem;
}

/* Projects list */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-card {
  margin-bottom: 0;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  transition: background-color 0.2s ease;
}

.project-header.clickable {
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin: -0.5rem;
}

.project-header.clickable:hover {
  background-color: #f9fafb;
}

.project-main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.project-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin-top: 0.125rem;
}

.chevron {
  display: inline-block;
  font-size: 0.75rem;
  color: #6b7280;
  transition: transform 0.2s ease;
  transform: rotate(0deg);
}

.chevron.expanded {
  transform: rotate(90deg);
}

.project-info h3 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: left;
}

.project-info p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.project-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  color: #6b7280;
  font-size: 0.875rem;
}

.project-actions {
  flex-shrink: 0;
}

/* Test cases grid */
.test-cases-grid {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Compact test case card */
.test-case-card.compact {
  margin-bottom: 0;
}

.test-case-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.test-case-line-1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.test-case-main-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.test-case-name {
  margin: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
}

.run-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.test-case-action {
  flex-shrink: 0;
}

.test-case-line-2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.3;
}

.test-case-prompt {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.test-case-rules {
  color: #059669;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Test case detail content */
.content-section {
  margin-bottom: 1.5rem;
}

.content-section h3 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.prompt-display {
  width: 100%;
  text-align: left;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.875rem;
  color: #374151;
  white-space: pre-wrap;
  line-height: 1.5;
}

.rules-display {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rule-set {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
}

.rule-set h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.875rem;
}

.rule-type {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.rule-details {
  color: #374151;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}


</style>
