<template>
  <BaseCard class="batch-runner">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">{{ $t("batch.runner.title") }}</h3>
        <div class="flex items-center space-x-2">
          <BaseBadge
            v-if="batchRunner.state.isRunning"
            variant="info"
          >
            {{ $t("batch.runner.status.running") }}
          </BaseBadge>
          <BaseBadge
            v-else-if="batchRunner.state.completedRuns > 0"
            :variant="batchRunner.statistics.value.passRate >= 80 ? 'success' : 'warning'"
          >
            {{ Math.round(batchRunner.statistics.value.passRate) }}% {{ $t("batch.runner.passRate") }}
          </BaseBadge>
        </div>
      </div>
    </template>

    <!-- Configuration Section -->
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseInputField
          v-model="config.runCount"
          :label="$t('batch.config.runCount')"
          type="number"
          :min="1"
          :max="100"
          :disabled="batchRunner.state.isRunning"
        />

        <BaseInputField
          v-model="config.maxRetries"
          :label="$t('batch.config.maxRetries')"
          type="number"
          :min="0"
          :max="5"
          :disabled="batchRunner.state.isRunning"
        />

        <BaseInputField
          v-model="config.delayMs"
          :label="$t('batch.config.delayMs')"
          type="number"
          :min="0"
          :max="10000"
          :disabled="batchRunner.state.isRunning"
        />
      </div>

      <!-- Progress Section -->
      <div v-if="batchRunner.state.totalRuns > 0" class="space-y-4">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <span>{{ $t("batch.progress.completed", {
            completed: batchRunner.state.completedRuns,
            total: batchRunner.state.totalRuns
          }) }}</span>
          <span>{{ batchRunner.progress }}%</span>
        </div>

        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${batchRunner.progress}%` }"
          ></div>
        </div>

        <!-- Real-time Statistics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div class="text-center">
            <div class="font-semibold text-green-600">{{ batchRunner.statistics.value.passedRuns }}</div>
            <div class="text-gray-500">{{ $t("batch.stats.passed") }}</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-red-600">{{ batchRunner.statistics.value.failedRuns }}</div>
            <div class="text-gray-500">{{ $t("batch.stats.failed") }}</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-blue-600">{{ Math.round(batchRunner.statistics.value.avgDuration) }}ms</div>
            <div class="text-gray-500">{{ $t("batch.stats.avgLatency") }}</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-purple-600">${{ batchRunner.statistics.value.totalCost.toFixed(4) }}</div>
            <div class="text-gray-500">{{ $t("batch.stats.totalCost") }}</div>
          </div>
        </div>
      </div>

      <!-- Error Messages -->
      <div v-if="batchRunner.state.errors.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-red-600">{{ $t("batch.errors.title") }}</h4>
        <div class="max-h-32 overflow-y-auto space-y-1">
          <div
            v-for="(error, index) in batchRunner.state.errors"
            :key="index"
            class="text-xs text-red-600 bg-red-50 p-2 rounded"
          >
            {{ error }}
          </div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center justify-between">
        <div class="flex space-x-2">
          <BaseButton
            v-if="!batchRunner.state.isRunning"
            variant="primary"
            :disabled="!canStart"
            @click="startBatch"
          >
            ▶ {{ $t("batch.actions.start") }}
          </BaseButton>

          <BaseButton
            v-if="batchRunner.state.isRunning"
            variant="danger"
            @click="cancelBatch"
          >
            ⏹ {{ $t("batch.actions.cancel") }}
          </BaseButton>

          <BaseButton
            v-if="batchRunner.state.completedRuns > 0 && !batchRunner.state.isRunning"
            variant="outline"
            @click="resetBatch"
          >
            ↻ {{ $t("batch.actions.reset") }}
          </BaseButton>
        </div>

        <BaseButton
          v-if="batchRunner.state.completedRuns > 0"
          variant="outline"
          @click="$emit('export-results', batchRunner.state.results)"
        >
          ↓ {{ $t("batch.actions.export") }}
        </BaseButton>
      </div>
    </div>
  </BaseCard>
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
const config = ref<Omit<BatchRunConfig, "testCase" | "providerId">>({
  runCount: 10,
  maxRetries: 2,
  delayMs: 1000,
});

// Computed properties
const canStart = computed(() => {
  return !props.disabled &&
         props.testCase &&
         props.providerId &&
         config.value.runCount > 0 &&
         !batchRunner.state.isRunning;
});

// Methods
const startBatch = async (): Promise<void> => {
  if (!canStart.value) return;

  const batchConfig: BatchRunConfig = {
    testCase: props.testCase,
    providerId: props.providerId,
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
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BatchRunner",
});
</script>
