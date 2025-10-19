<template>
  <base-page-layout
    :title="project?.name ? $t('quickRun.projectTitle', { name: project.name }) : $t('quickRun.projectMultiSelect')"
    :description="project?.description || $t('quickRun.selectTestCasesToRun')"
    :breadcrumb-items="breadcrumbItems"
    :is-loading="isLoadingProject"
    :error="projectError"
    :not-found="!project && !isLoadingProject && !projectError"
    :not-found-message="$t('tests.projectNotFound')"
    :on-retry="loadProject"
    :on-back="goBackToTestsList"
  >
    <template #headerActions>
      <base-button variant="outline" @click="goBackToTestsList">
        {{ $t("quickRun.backToTests") }}
      </base-button>
    </template>

    <div class="project-quick-run-main">
      <!-- Test Case Selection Section -->
      <div class="test-selection-section">
        <div class="section-header">
          <h3>{{ $t("quickRun.selectTestCases") }}</h3>
          <div class="selection-actions">
            <base-button
              variant="outline"
              size="sm"
              :disabled="isRunning"
              @click="selectAllTests"
            >
              {{ $t("quickRun.selectAll") }}
            </base-button>
            <base-button
              variant="outline"
              size="sm"
              :disabled="isRunning"
              @click="clearSelection"
            >
              {{ $t("quickRun.clearAll") }}
            </base-button>
          </div>
        </div>

        <div class="test-cases-grid">
          <div
            v-for="testCase in testCases"
            :key="testCase.id"
            class="test-case-item"
            :class="{
              selected: isTestSelected(testCase.id),
              disabled: isRunning
            }"
            @click="toggleTestSelection(testCase.id)"
          >
            <div class="test-case-checkbox">
              <input
                type="checkbox"
                :checked="isTestSelected(testCase.id)"
                :disabled="isRunning"
                @change="toggleTestSelection(testCase.id)"
              />
            </div>
            <div class="test-case-info">
              <h4 class="test-case-name">{{ testCase.name }}</h4>
              <p class="test-case-description">{{ testCase.description }}</p>
              <div class="test-case-meta">
                <base-badge variant="info">
                  {{ $t("quickRun.rulesCount", { count: getTotalRulesCount(testCase.rules) }) }}
                </base-badge>
                <span class="test-case-date">
                  {{ $t("quickRun.updated") }}: {{ formatDate(testCase.updatedAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Configuration Section -->
      <div class="provider-config-section">
        <div class="section-header">
          <h3>{{ $t("quickRun.providerConfiguration") }}</h3>
        </div>

        <div class="provider-selector-wrapper">
          <provider-selector
            :model-value="{ providerId: providerConfig.providerId, model: providerConfig.model }"
            @update:model-value="updateProviderSelection"
          />
        </div>

        <provider-options
          :config="providerConfig"
          @update:config="updateProviderConfig"
        />
      </div>

      <!-- Run Configuration Section -->
      <div class="run-config-section">
        <div class="section-header">
          <h3>{{ $t("quickRun.runConfiguration") }}</h3>
        </div>

        <div class="run-config-form">
          <base-input-field
            v-model="runCount"
            type="number"
            :label="$t('quickRun.numberOfRuns')"
            :min="1"
            :max="50"
            :disabled="isRunning"
          />
        </div>

        <div class="selection-summary">
          <p>{{ $t("quickRun.selectedCount", { count: selectedTestIds.size }) }}</p>
          <p>{{ $t("quickRun.totalExecutions", { count: totalExecutions }) }}</p>
        </div>

        <div class="run-actions">
          <base-button
            v-if="!isRunning"
            variant="primary"
            size="lg"
            :disabled="!canRun"
            @click="runSelectedTests"
          >
            {{ $t("quickRun.runSelected", { count: selectedTestIds.size }) }}
          </base-button>
          <base-button
            v-else
            variant="danger"
            size="lg"
            @click="cancelRun"
          >
            {{ $t("quickRun.cancel") }}
          </base-button>
        </div>
      </div>

      <!-- Progress and Results Section -->
      <div v-if="isRunning || hasAnyResults" class="results-section">
        <div class="section-header">
          <h3>{{ $t("quickRun.progressAndResults") }}</h3>
          <div class="progress-summary">
            <base-badge variant="primary">
              {{ $t("quickRun.testsCompleted", { completed: completedTests, total: totalTests }) }}
            </base-badge>
          </div>
        </div>

        <div class="test-runners-grid">
          <div
            v-for="{ testId, runner } in activeBatchRunners"
            :key="testId"
            class="test-runner-card"
          >
            <div class="runner-header">
              <h4 class="runner-test-name">{{ getTestName(testId) }}</h4>
              <base-badge :variant="getTestStatusVariant(runner.state.isRunning, runner.state.results.length > 0)">
                {{ getTestStatusText(runner.state.isRunning, runner.state.results.length > 0) }}
              </base-badge>
            </div>

            <batch-progress-section
              :completed-runs="runner.state.completedRuns"
              :total-runs="runner.state.totalRuns"
              :progress-percentage="getRunnerProgress(runner.state)"
              :show-statistics="true"
              :statistics="runner.statistics"
              :show-results-preview="false"
            />
          </div>
        </div>
      </div>
    </div>
  </base-page-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  useBatchRunner,
  type BatchRunConfig,
  type BatchRunState,
  type BatchStatistics,
} from "@/composables/useBatchRunner";
import type { TestCase, Project } from "@/types/testManagement";
import type { Rule } from "@/types/rules";
import { useProvidersStore } from "@/store/providers";
import { testDB } from "@/services/testManagementDatabase";
import {
  BaseButton,
  BaseInputField,
  BaseBadge,
  BatchProgressSection,
  BasePageLayout,
} from "@/components/ui";
import { ProviderSelector } from "@/features/editor/components";
import { ProviderOptions } from "./components";
import type { ProviderSelection } from "@/features/editor/components/ProviderSelector.vue";

// Types - create a simplified interface for component usage
interface ComponentBatchRunner {
  state: BatchRunState;
  statistics: BatchStatistics;
  runBatch: (config: BatchRunConfig) => Promise<void>;
  cancelBatch: () => void;
  resetBatch: () => void;
}

interface BatchRunnerWithTest {
  testId: string;
  runner: ComponentBatchRunner;
}

interface ProjectProviderConfig {
  id: string;
  providerId: string;
  model: string;
  maxTokens: number;
  temperature: number;
  allowParallel: boolean;
  parallelConcurrency: number;
}

// Composables
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const providersStore = useProvidersStore();

// State for project and test cases loading
const project = ref<Project | null>(null);
const testCases = ref<TestCase[]>([]);
const isLoadingProject = ref(false);
const projectError = ref<string | null>(null);

// Multi-select batch run state
const DEFAULT_RUNS = 5;
const runCount = ref(DEFAULT_RUNS);
const selectedTestIds = ref<Set<string>>(new Set());
const isRunning = ref(false);
const isCancelled = ref(false);

// Provider configuration
const providerConfig = ref<ProjectProviderConfig>({
  id: 'project-provider',
  providerId: '',
  model: '',
  maxTokens: 2048,
  temperature: 0.7,
  allowParallel: false,
  parallelConcurrency: 1,
});

// Active batch runners
const activeBatchRunners = ref<Array<BatchRunnerWithTest>>([]);

// Pre-create batch runners pool to avoid dynamic composable calls
const batchRunnerPool = ref<Map<string, ComponentBatchRunner>>(new Map());
const BATCH_RUNNER_POOL_SIZE = 10;

// Initialize batch runner pool
for (let i = 0; i < BATCH_RUNNER_POOL_SIZE; i++) {
  const batchRunner = useBatchRunner();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batchRunnerPool.value.set(`pool-${i}`, batchRunner as any);
}

// Computed
const projectId = computed(() => route.params.projectId as string);

const breadcrumbItems = computed(() => [
  {
    label: t("tests.title"),
    action: goBackToTestsList,
  },
  {
    label: project.value?.name || "",
    action: goBackToTestsList,
  },
  {
    label: t("quickRun.multiSelect"),
  },
]);

const canRun = computed(() => {
  return (
    !isRunning.value &&
    selectedTestIds.value.size > 0 &&
    providerConfig.value.providerId &&
    providerConfig.value.model &&
    runCount.value > 0
  );
});

const totalExecutions = computed(() => {
  return selectedTestIds.value.size * runCount.value;
});

const hasAnyResults = computed(() => {
  return activeBatchRunners.value.some(runner =>
    runner.runner.state.results.length > 0
  );
});

const completedTests = computed(() => {
  return activeBatchRunners.value.filter(runner =>
    !runner.runner.state.isRunning && runner.runner.state.results.length > 0
  ).length;
});

const totalTests = computed(() => {
  return selectedTestIds.value.size;
});

// Navigation
const goBackToTestsList = (): void => {
  void router.push("/tests");
};

// Test case selection
const isTestSelected = (testId: string): boolean => {
  return selectedTestIds.value.has(testId);
};

const toggleTestSelection = (testId: string): void => {
  if (isRunning.value) return;

  if (selectedTestIds.value.has(testId)) {
    selectedTestIds.value.delete(testId);
  } else {
    selectedTestIds.value.add(testId);
  }
};

const selectAllTests = (): void => {
  if (isRunning.value) return;
  testCases.value.forEach(test => selectedTestIds.value.add(test.id));
};

const clearSelection = (): void => {
  if (isRunning.value) return;
  selectedTestIds.value.clear();
};

// Provider configuration
const updateProviderSelection = (selection: ProviderSelection): void => {
  providerConfig.value.providerId = selection.providerId;
  providerConfig.value.model = selection.model;
};

const updateProviderConfig = (field: keyof ProjectProviderConfig, value: unknown): void => {
  (providerConfig.value as Record<string, unknown>)[field] = value;
};

// Batch run execution
const runSelectedTests = async (): Promise<void> => {
  if (!canRun.value) return;

  isRunning.value = true;
  isCancelled.value = false;
  activeBatchRunners.value = [];

  try {
    const selectedTests = testCases.value.filter(test =>
      selectedTestIds.value.has(test.id)
    );

    // Create batch runners for each selected test
    const runnerPromises: Promise<void>[] = [];

    for (const [index, testCase] of selectedTests.entries()) {
      // Get runner from pre-created pool
      const poolKey = `pool-${index % BATCH_RUNNER_POOL_SIZE}`;
      const runner = batchRunnerPool.value.get(poolKey);

      if (!runner) {
        console.error(`No batch runner available for pool key: ${poolKey}`);
        continue;
      }

      // Reset runner state before use
      runner.resetBatch();

      // Track active runner
      activeBatchRunners.value.push({
        testId: testCase.id,
        runner,
      });      // Configure batch run
      const batchConfig: BatchRunConfig = {
        testCase,
        providerId: providerConfig.value.providerId,
        model: providerConfig.value.model,
        runCount: runCount.value,
        maxTokens: providerConfig.value.maxTokens,
        allowParallel: false, // Individual tests run sequentially, but tests run in parallel
        parallelConcurrency: 1,
        maxRetries: 2,
        delayMs: 1000,
      };

      // Start batch run
      const promise = runner.runBatch(batchConfig);
      runnerPromises.push(promise);
    }

    // Wait for all test batches to complete in parallel
    await Promise.all(runnerPromises);

    if (!isCancelled.value) {
      console.log("All project test batches completed successfully");
    }
  } catch (error) {
    if (!isCancelled.value) {
      console.error("Project batch run execution failed:", error);
    }
  } finally {
    isRunning.value = false;
  }
};

const cancelRun = (): void => {
  isCancelled.value = true;

  // Cancel all active runners
  activeBatchRunners.value.forEach(({ runner }) => {
    if (runner.state.isRunning) {
      runner.cancelBatch();
    }
  });

  isRunning.value = false;
};

// Helper functions
const getTotalRulesCount = (rules: { rules?: Rule[] }[]): number => {
  return rules.reduce((total: number, ruleSet: { rules?: Rule[] }) => {
    return total + (ruleSet.rules?.length || 0);
  }, 0);
};

const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString();
  }
  return date.toLocaleDateString();
};

const getTestName = (testId: string): string => {
  const test = testCases.value.find(t => t.id === testId);
  return test?.name || testId;
};

const getTestStatusVariant = (isRunning: boolean, hasResults: boolean): "primary" | "danger" | "success" | "warning" | "info" | "light" | "dark" => {
  if (isRunning) return "warning";
  if (hasResults) return "success";
  return "info";
};

const getTestStatusText = (isRunning: boolean, hasResults: boolean): string => {
  if (isRunning) return t("quickRun.status.running");
  if (hasResults) return t("quickRun.status.completed");
  return t("quickRun.status.pending");
};

const PERCENTAGE_MULTIPLIER = 100;

const getRunnerProgress = (state: BatchRunState): number => {
  const { completedRuns, totalRuns } = state;
  return totalRuns > 0 ? Math.round((completedRuns / totalRuns) * PERCENTAGE_MULTIPLIER) : 0;
};

// Data loading
const loadProject = async (): Promise<void> => {
  if (!projectId.value) return;

  isLoadingProject.value = true;
  projectError.value = null;

  try {
    // Load project
    const loadedProject = await testDB.getProject(projectId.value);
    if (loadedProject) {
      project.value = loadedProject;

      // Load test cases for this project
      const projectTestCases = await testDB.getTestCasesByProject(projectId.value, {
        sortBy: "name",
        sortOrder: "asc",
      });
      testCases.value = projectTestCases;
    } else {
      project.value = null;
      testCases.value = [];
      projectError.value = t("tests.projectNotFound");
    }
  } catch (err) {
    console.error("Failed to load project:", err);
    projectError.value = err instanceof Error ? err.message : t("tests.failedToLoadProject");
    project.value = null;
    testCases.value = [];
  } finally {
    isLoadingProject.value = false;
  }
};

// Initialize default provider
const initializeDefaultProvider = (): void => {
  providersStore.initialize();
};

// Watch for route changes
watch(
  () => route.params.projectId,
  () => {
    if (route.params.projectId) {
      void loadProject();
    }
  },
  { immediate: true }
);

// Initialize on mount
onMounted(async () => {
  await loadProject();
  initializeDefaultProvider();
});

// Cleanup on unmount
onUnmounted(() => {
  if (isRunning.value) {
    cancelRun();
  }
});
</script>

<style scoped>
.project-quick-run-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

/* Test Selection Section */
.test-selection-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
}

.test-cases-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.test-case-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.test-case-item:hover {
  border-color: var(--color-primary);
  background: var(--color-background-soft);
}

.test-case-item.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.test-case-item.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.test-case-checkbox input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
}

.test-case-info {
  flex: 1;
  min-width: 0;
}

.test-case-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--color-text);
}

.test-case-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.test-case-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.selection-summary {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  font-weight: 500;
  color: var(--color-text);
}

.selection-summary p {
  margin: 0.25rem 0;
}

/* Provider Configuration Section */
.provider-config-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.provider-selector-wrapper {
  margin-bottom: 1.5rem;
}

/* Run Configuration Section */
.run-config-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.run-config-form {
  margin-bottom: 1.5rem;
}

.run-actions {
  display: flex;
  justify-content: center;
}

/* Results Section */
.results-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.progress-summary {
  display: flex;
  gap: 0.5rem;
}

.test-runners-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
}

.test-runner-card {
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 1rem;
  background: var(--color-background-soft);
}

.runner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.runner-test-name {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runner-results {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.results-summary {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.latest-results {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.result-duration {
  color: var(--color-text-muted);
}

/* Responsive Design */
@media (max-width: 768px) {
  .project-quick-run-main {
    gap: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .selection-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .test-case-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .test-runners-grid {
    grid-template-columns: 1fr;
  }
}
</style>
