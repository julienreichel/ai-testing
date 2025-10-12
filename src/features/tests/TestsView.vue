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
            <div class="project-header">
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
              <div class="project-actions">
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
            v-if="getProjectTestCases(project.id).length > 0"
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
                      >{{ testCase.metadata?.runCount || 0 }} runs</span
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
            v-else
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
    <base-dialog
      v-model="showCreateProject"
      title="Create New Project"
      size="md"
    >
      <div class="create-project-form">
        <div class="form-group">
          <label for="projectName">Project Name *</label>
          <base-input-field
            id="projectName"
            v-model="newProjectName"
            placeholder="Enter project name"
            required
          />
        </div>
        <div class="form-group">
          <label for="projectDescription">Description</label>
          <base-input-field
            id="projectDescription"
            v-model="newProjectDescription"
            placeholder="Enter project description (optional)"
            type="textarea"
            :rows="3"
          />
        </div>
        <div class="dialog-actions">
          <base-button
            variant="primary"
            :disabled="!newProjectName.trim() || isCreatingProject"
            :loading="isCreatingProject"
            @click="createProject"
          >
            Create Project
          </base-button>
          <base-button variant="outline" @click="cancelCreateProject">
            Cancel
          </base-button>
        </div>
      </div>
    </base-dialog>

    <!-- Delete Confirmation Dialog -->
    <!-- Delete Project Dialog -->
    <base-dialog
      v-model="showDeleteProjectDialog"
      title="Delete Project"
      class="delete-dialog"
    >
      <div>
        <p v-if="projectToDelete">
          Are you sure you want to delete "<strong>{{
            projectToDelete.name
          }}</strong
          >"? This will also delete all test cases in this project.
        </p>

        <div class="dialog-actions">
          <base-button
            variant="outline"
            @click="cancelDelete"
            :disabled="isDeleting"
          >
            Cancel
          </base-button>
          <base-button
            variant="danger"
            @click="performDelete"
            :loading="isDeleting"
          >
            Delete Project
          </base-button>
        </div>
      </div>
    </base-dialog>

    <!-- Delete Test Case Dialog -->
    <base-dialog
      v-model="showDeleteTestCaseDialog"
      title="Delete Test Case"
      class="delete-dialog"
    >
      <div>
        <p v-if="testCaseToDelete">
          Are you sure you want to delete "<strong>{{
            testCaseToDelete.name
          }}</strong
          >"? This action cannot be undone.
        </p>

        <div class="dialog-actions">
          <base-button
            variant="outline"
            @click="cancelDelete"
            :disabled="isDeleting"
          >
            Cancel
          </base-button>
          <base-button
            variant="danger"
            @click="performDelete"
            :loading="isDeleting"
          >
            Delete Test Case
          </base-button>
        </div>
      </div>
    </base-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestManagement } from "../../composables/useTestManagement";
import { testDB } from "../../services/testManagementDatabase";
import {
  BaseButton,
  BaseInputField,
  BaseDialog,
  BaseSpinner,
  BaseCard,
  BaseEmptyState,
} from "../../components/ui";
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

// Create project form
const newProjectName = ref("");
const newProjectDescription = ref("");
const isCreatingProject = ref(false);
const isDeleting = ref(false);

// Test management state
const { projects, isLoading, error } = testManager;

// Local state for all test cases (since testManager.testCases only has current project's test cases)
const allTestCases = ref<TestCase[]>([]);

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
    const runCount =
      tc.metadata &&
      typeof tc.metadata === "object" &&
      "runCount" in tc.metadata
        ? (tc.metadata as { runCount?: number }).runCount || 0
        : 0;
    return total + runCount;
  }, 0);
};

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

// Project management
const createProject = async (): Promise<void> => {
  if (!newProjectName.value.trim()) return;

  try {
    isCreatingProject.value = true;
    await testManager.createProject({
      name: newProjectName.value.trim(),
      description: newProjectDescription.value.trim() || undefined,
    });

    // Reset form and close dialog
    cancelCreateProject();
  } catch (err) {
    console.error("Failed to create project:", err);
  } finally {
    isCreatingProject.value = false;
  }
};

const cancelCreateProject = (): void => {
  showCreateProject.value = false;
  newProjectName.value = "";
  newProjectDescription.value = "";
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

const performDelete = async (): Promise<void> => {
  isDeleting.value = true;
  try {
    if (projectToDelete.value) {
      await testManager.deleteProject(projectToDelete.value.id);
      projectToDelete.value = null;
      showDeleteProjectDialog.value = false;
    } else if (testCaseToDelete.value) {
      await testManager.deleteTestCase(testCaseToDelete.value.id);
      // Clear selected test case if it was deleted
      if (selectedTestCase.value?.id === testCaseToDelete.value.id) {
        selectedTestCase.value = null;
      }
      testCaseToDelete.value = null;
      showDeleteTestCaseDialog.value = false;
    }
  } catch (error) {
    console.error("Failed to delete item:", error);
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = (): void => {
  showDeleteProjectDialog.value = false;
  showDeleteTestCaseDialog.value = false;
  projectToDelete.value = null;
  testCaseToDelete.value = null;
};

// Load all test cases from all projects
const loadAllTestCases = async (): Promise<void> => {
  const allCases: TestCase[] = [];

  console.log(`Loading test cases for ${projects.value.length} projects...`);

  // Load test cases for each project
  for (const project of projects.value) {
    try {
      // Access the database directly to get test cases for each project
      const projectTestCases = await testDB.getTestCasesByProject(project.id, {
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      console.log(
        `Loaded ${projectTestCases.length} test cases for project "${project.name}"`,
      );
      allCases.push(...projectTestCases);
    } catch (err) {
      console.error(
        `Failed to load test cases for project ${project.id}:`,
        err,
      );
    }
  }

  console.log(`Total test cases loaded: ${allCases.length}`);
  allTestCases.value = allCases;
};

// Data loading
const loadData = async (): Promise<void> => {
  try {
    await testManager.loadProjects();
    await loadAllTestCases();
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
}

.project-info h3 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.5rem;
  font-weight: 600;
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

/* Form styles */
.create-project-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
