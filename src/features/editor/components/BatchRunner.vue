<template>
  <base-card class="batch-runner">
    <template #header>
      <div class="header-container">
        <h3>{{ $t("batch.runner.title") }}</h3>
        <div class="badge-container">
          <base-badge v-if="batchRunner.state.isRunning" variant="info">
            {{ $t("batch.runner.status.running") }}
          </base-badge>
          <base-badge
            v-else-if="batchRunner.state.completedRuns > 0"
            :variant="
              batchRunner.statistics.value.passRate >= 80
                ? 'success'
                : 'warning'
            "
          >
            {{ Math.round(batchRunner.statistics.value.passRate) }}%
            {{ $t("batch.runner.passRate") }}
          </base-badge>
        </div>
      </div>
    </template>

    <!-- Configuration Section -->
    <div class="content-container">
      <div class="config-grid">
        <!-- Row 1: Run Count + Parallel Checkbox -->
        <div class="config-row">
          <base-input-field
            v-model="config.runCount"
            :label="$t('batch.config.runCount')"
            type="number"
            :min="1"
            :max="100"
            :disabled="batchRunner.state.isRunning"
            class="config-field"
          />

          <div class="checkbox-field config-field">
            <label class="checkbox-label">
              <input
                v-model="config.allowParallel"
                type="checkbox"
                :disabled="batchRunner.state.isRunning || !canUseParallel"
              />
              <span class="checkbox-text">
                {{ $t("promptEditor.runInParallel") }}
              </span>
            </label>
            <div v-if="!canUseParallel" class="checkbox-help">
              {{ $t("promptEditor.parallelRequiresMultipleRuns") }}
            </div>
          </div>
        </div>

        <!-- Row 2: Max Retries + Delay/Concurrency -->
        <div class="config-row">
          <base-input-field
            v-model="config.maxRetries"
            :label="$t('batch.config.maxRetries')"
            type="number"
            :min="0"
            :max="5"
            :disabled="batchRunner.state.isRunning"
            class="config-field"
          />

          <!-- Concurrency (when parallel) or Delay (when sequential) - same position -->
          <base-input-field
            v-if="config.allowParallel"
            v-model="config.parallelConcurrency"
            :label="$t('promptEditor.concurrency')"
            type="select"
            :options="concurrencyOptions"
            :disabled="batchRunner.state.isRunning"
            class="config-field"
          />

          <base-input-field
            v-else
            v-model="config.delayMs"
            :label="$t('batch.config.delayMs')"
            type="number"
            :min="0"
            :max="10000"
            :disabled="batchRunner.state.isRunning"
            class="config-field"
          />
        </div>
      </div>

      <!-- Progress Section -->
      <batch-progress-section
        v-if="batchRunner.state.totalRuns > 0"
        :completed-runs="batchRunner.state.completedRuns"
        :total-runs="batchRunner.state.totalRuns"
        :progress-percentage="batchRunner.progress.value"
        :show-statistics="true"
        :statistics="batchRunner.statistics.value"
      />

      <!-- Error Messages -->
      <div v-if="batchRunner.state.errors.length > 0" class="error-section">
        <h4 class="error-title">{{ $t("batch.errors.title") }}</h4>
        <div class="error-list">
          <div
            v-for="(error, index) in batchRunner.state.errors"
            :key="index"
            class="error-item"
          >
            {{ error }}
          </div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="controls-container">
        <div class="controls-left">
          <base-button
            v-if="!batchRunner.state.isRunning"
            variant="primary"
            :disabled="!canStart"
            @click="startBatch"
          >
            ▶ {{ $t("batch.actions.start") }}
          </base-button>

          <base-button
            v-if="batchRunner.state.isRunning"
            variant="danger"
            @click="cancelBatch"
          >
            ⏹ {{ $t("batch.actions.cancel") }}
          </base-button>

          <base-button
            v-if="
              batchRunner.state.completedRuns > 0 &&
              !batchRunner.state.isRunning
            "
            variant="outline"
            @click="resetBatch"
          >
            ↻ {{ $t("batch.actions.reset") }}
          </base-button>
        </div>

        <div class="controls-right">
          <base-button
            v-if="batchRunner.state.completedRuns > 0"
            variant="outline"
            @click="$emit('export-results', batchRunner.state.results)"
          >
            ↓ {{ $t("batch.actions.export") }}
          </base-button>
        </div>
      </div>
    </div>
  </base-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  useBatchRunner,
  type BatchRunConfig,
  type BatchRunResult,
} from "../../../composables/useBatchRunner";
import type { TestCase } from "../../../types/testManagement";
import BaseCard from "../../../components/ui/BaseCard.vue";
import BaseInputField from "../../../components/ui/BaseInputField.vue";
import BaseButton from "../../../components/ui/BaseButton.vue";
import BaseBadge from "../../../components/ui/BaseBadge.vue";
import BatchProgressSection from "../../../components/ui/BatchProgressSection.vue";

// Constants to avoid magic numbers
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;

interface Props {
  testCase: TestCase;
  providerId: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  disabled?: boolean;
}

interface Emits {
  (e: "batch-started"): void;
  (e: "batch-completed", results: BatchRunResult[]): void;
  (e: "batch-cancelled"): void;
  (e: "export-results", results: BatchRunResult[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Batch runner composable
const batchRunner = useBatchRunner();

// Configuration state
const config = ref<
  Omit<BatchRunConfig, "testCase" | "providerId" | "model"> & {
    allowParallel: boolean;
    parallelConcurrency: number;
  }
>({
  runCount: 10,
  maxRetries: 2,
  delayMs: 100,
  temperature: undefined,
  maxTokens: undefined,
  allowParallel: false,
  parallelConcurrency: 5,
});

// Concurrency options for parallel execution
const CONCURRENCY_OPTIONS = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
];

const concurrencyOptions = computed(() => CONCURRENCY_OPTIONS);

// Computed properties
const canUseParallel = computed(() => config.value.runCount > 1);

const canStart = computed(() => {
  return (
    !props.disabled &&
    props.testCase &&
    props.providerId &&
    props.model &&
    config.value.runCount > 0 &&
    !batchRunner.state.isRunning
  );
});

// Methods
const startBatch = async (): Promise<void> => {
  if (!canStart.value) return;

  const batchConfig: BatchRunConfig = {
    testCase: props.testCase,
    providerId: props.providerId,
    model: props.model,
    ...config.value,
    temperature:
      props.temperature ?? config.value.temperature ?? DEFAULT_TEMPERATURE,
    maxTokens: props.maxTokens ?? config.value.maxTokens ?? DEFAULT_MAX_TOKENS,
  };

  emit("batch-started");
  await batchRunner.runBatch(batchConfig);

  if (!batchRunner.state.isCancelled) {
    emit("batch-completed", batchRunner.state.results);
  } else {
    emit("batch-cancelled");
  }
};

const cancelBatch = (): void => {
  batchRunner.cancelBatch();
  emit("batch-cancelled");
};

const resetBatch = (): void => {
  batchRunner.resetBatch();
};

// Watch for completion
watch(
  () => batchRunner.state.isRunning,
  (isRunning, wasRunning) => {
    if (wasRunning && !isRunning && !batchRunner.state.isCancelled) {
      emit("batch-completed", batchRunner.state.results);
    }
  },
);
</script>

<style scoped>
.batch-runner {
  margin: 0 auto;
  color: #000;
}

/* Header Styles */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-container {
  display: flex;
  align-items: center;
}

/* Content Layout */
.content-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: end;
}

.config-field {
  width: 100%;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 768px) {
  .config-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

@media (min-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* Error Section */
.error-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc2626;
  margin: 0;
}

.error-list {
  max-height: 8rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-item {
  font-size: 0.75rem;
  color: #dc2626;
  background-color: #fef2f2;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

/* Controls */
.controls-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.controls-left {
  display: flex;
  gap: 0.5rem;
}

.controls-right {
  display: flex;
}

/* Visualization Section */
.visualization-section {
  margin-top: 1rem;
}

/* Parallel Execution Styles */
.checkbox-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: #2563eb;
}

.checkbox-label input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-text {
  user-select: none;
}

.checkbox-help {
  font-size: 0.875rem;
  color: #6b7280;
  margin-left: 1.5rem;
}

/* Execution Mode Info Panels */
.config-info {
  margin-top: 1rem;
}

.info-panel {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
}

.info-panel.parallel {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

.info-panel.sequential {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.info-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #374151;
}

.info-text {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BatchRunner",
});
</script>
