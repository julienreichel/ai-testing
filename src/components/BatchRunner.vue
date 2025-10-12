<template>
  <base-card class="batch-runner">
    <template #header>
      <div class="header-container">
        <h3>{{ $t("batch.runner.title") }}</h3>
        <div class="badge-container">
          <base-badge
            v-if="batchRunner.state.isRunning"
            variant="info"
          >
            {{ $t("batch.runner.status.running") }}
          </base-badge>
          <base-badge
            v-else-if="batchRunner.state.completedRuns > 0"
            :variant="batchRunner.statistics.value.passRate >= 80 ? 'success' : 'warning'"
          >
            {{ Math.round(batchRunner.statistics.value.passRate) }}% {{ $t("batch.runner.passRate") }}
          </base-badge>
        </div>
      </div>
    </template>

    <!-- Configuration Section -->
    <div class="content-container">
      <div class="config-grid">
        <base-input-field
          v-model="config.runCount"
          :label="$t('batch.config.runCount')"
          type="number"
          :min="1"
          :max="100"
          :disabled="batchRunner.state.isRunning"
        />

        <base-input-field
          v-model="config.maxRetries"
          :label="$t('batch.config.maxRetries')"
          type="number"
          :min="0"
          :max="5"
          :disabled="batchRunner.state.isRunning"
        />

        <base-input-field
          v-model="config.delayMs"
          :label="$t('batch.config.delayMs')"
          type="number"
          :min="0"
          :max="10000"
          :disabled="batchRunner.state.isRunning"
        />
      </div>

      <!-- Progress Section -->
      <div v-if="batchRunner.state.totalRuns > 0" class="progress-section">
        <div class="progress-header">
          <span>{{ $t("batch.progress.completed", {
            completed: batchRunner.state.completedRuns,
            total: batchRunner.state.totalRuns
          }) }}</span>
          <span>{{ batchRunner.progress }}%</span>
        </div>

        <div class="progress-bar-container">
          <div
            class="progress-bar"
            :style="{ width: `${batchRunner.progress}%` }"
          ></div>
        </div>

        <!-- Real-time Statistics -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value stat-success">{{ batchRunner.statistics.value.passedRuns }}</div>
            <div class="stat-label">{{ $t("batch.stats.passed") }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value stat-error">{{ batchRunner.statistics.value.failedRuns }}</div>
            <div class="stat-label">{{ $t("batch.stats.failed") }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value stat-info">{{ Math.round(batchRunner.statistics.value.avgDuration) }}ms</div>
            <div class="stat-label">{{ $t("batch.stats.avgLatency") }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value stat-purple">${{ batchRunner.statistics.value.totalCost.toFixed(4) }}</div>
            <div class="stat-label">{{ $t("batch.stats.totalCost") }}</div>
          </div>
        </div>
      </div>

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
            v-if="batchRunner.state.completedRuns > 0 && !batchRunner.state.isRunning"
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
import { useBatchRunner, type BatchRunConfig, type BatchRunResult } from "../composables/useBatchRunner";
import type { TestCase } from "../types/testManagement";
import BaseCard from "./ui/BaseCard.vue";
import BaseInputField from "./ui/BaseInputField.vue";
import BaseButton from "./ui/BaseButton.vue";
import BaseBadge from "./ui/BaseBadge.vue";

interface Props {
  testCase: TestCase;
  providerId: string;
  model: string;
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
const config = ref<Omit<BatchRunConfig, "testCase" | "providerId" | "model">>({
  runCount: 10,
  maxRetries: 2,
  delayMs: 1000,
});

// Computed properties
const canStart = computed(() => {
  return !props.disabled &&
         props.testCase &&
         props.providerId &&
         props.model &&
         config.value.runCount > 0 &&
         !batchRunner.state.isRunning;
});

// Methods
const startBatch = async (): Promise<void> => {
  if (!canStart.value) return;

  const batchConfig: BatchRunConfig = {
    testCase: props.testCase,
    providerId: props.providerId,
    model: props.model,
    ...config.value,
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
  }
);
</script>

<style scoped>
.batch-runner {
  max-width: 56rem;
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
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* Progress Section */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #2563eb;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stat-success {
  color: #059669;
}

.stat-error {
  color: #dc2626;
}

.stat-info {
  color: #2563eb;
}

.stat-purple {
  color: #7c3aed;
}

.stat-label {
  color: #6b7280;
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
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BatchRunner",
});
</script>
