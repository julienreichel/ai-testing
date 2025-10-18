<template>
  <base-dialog
    v-model="dialogOpen"
    :title="$t('quickRun.title')"
    size="lg"
    @close="handleClose"
  >
    <div class="quick-run-dialog">
      <!-- Configuration Section -->
      <div class="config-section">

        <base-input-field
          v-model="runCount"
          :label="$t('quickRun.numberOfRuns')"
          type="number"
          :min="1"
          :max="20"
          :disabled="isRunning"
        />

        <!-- Provider Selection -->
        <div class="provider-selection">
          <provider-selector
            v-model="selectedProvider"
            :is-running="isRunning"
          />
        </div>

        <!-- Run Configuration -->
        <div class="run-config">
          <div class="config-row">
            <base-input-field
              v-model="maxTokens"
              :label="$t('promptEditor.maxTokens')"
              type="number"
              :min="1"
              :max="8192"
              :disabled="isRunning"
            />
            <div class="parallel-toggle">
              <input
                id="parallel-execution"
                v-model="allowParallel"
                type="checkbox"
                :disabled="isRunning"
                class="parallel-checkbox"
              />
              <label for="parallel-execution" class="parallel-label">
                {{ $t("quickRun.enableParallel") }}
              </label>
            </div>

            <base-input-field
              v-if="allowParallel"
              v-model="concurrency"
              :label="$t('quickRun.concurrency')"
              type="number"
              :min="1"
              :max="10"
              :disabled="isRunning"
              class="concurrency-input"
            />
          </div>
        </div>
      </div>

      <!-- Progress Section (shown when running) -->
      <div v-if="isRunning" class="progress-section">
        <div class="progress-header">
          <h3>{{ $t("quickRun.progress") }}</h3>
          <base-badge variant="warning">
            {{ $t("quickRun.status.running") }}
          </base-badge>
        </div>

        <div class="progress-info">
          <div class="progress-text">
            {{ $t("quickRun.completedRuns") }}: {{ completedRuns }}/{{ runCount }}
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>

        <div v-if="results.length > 0" class="results-preview">
          <h4>{{ $t("quickRun.latestResults") }}</h4>
          <div class="results-list">
            <div
              v-for="(result, index) in results.slice(-3)"
              :key="index"
              class="result-item"
            >
              <span class="result-index">{{ index + 1 }}</span>
              <span class="result-preview">
                {{ result.content.substring(0, 100) }}...
              </span>
            </div>
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
import { ref, computed, watch } from "vue";
// Vue i18n translations available via $t in template
import {
  BaseDialog,
  BaseButton,
  BaseInputField,
  BaseBadge,
} from "../../../components/ui";
import { ProviderSelector } from "../../editor/components";
import type { TestCase } from "../../../types/testManagement";
import type { ProviderSelection } from "../../editor/components/ProviderSelector.vue";
import type { ProviderRequest, ProviderResponse } from "../../../types/providers";
import { usePromptRunner } from "../../../composables/usePromptRunner";

interface Props {
  isOpen: boolean;
  testCase: TestCase | null;
}

interface Emits {
  (e: "close"): void;
  (e: "completed", results: ProviderResponse[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Translations available via $t in template

// Default values
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_RUNS_COUNT = 5;

// Configuration state
const selectedProvider = ref<ProviderSelection>({
  providerId: "",
  model: "",
});

const runCount = ref(DEFAULT_RUNS_COUNT);
const maxTokens = ref(DEFAULT_MAX_TOKENS);
const allowParallel = ref(false);
const concurrency = ref(DEFAULT_CONCURRENCY);

// Dialog state (needs to be reactive for v-model)
const dialogOpen = ref(false);

// Execution state
const { state, runRepeated, cancelRun: cancelPromptRun } = usePromptRunner();
const results = ref<ProviderResponse[]>([]);

// Computed properties
const isRunning = computed(() => state.value.isRunningRepeated);

const canRun = computed(() => {
  return (
    selectedProvider.value.providerId &&
    selectedProvider.value.model &&
    runCount.value > 0 &&
    props.testCase &&
    !isRunning.value
  );
});

const completedRuns = computed(() => state.value.completedRuns);
const progressPercentage = computed(() => {
  if (runCount.value === 0) return 0;
  return Math.round((completedRuns.value / runCount.value) * 100);
});

// Watch for test case changes
watch(
  () => props.testCase,
  () => {
    // Reset results when test case changes
    results.value = [];
  }
);

// Watch for completed runs
watch(
  () => state.value.repeatedResults,
  (newResults) => {
    results.value = [...newResults];
  }
);

// Watch for completion
watch(
  () => state.value.isRunningRepeated,
  (isRunning, wasRunning) => {
    if (wasRunning && !isRunning) {
      // Execution completed
      emit("completed", results.value);
    }
  }
);

// Action handlers
const startRun = async (): Promise<void> => {
  if (!canRun.value || !props.testCase) return;

  // Clear previous results
  results.value = [];

  // Create request
  const request: ProviderRequest = {
    model: selectedProvider.value.model,
    messages: [
      {
        role: "user" as const,
        content: props.testCase.prompt,
      },
    ],
    temperature: 0.7, // Default temperature (not exposed to user)
    maxTokens: maxTokens.value,
  };

  try {
    await runRepeated(selectedProvider.value.providerId, request, {
      runCount: runCount.value,
      allowParallel: allowParallel.value,
      parallelConcurrency: concurrency.value,
      delayMs: 0,
    });
  } catch (error) {
    console.error("Failed to start quick run:", error);
  }
};

const cancelRun = (): void => {
  cancelPromptRun();
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
      selectedProvider.value = { providerId: "", model: "" };
      runCount.value = DEFAULT_RUNS_COUNT;
      maxTokens.value = DEFAULT_MAX_TOKENS;
      allowParallel.value = false;
      concurrency.value = DEFAULT_CONCURRENCY;
      results.value = [];
    }
  },
  { immediate: true }
);

// Sync dialog close with parent
watch(
  () => dialogOpen.value,
  (isOpen) => {
    if (!isOpen && props.isOpen) {
      // Dialog was closed, emit close event
      emit("close");
    }
  }
);
</script>

<style scoped>
.quick-run-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 80vh;
  overflow-y: auto;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-card {
  margin-bottom: 0;
}

.config-card h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.global-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.runs-input {
  max-width: 200px;
}

.providers-card {
  margin-bottom: 0;
}

.providers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.providers-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.empty-providers {
  padding: 2rem 0;
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

.provider-options {
  margin-top: 1rem;
}

.options-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  align-items: end;
}

.parallel-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

.concurrency-input {
  max-width: 120px;
}

.progress-section {
  margin-top: 1rem;
}

.progress-card {
  margin-bottom: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.overall-progress {
  margin-bottom: 1.5rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.provider-progress h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.provider-progress-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.provider-progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.provider-name {
  font-weight: 500;
  color: #111827;
}

.provider-model {
  font-size: 0.875rem;
  color: #6b7280;
}

.provider-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.runs-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  min-width: 50px;
  text-align: right;
}

.provider-progress-bar {
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.provider-progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .global-config,
  .options-row {
    grid-template-columns: 1fr;
  }

  .parallel-config {
    flex-direction: column;
    align-items: flex-start;
  }

  .provider-progress-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .provider-stats {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
