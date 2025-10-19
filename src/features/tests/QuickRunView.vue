<template>
  <base-page-layout
    :title="testCase?.name || $t('quickRun.title')"
    :description="testCase?.description || $t('quickRun.noDescription')"
    :breadcrumb-items="breadcrumbItems"
    :is-loading="isLoadingTestCase"
    :error="testCaseError"
    :not-found="!testCase && !isLoadingTestCase && !testCaseError"
    :not-found-message="$t('tests.testCaseNotFound')"
    :on-retry="loadTestCase"
    :on-back="goBackToTestDetails"
  >
    <template #headerActions>
      <base-button variant="outline" @click="goBackToTestDetails">
        {{ $t("quickRun.backToTest") }}
      </base-button>
    </template>

    <div class="quick-run-main">
      <!-- Global Configuration Section -->
      <div class="global-config-section">
        <h3>{{ $t("quickRun.globalSettings") }}</h3>
        <div class="global-config-row">
          <base-input-field
            v-model="runCount"
            :label="$t('quickRun.numberOfRuns')"
            type="number"
            :min="1"
            :max="20"
            :disabled="isRunning"
          />
        </div>
      </div>

      <!-- Provider Configurations -->
      <div class="providers-section">
        <div class="providers-header">
          <h3>{{ $t("quickRun.providers") }}</h3>
          <base-button
            variant="outline"
            size="sm"
            :disabled="isRunning"
            @click="addProvider"
          >
            {{ $t("quickRun.addProvider") }}
          </base-button>
        </div>

        <div v-if="providerConfigs.length === 0" class="empty-providers">
          <p>{{ $t("quickRun.noProvidersConfigured") }}</p>
        </div>

        <div v-else class="providers-list">
          <div
            v-for="(config, index) in providerConfigs"
            :key="config.id"
            class="provider-config"
          >
            <div class="provider-header">
              <h4>{{ $t("quickRun.provider") }} {{ index + 1 }}</h4>
              <base-button
                variant="danger"
                size="sm"
                :disabled="isRunning"
                @click="removeProvider(config.id)"
              >
                {{ $t("common.remove") }}
              </base-button>
            </div>

            <!-- Provider Selection -->
            <div class="provider-selection">
              <provider-selector
                :model-value="{ providerId: config.providerId, model: config.model }"
                :is-running="isRunning"
                @update:model-value="updateProviderSelection(config.id, $event)"
              />
            </div>

            <!-- Provider Options -->
            <provider-options
              :config="config"
              :is-disabled="isRunning"
              :options="{ showParallelToggle: true }"
              @update-max-tokens="(configId, value) => updateProviderConfig(configId, 'maxTokens', value)"
              @update-parallel="(configId, value) => updateProviderConfig(configId, 'allowParallel', value)"
              @update-concurrency="(configId, value) => updateProviderConfig(configId, 'parallelConcurrency', value)"
            />
          </div>
        </div>
      </div>

      <!-- Run Button -->
      <div class="run-section">
        <base-button
          v-if="!isRunning"
          variant="primary"
          size="lg"
          :disabled="!canRun"
          @click="runTests"
        >
          {{ $t("quickRun.runAllProviders") }}
        </base-button>
      </div>

      <!-- Multi-Provider Progress Section -->
      <div v-if="isRunning || hasAnyResults" class="progress-wrapper">
        <div class="progress-header">
          <h3>{{ $t("quickRun.progress") }}</h3>
          <base-badge variant="warning">
            {{ $t("quickRun.status.running") }}
          </base-badge>
        </div>

        <!-- Individual Provider Progress -->
        <div class="providers-progress">
          <div
            v-for="runner in activeBatchRunners"
            :key="runner.providerId"
            class="provider-progress"
          >
            <div class="provider-progress-header">
              <h4>{{ getProviderDisplayName(runner.providerId) }}</h4>
              <base-badge
                :variant="getProviderStatusVariant(runner.runner.state.isRunning, runner.runner.state.results.length > 0)"
              >
                {{ getProviderStatusText(runner.runner.state.isRunning, runner.runner.state.results.length > 0) }}
              </base-badge>
            </div>

            <batch-progress-section
              :completed-runs="runner.runner.state.completedRuns"
              :total-runs="runner.runner.state.totalRuns"
              :progress-percentage="getRunnerProgress(runner.runner.state)"
              :show-statistics="true"
              :statistics="runner.runner.statistics"
              :latest-results="getLatestResults(runner.runner.state.results)"
              :is-running="runner.runner.state.isRunning"
            />
          </div>
        </div>
      </div>
    </div>
  </base-page-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
// Vue i18n translations available via $t in template
import {
  useBatchRunner,
  type BatchRunConfig,
  type BatchRunState,
  type BatchRunResult,
} from "@/composables/useBatchRunner";

// Type definitions for provider config
interface ProviderConfig {
  id: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
}

type BatchRunnerType = ReturnType<typeof useBatchRunner>

interface BatchRunnerWithProvider {
  providerId: string;
  runner: BatchRunnerType;
}


import type { TestCase } from "@/types/testManagement";
import type { QuickRunProviderConfig } from "@/types/quickRun";
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

// Composables
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const providersStore = useProvidersStore();

// State for test case loading
const testCase = ref<TestCase | null>(null);
const isLoadingTestCase = ref(false);
const testCaseError = ref<string | null>(null);

// Quick Run State
const DEFAULT_RUNS = 10;
const runCount = ref(DEFAULT_RUNS);
const providerConfigs = ref<QuickRunProviderConfig[]>([]);
const isRunning = ref(false);

// Pre-create batch runners pool to avoid dynamic composable calls
const batchRunnerPool = ref<Map<string, BatchRunnerType>>(new Map<string, BatchRunnerType>());
const BATCH_RUNNER_POOL_SIZE = 5;

// Initialize batch runner pool
for (let i = 0; i < BATCH_RUNNER_POOL_SIZE; i++) {
  const runner = useBatchRunner();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batchRunnerPool.value.set(`pool-${i}`, runner as any);
}

// Track active batch runners for progress display
const activeBatchRunners = ref<Array<BatchRunnerWithProvider>>([]);

// Computed
const testId = computed(() => route.params.testId as string);

const breadcrumbItems = computed(() => [
  {
    label: t("tests.title"),
    action: goBackToTestDetails,
  },
  {
    label: testCase.value?.name || "",
    action: goBackToTestDetails,
  },
  {
    label: t("quickRun.title"),
  },
]);

const canRun = computed(() => {
  return (
    !isRunning.value &&
    providerConfigs.value.length > 0 &&
    providerConfigs.value.every(config => config.providerId && config.model) &&
    runCount.value > 0
  );
});

const hasAnyResults = computed(() => {
  return activeBatchRunners.value.some(runner =>
    runner.runner.state.results.length > 0
  );
});

// Navigation
const goBackToTestDetails = (): void => {
  void router.push(`/tests/${testId.value}`);
};

// Provider Management
const addProvider = (): void => {
  const newConfig: QuickRunProviderConfig = {
    id: `provider-${Date.now()}`,
    providerId: "",
    model: "",
    maxTokens: 2048,
    temperature: 0.7,
    allowParallel: false,
    parallelConcurrency: 2,
  };
  providerConfigs.value.push(newConfig);
};

const removeProvider = (configId: string): void => {
  const index = providerConfigs.value.findIndex(config => config.id === configId);
  if (index > -1) {
    providerConfigs.value.splice(index, 1);
  }
};

const updateProviderSelection = (
  configId: string,
  selection: ProviderSelection,
): void => {
  const config = providerConfigs.value.find(c => c.id === configId);
  if (config) {
    config.providerId = selection.providerId;
    config.model = selection.model;
  }
};

const updateProviderConfig = (
  configId: string,
  field: keyof QuickRunProviderConfig,
  value: unknown,
): void => {
  const config = providerConfigs.value.find(c => c.id === configId);
  if (config) {
    (config as Record<string, unknown>)[field] = value;
  }
};



// Quick Run Execution
const runTests = async (): Promise<void> => {
  if (!testCase.value || !canRun.value) return;

  isRunning.value = true;
  activeBatchRunners.value = [];

  try {
    // Prepare batch runners for each provider
    const runnerPromises: Promise<void>[] = [];

    for (const [index, config] of providerConfigs.value.entries()) {
      const poolKey = `pool-${index % BATCH_RUNNER_POOL_SIZE}`;
      const runner = batchRunnerPool.value.get(poolKey);

      if (!runner) {
        console.error(`No batch runner available for pool key: ${poolKey}`);
        continue;
      }

      // Track active runner for progress display
      activeBatchRunners.value.push({
        providerId: config.providerId,
        runner,
      });

      // Configure and start the batch run
      const batchConfig: BatchRunConfig = {
        testCase: testCase.value,
        providerId: config.providerId,
        model: config.model,
        runCount: runCount.value,
        maxTokens: config.maxTokens,
        allowParallel: config.allowParallel,
        parallelConcurrency: config.parallelConcurrency,
        maxRetries: 2,
        delayMs: 1000,
      };

      // Start the batch run and add to promises array
      const promise = runner.runBatch(batchConfig);
      runnerPromises.push(promise);
    }

    // Wait for all provider runs to complete
    await Promise.all(runnerPromises);

    console.log("All Quick-Run batches completed successfully");
  } catch (error) {
    console.error("Quick-Run execution failed:", error);
  } finally {
    isRunning.value = false;
  }
};

// Helper functions for progress display
const getProviderDisplayName = (providerId: string): string => {
  const provider = providersStore.providerConfigs.find((p: ProviderConfig) => p.id === providerId);
  return provider?.name || providerId;
};

const getProviderStatusVariant = (isRunning: boolean, hasResults: boolean): "primary" | "danger" | "success" | "warning" | "info" | "light" | "dark" => {
  if (isRunning) return "warning";
  if (hasResults) return "success";
  return "info";
};

const getProviderStatusText = (isRunning: boolean, hasResults: boolean): string => {
  if (isRunning) return "Running";
  if (hasResults) return "Completed";
  return "Pending";
};

const PERCENTAGE_MULTIPLIER = 100;

const getRunnerProgress = (state: BatchRunState): number => {
  const { completedRuns, totalRuns } = state;
  return totalRuns > 0 ? Math.round((completedRuns / totalRuns) * PERCENTAGE_MULTIPLIER) : 0;
};


const getLatestResults = (results: BatchRunResult[]): Array<BatchRunResult> => {
  const LAST_RESULTS = 3;
  return results.slice(-LAST_RESULTS); // Show last 3 results
};

// Data loading
const loadTestCase = async (): Promise<void> => {
  if (!testId.value) return;

  isLoadingTestCase.value = true;
  testCaseError.value = null;

  try {
    const loadedTestCase = await testDB.getTestCase(testId.value);
    if (loadedTestCase) {
      testCase.value = loadedTestCase;
    } else {
      testCase.value = null;
      testCaseError.value = "Test case not found";
    }
  } catch (err) {
    console.error("Failed to load test case:", err);
    testCaseError.value = err instanceof Error ? err.message : "Failed to load test case";
    testCase.value = null;
  } finally {
    isLoadingTestCase.value = false;
  }
};

// Initialize default provider on load
const initializeDefaultProvider = (): void => {
  providersStore.initialize();
  if (providerConfigs.value.length === 0) {
    addProvider();
  }
};

// Watch for route changes
watch(
  () => route.params.testId,
  () => {
    if (route.params.testId) {
      void loadTestCase();
    }
  },
  { immediate: true }
);

// Initialize on mount
onMounted(async () => {
  await loadTestCase();

  initializeDefaultProvider();
});
</script>

<style scoped>
/* Main content */
.quick-run-main {
  padding: 0;
}

/* Global configuration */
.global-config-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.global-config-section h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
}

.global-config-row {
  display: grid;
  grid-template-columns: 1fr;
  max-width: 300px;
}

/* Providers section */
.providers-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.providers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.providers-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
}

.empty-providers {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.provider-config {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #f9fafb;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.provider-header h4 {
  margin: 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.provider-selection {
  margin-bottom: 1rem;
}



/* Run section */
.run-section {
  text-align: center;
  margin-bottom: 2rem;
}

/* Progress section */
.progress-wrapper {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.progress-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
}

.providers-progress {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.provider-progress {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f9fafb;
}

.provider-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.provider-progress-header h4 {
  margin: 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}
</style>
