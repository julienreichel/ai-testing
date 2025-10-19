<template>
  <base-dialog
    v-model="dialogOpen"
    :title="$t('quickRun.title')"
    size="xl"
    @close="handleClose"
  >
    <div class="quick-run-dialog">
      <!-- Global Configuration Section -->
      <div class="global-config-section">
        <h3>{{ $t('quickRun.globalSettings') }}</h3>
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
          <h3>{{ $t('quickRun.providers') }}</h3>
          <base-button
            variant="outline"
            size="sm"
            :disabled="isRunning"
            @click="addProvider"
          >
            {{ $t('quickRun.addProvider') }}
          </base-button>
        </div>

        <div v-if="providerConfigs.length === 0" class="empty-providers">
          <p>{{ $t('quickRun.noProvidersConfigured') }}</p>
        </div>

        <div v-else class="providers-list">
          <div
            v-for="(config, index) in providerConfigs"
            :key="config.id"
            class="provider-config"
          >
            <div class="provider-header">
              <h4>{{ $t('quickRun.provider') }} {{ index + 1 }}</h4>
              <base-button
                variant="danger"
                size="sm"
                :disabled="isRunning"
                @click="removeProvider(config.id)"
              >
                {{ $t('common.remove') }}
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
            <div class="provider-options">
              <div class="options-row">
                <base-input-field
                  :model-value="config.maxTokens"
                  :label="$t('promptEditor.maxTokens')"
                  type="number"
                  :min="1"
                  :max="8192"
                  :disabled="isRunning"
                  @update:model-value="updateProviderConfig(config.id, 'maxTokens', $event)"
                />
                <div class="parallel-toggle">
                  <input
                    :id="`parallel-${config.id}`"
                    :checked="config.allowParallel"
                    type="checkbox"
                    :disabled="isRunning"
                    class="parallel-checkbox"
                    @change="handleParallelToggle(config.id, $event)"
                  />
                  <label :for="`parallel-${config.id}`" class="parallel-label">
                    {{ $t("quickRun.enableParallel") }}
                  </label>
                </div>
                <base-input-field
                  v-if="config.allowParallel"
                  :model-value="config.parallelConcurrency"
                  :label="$t('quickRun.concurrency')"
                  type="number"
                  :min="1"
                  :max="10"
                  :disabled="isRunning"
                  class="concurrency-input"
                  @update:model-value="updateProviderConfig(config.id, 'parallelConcurrency', $event)"
                />
              </div>
            </div>
          </div>
        </div>
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
              :progress-percentage="getRunnerProgress(runner)"
              :show-statistics="true"
              :show-results-preview="providerConfigs.length === 1"
              :statistics="getRunnerStatistics(runner)"
              :recent-results="getProviderRecentResults(runner)"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="dialog-actions">
        <base-button variant="outline" @click="handleClose">
          {{ $t("common.cancel") }}
        </base-button>
        <base-button
          v-if="isRunning"
          variant="danger"
          @click="cancelRun"
        >
          {{ $t("quickRun.cancelRun") }}
        </base-button>
        <base-button
          v-else
          variant="primary"
          :disabled="!canRun"
          @click="startRun"
        >
          {{ $t("quickRun.startRun") }}
        </base-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
// Vue i18n translations available via $t in template
import {
  useBatchRunner,
  type BatchRunConfig,
  type BatchRunResult,
} from "composables/useBatchRunner";
import type { TestCase } from "types/testManagement";
import type { QuickRunProviderConfig } from "types/quickRun";
import { useProvidersStore } from "store/providers";
import {
  BaseDialog,
  BaseButton,
  BaseInputField,
  BaseBadge,
  BatchProgressSection,
} from "components/ui";
import { ProviderSelector } from "features/editor/components";
import type { ProviderSelection } from "features/editor/components/ProviderSelector.vue";

interface Props {
  isOpen: boolean;
  testCase: TestCase | null;
}

interface Emits {
  (e: "close"): void;
  (e: "completed", results: BatchRunResult[]): void;
}

interface BatchRunnerWithProvider {
  providerId: string;
  runner: {
    state: {
      isRunning: boolean;
      isCancelled: boolean;
      completedRuns: number;
      totalRuns: number;
      results: BatchRunResult[];
      errors: string[];
      startTime?: Date;
      endTime?: Date;
    };
    progress: unknown;
    statistics: unknown;
    runBatch: (config: BatchRunConfig) => Promise<void>;
    cancelBatch: () => void;
    resetBatch: () => void;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Default values
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_RUNS_COUNT = 5;
const DEFAULT_TEMPERATURE = 0.7;
const SMALL_DELAY = 100;
const HISTORY_SIZE = 3;
const MAX_PROVIDERS = 10; // Maximum number of providers we support

// Global configuration
const runCount = ref(DEFAULT_RUNS_COUNT);

// Provider configurations
const providerConfigs = ref<QuickRunProviderConfig[]>([]);

// Dialog state (needs to be reactive for v-model)
const dialogOpen = ref(false);

// Pre-create a pool of batch runners at setup level (required for Vue composables)
const batchRunnerPool = Array.from({ length: MAX_PROVIDERS }, () => useBatchRunner());

// Active batch runners mapped to provider configs
const activeBatchRunners = ref<BatchRunnerWithProvider[]>([]);

// Providers store
const providersStore = useProvidersStore();

// Computed properties
const isRunning = computed(() =>
  activeBatchRunners.value.some(runner => runner.runner.state.isRunning)
);

const hasAnyResults = computed(() =>
  activeBatchRunners.value.some(runner => runner.runner.state.results.length > 0)
);const canRun = computed(() => {
  return (
    providerConfigs.value.length > 0 &&
    providerConfigs.value.every(config =>
      config.providerId && config.model
    ) &&
    runCount.value > 0 &&
    props.testCase &&
    !isRunning.value
  );
});

// Helper functions to safely extract computed values
const getRunnerProgress = (runner: { runner: { progress: unknown } }): number => {
  const progress = runner.runner.progress;
  return typeof progress === 'object' && progress !== null && 'value' in progress ? (progress as { value: number }).value : progress as number;
};

const getRunnerStatistics = (runner: { runner: { statistics: unknown } }): { passedRuns: number; failedRuns: number; avgDuration: number; totalCost: number } => {
  const statistics = runner.runner.statistics;
  const defaultStats = { passedRuns: 0, failedRuns: 0, avgDuration: 0, totalCost: 0 };

  if (typeof statistics === 'object' && statistics !== null && 'value' in statistics) {
    return (statistics as { value: typeof defaultStats }).value;
  }

  return statistics as typeof defaultStats || defaultStats;
};

// Provider configuration methods
const addProvider = (): void => {
  // Check if we've reached the maximum providers
  if (providerConfigs.value.length >= MAX_PROVIDERS) {
    console.warn(`Maximum of ${MAX_PROVIDERS} providers supported`);
    return;
  }

  const newId = `provider-${Date.now()}`;
  const newConfig: QuickRunProviderConfig = {
    id: newId,
    providerId: "",
    model: "",
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    allowParallel: false,
    parallelConcurrency: DEFAULT_CONCURRENCY,
  };

  providerConfigs.value.push(newConfig);

  // Use a batch runner from the pre-created pool
  const batchRunner = batchRunnerPool[activeBatchRunners.value.length];
  if (!batchRunner) {
    console.error("No available batch runner in pool");
    return;
  }

  activeBatchRunners.value.push({
    providerId: newId,
    runner: batchRunner as unknown as BatchRunnerWithProvider['runner'],
  });
};const removeProvider = (configId: string): void => {
  const configIndex = providerConfigs.value.findIndex(c => c.id === configId);
  if (configIndex !== -1) {
    providerConfigs.value.splice(configIndex, 1);
  }

  const runnerIndex = activeBatchRunners.value.findIndex(r => r.providerId === configId);
  if (runnerIndex !== -1) {
    // Cancel any running batch for this provider
    const runner = activeBatchRunners.value[runnerIndex];
    if (runner) {
      runner.runner.cancelBatch();
      runner.runner.resetBatch();
    }
    activeBatchRunners.value.splice(runnerIndex, 1);
  }
};

const updateProviderSelection = (configId: string, selection: ProviderSelection): void => {
  const config = providerConfigs.value.find(c => c.id === configId);
  if (config) {
    config.providerId = selection.providerId;
    config.model = selection.model;
  }
};

const updateProviderConfig = (configId: string, field: keyof QuickRunProviderConfig, value: unknown): void => {
  const config = providerConfigs.value.find(c => c.id === configId);
  if (config) {
    (config as Record<string, unknown>)[field] = value;
  }
};

const handleParallelToggle = (configId: string, event: Event): void => {
  const target = event.target as HTMLInputElement;
  updateProviderConfig(configId, 'allowParallel', target.checked);
};

// Utility methods for template
const getProviderDisplayName = (runnerId: string): string => {
  const config = providerConfigs.value.find(c => c.id === runnerId);
  if (!config || !config.providerId) return "Provider";

  const provider = providersStore.providerConfigs.find(p => p.id === config.providerId);
  return provider ? `${provider.name} (${config.model})` : config.providerId;
};

const getProviderStatusVariant = (isRunning: boolean, hasResults: boolean): "warning" | "success" | "info" => {
  if (isRunning) return "warning";
  if (hasResults) return "success";
  return "info";
};

const getProviderStatusText = (isRunning: boolean, hasResults: boolean): string => {
  if (isRunning) return "Running";
  if (hasResults) return "Completed";
  return "Pending";
};

const getProviderRecentResults = (runner: { runner: { state: { results: BatchRunResult[] } } }): Array<{ content: string }> => {
  return runner.runner.state.results.slice(-HISTORY_SIZE).map((result: BatchRunResult) => ({
    content: result.response || result.error || "No content"
  }));
};

// Watch for completion across all providers
watch(
  () => activeBatchRunners.value.map(r => r.runner.state.isRunning),
  (currentRunning, previousRunning) => {
    const wasAnyRunning = previousRunning?.some(Boolean) || false;
    const isAnyRunning = currentRunning.some(Boolean);

    if (wasAnyRunning && !isAnyRunning) {
      // All providers completed - collect all results
      const allResults = activeBatchRunners.value.flatMap(runner => runner.runner.state.results);
      emit("completed", allResults);
    }
  },
  { deep: true }
);// Action handlers
const startRun = async (): Promise<void> => {
  if (!canRun.value || !props.testCase) return;

  // Create batch configurations for each provider
  const batchPromises = providerConfigs.value.map(async (config, index) => {
    const runner = activeBatchRunners.value[index];
    if (!runner) return;

    const batchConfig: BatchRunConfig = {
      testCase: props.testCase!,
      providerId: config.providerId,
      model: config.model,
      runCount: runCount.value,
      maxRetries: 2, // Default retry count
      delayMs: config.allowParallel ? 0 : SMALL_DELAY,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      allowParallel: config.allowParallel,
      parallelConcurrency: config.parallelConcurrency,
    };

    try {
      await runner.runner.runBatch(batchConfig);
    } catch (error) {
      console.error(`Failed to run batch for provider ${config.providerId}:`, error);
    }
  });

  // Run all providers in parallel
  await Promise.all(batchPromises);
};

const cancelRun = (): void => {
  activeBatchRunners.value.forEach(runner => {
    runner.runner.cancelBatch();
  });
};

const handleClose = (): void => {
  // Only allow closing if not running
  if (!isRunning.value) {
    dialogOpen.value = false;
  }
};

// Sync dialog open state with props
watch(
  () => props.isOpen,
  (isOpen) => {
    dialogOpen.value = isOpen;
    if (isOpen) {
      // Reset configuration
      providerConfigs.value = [];
      activeBatchRunners.value = [];
      runCount.value = DEFAULT_RUNS_COUNT;

      // Reset all batch runners
      batchRunnerPool.forEach(runner => runner.resetBatch());

      // Add initial provider
      addProvider();
    }
  },
  { immediate: true }
);// Sync dialog close with parent
watch(
  () => dialogOpen.value,
  (isOpen) => {
    if (!isOpen && props.isOpen) {
      // Dialog was closed, emit close event
      emit("close");
    }
  }
);

// Initialize providers store on component mount
onMounted(() => {
  providersStore.initialize();
});
</script>

<style scoped>
.quick-run-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 80vh;
  overflow-y: auto;
}

/* Global Configuration Section */
.global-config-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

.global-config-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.global-config-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 300px;
}

/* Providers Section */
.providers-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #ffffff;
}

.providers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.providers-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.empty-providers {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Individual Provider Configuration */
.provider-config {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.provider-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.provider-selection {
  margin-bottom: 1rem;
}

.provider-options {
  margin-top: 1rem;
}

.options-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: end;
}

.parallel-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.parallel-checkbox {
  width: 16px;
  height: 16px;
}

.parallel-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
}

.concurrency-input {
  max-width: 120px;
}

/* Multi-Provider Progress Section */
.progress-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.providers-progress {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.provider-progress {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  background: #ffffff;
}

.provider-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.provider-progress-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

/* Dialog Actions */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Responsive Design */
@media (max-width: 768px) {
  .global-config-row {
    max-width: none;
  }

  .options-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .parallel-toggle {
    justify-content: flex-start;
  }

  .providers-progress {
    gap: 1rem;
  }

  .provider-progress {
    padding: 0.75rem;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }
}

@media (max-width: 480px) {
  .providers-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .provider-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
}
</style>
