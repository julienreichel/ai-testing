<template>
  <div class="provider-run-config">
    <div class="config-section">
      <h4 class="config-title">{{ $t("promptEditor.runConfiguration") }}</h4>

      <div class="config-grid">
        <!-- Number of Runs -->
        <base-input-field
          :model-value="modelValue.runCount"
          :label="$t('promptEditor.numberOfRuns')"
          type="number"
          :min="1"
          :max="50"
          :disabled="disabled"
          @update:model-value="updateRunCount"
        />

        <!-- Parallel Execution Checkbox -->
        <div class="checkbox-field">
          <label class="checkbox-label">
            <input
              :checked="modelValue.allowParallel"
              type="checkbox"
              :disabled="disabled || !canUseParallel"
              @change="updateAllowParallel"
            />
            <span class="checkbox-text">
              {{ $t("promptEditor.runInParallel") }}
            </span>
          </label>
          <div v-if="!canUseParallel" class="checkbox-help">
            {{ $t("promptEditor.parallelRequiresMultipleRuns") }}
          </div>
        </div>

        <!-- Concurrency Level -->
        <base-input-field
          :model-value="modelValue.parallelConcurrency"
          :label="$t('promptEditor.concurrency')"
          type="select"
          :options="concurrencyOptions"
          :disabled="disabled || !modelValue.allowParallel"
          @update:model-value="updateConcurrency"
        />

        <!-- Delay Between Runs (only for sequential) -->
        <base-input-field
          v-if="!modelValue.allowParallel"
          :model-value="modelValue.delayMs"
          :label="$t('promptEditor.delayBetweenRuns')"
          :placeholder="$t('promptEditor.delayPlaceholder')"
          type="number"
          :min="0"
          :max="10000"
          :disabled="disabled"
          @update:model-value="updateDelay"
        />
      </div>

      <!-- Info Panel -->
      <div class="config-info">
        <div v-if="modelValue.allowParallel && modelValue.runCount > 1" class="info-panel parallel">
          <span class="info-icon">⚡</span>
          <div class="info-content">
            <div class="info-title">{{ $t("promptEditor.parallelExecution") }}</div>
            <div class="info-text">
              {{ $t("promptEditor.parallelInfo", {
                runs: modelValue.runCount,
                concurrency: modelValue.parallelConcurrency
              }) }}
            </div>
          </div>
        </div>

        <div v-else-if="modelValue.runCount > 1" class="info-panel sequential">
          <span class="info-icon">📋</span>
          <div class="info-content">
            <div class="info-title">{{ $t("promptEditor.sequentialExecution") }}</div>
            <div class="info-text">
              {{ $t("promptEditor.sequentialInfo", {
                runs: modelValue.runCount,
                delay: modelValue.delayMs
              }) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { BaseInputField } from "../../../components/ui";

export interface RunConfiguration {
  runCount: number;
  allowParallel: boolean;
  parallelConcurrency: number;
  delayMs: number;
}

interface ProviderRunConfigRowProps {
  modelValue: RunConfiguration;
  disabled?: boolean;
}

const props = withDefaults(defineProps<ProviderRunConfigRowProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: RunConfiguration];
}>();

// Constants to avoid magic numbers
const MIN_RUNS_FOR_PARALLEL = 2;
const DEFAULT_DELAY_MS = 1000;

// Computed properties
const canUseParallel = computed(() => {
  return props.modelValue.runCount >= MIN_RUNS_FOR_PARALLEL;
});

const concurrencyOptions = computed(() => [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
]);

// Update methods
const updateRunCount = (value: string | number): void => {
  const runCount = Math.max(1, Number(value));
  const updatedConfig = { ...props.modelValue, runCount };

  // Auto-disable parallel if run count is too low
  if (runCount < MIN_RUNS_FOR_PARALLEL) {
    updatedConfig.allowParallel = false;
  }

  emit("update:modelValue", updatedConfig);
};

const updateAllowParallel = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", {
    ...props.modelValue,
    allowParallel: target.checked,
  });
};

const updateConcurrency = (value: string | number): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    parallelConcurrency: Number(value),
  });
};

const updateDelay = (value: string | number): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    delayMs: Math.max(0, Number(value) || DEFAULT_DELAY_MS),
  });
};
</script>

<style scoped>
.provider-run-config {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.config-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

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
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
}

.checkbox-label input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.checkbox-help {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.config-info {
  margin-top: 1rem;
}

.info-panel {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid;
}

.info-panel.parallel {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.info-panel.sequential {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.info-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.info-text {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .provider-run-config {
    padding: 1rem;
  }
}</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ProviderRunConfigRow",
});
</script>
