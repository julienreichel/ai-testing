<template>
  <div class="tests-content">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <base-spinner />
      <p>{{ $t("common.loading") }}...</p>
    </div>

    <!-- Error State -->
    <base-empty-state
      v-else-if="error"
      :title="$t('tests.unableToLoad')"
      :description="error"
      icon="❌"
      size="lg"
    >
      <template #action>
        <base-button variant="primary" @click="handleRetry">
          {{ $t("common.tryAgain") }}
        </base-button>
      </template>
    </base-empty-state>

    <!-- Empty State -->
    <base-empty-state
      v-else-if="projects.length === 0"
      :title="$t('tests.noProjectsYet')"
      :description="$t('tests.createFirstProject')"
      icon="📝"
      size="lg"
      :action-label="$t('testManagement.createProject')"
      @action="handleCreateProject"
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
            @click="projects.length > 1 ? toggleProject(project.id) : undefined"
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
                  <span class="stat">
                    {{ getProjectTestCases(project.id).length }}
                    {{ $t("testManagement.testCases") }}
                  </span>
                  <span class="stat">
                    {{ getProjectTotalRuns(project.id) }}
                    {{ $t("testManagement.runs") }}
                  </span>
                </div>
              </div>
            </div>
            <div class="project-actions" @click.stop>
              <base-button
                variant="primary"
                size="sm"
                @click="handleQuickRunProject(project)"
                class="quick-run-button"
              >
                {{ $t("quickRun.quickRun") }}
              </base-button>
              <base-button
                variant="danger"
                size="sm"
                @click="handleDeleteProject(project)"
              >
                {{ $t("testManagement.deleteProject") }}
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
            @click="handleSelectTestCase(testCase)"
          >
            <div class="test-case-compact">
              <!-- First line: Name, runs, and action button -->
              <div class="test-case-line-1">
                <div class="test-case-main-info">
                  <h4 class="test-case-name">{{ testCase.name }}</h4>
                  <span class="run-count">
                    {{ testCaseBatchRuns.get(testCase.id) || 0 }}
                    {{ $t("testManagement.runs") }}
                  </span>
                </div>
              </div>

              <!-- Second line: Prompt and rules inline -->
              <div class="test-case-line-2">
                <span class="test-case-prompt">{{
                  truncateText(testCase.prompt, 120)
                }}</span>
                <span v-if="testCase.rules?.length" class="test-case-rules">
                  {{ getTotalRulesCount(testCase.rules) }}
                  {{ $t("testManagement.rules") }}
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
          :title="$t('tests.noTestCasesYet')"
          :description="$t('tests.createTestCasesFromEditor')"
          icon="🧪"
          size="md"
          variant="subtle"
        />
      </base-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  BaseButton,
  BaseSpinner,
  BaseCard,
  BaseEmptyState,
} from "components/ui";
import type { Rule } from "types/rules";
import type { Project, TestCase } from "types/testManagement";

interface Props {
  projects: Project[];
  allTestCases: TestCase[];
  testCaseBatchRuns: Map<string, number>;
  isLoading: boolean;
  error: string | null;
}

interface Emits {
  (e: "selectTestCase", testCase: TestCase): void;
  (e: "deleteProject", project: Project): void;
  (e: "quickRunProject", project: Project): void;
  (e: "createProject"): void;
  (e: "retry"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Collapsible projects state
const expandedProjects = ref<Set<string>>(new Set());

// Helper functions
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
  return props.allTestCases.filter((tc) => tc.projectId === projectId);
};

const getProjectTotalRuns = (projectId: string): number => {
  const testCases = getProjectTestCases(projectId);
  return testCases.reduce((total: number, tc) => {
    const runCount = props.testCaseBatchRuns.get(tc.id) || 0;
    return total + runCount;
  }, 0);
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

// Initialize project expansion state
const initializeProjectExpansion = (): void => {
  // If there's only one project, expand it by default
  // If there are multiple projects, keep them all collapsed by default
  if (props.projects.length === 1 && props.projects[0]) {
    expandedProjects.value.add(props.projects[0].id);
  } else {
    expandedProjects.value.clear();
  }
};

// Watch for projects changes to reinitialize expansion
watch(
  () => props.projects,
  () => {
    initializeProjectExpansion();
  },
  { immediate: true },
);

// Event handlers
const handleSelectTestCase = (testCase: TestCase): void => {
  emit("selectTestCase", testCase);
};

const handleDeleteProject = (project: Project): void => {
  emit("deleteProject", project);
};

const handleQuickRunProject = (project: Project): void => {
  emit("quickRunProject", project);
};

const handleCreateProject = (): void => {
  emit("createProject");
};

const handleRetry = (): void => {
  emit("retry");
};

// Import watch from Vue
import { watch } from "vue";
</script>

<style scoped>
/* Projects list */
.tests-content {
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #6b7280;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  display: flex;
  gap: 0.5rem;
}

.quick-run-button {
  margin-right: 0.5rem;
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
</style>
