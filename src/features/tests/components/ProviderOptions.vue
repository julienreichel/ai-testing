<template>
  <div class="provider-options">
    <div class="options-row">
      <!-- Max Tokens Input -->
      <base-input-field
        :model-value="config.maxTokens"
        :label="$t('promptEditor.maxTokens')"
        type="number"
        :min="MIN_TOKENS"
        :max="MAX_TOKENS"
        :disabled="isDisabled"
        @update:model-value="updateMaxTokens"
      />

      <!-- Parallel Toggle (conditionally shown) -->
      <div v-if="showParallel" class="parallel-toggle">
        <input
          :id="parallelCheckboxId"
          :checked="config.allowParallel"
          type="checkbox"
          :disabled="isDisabled"
          class="parallel-checkbox"
          @change="toggleParallel"
        />
        <label :for="parallelCheckboxId" class="parallel-label">
          {{ $t("quickRun.enableParallel") }}
        </label>
      </div>

      <!-- Concurrency Input (shown when parallel is enabled) -->
      <base-input-field
        v-if="showParallel && config.allowParallel"
        :model-value="config.parallelConcurrency"
        :label="$t('quickRun.concurrency')"
        type="number"
        :min="MIN_CONCURRENCY"
        :max="MAX_CONCURRENCY"
        :disabled="isDisabled"
        class="concurrency-input"
        @update:model-value="updateConcurrency"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { BaseInputField } from "@/components/ui";

interface ProviderConfig {
  id: string;
  maxTokens: number;
  allowParallel: boolean;
  parallelConcurrency: number;
}

interface Props {
  config: ProviderConfig;
  isDisabled?: boolean;
  showParallel?: boolean;
}

interface Emits {
  (event: 'update:config', field: keyof ProviderConfig, value: unknown): void;
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false,
  showParallel: false,
});

const emit = defineEmits<Emits>();

// Constants
const MIN_TOKENS = 1;
const MAX_TOKENS = 32000;
const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 10;

// Computed
const parallelCheckboxId = computed(() => `parallel-${props.config.id}`);

// Methods
const updateMaxTokens = (value: string | number): void => {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!isNaN(numValue)) {
    emit('update:config', 'maxTokens', numValue);
  }
};

const toggleParallel = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  emit('update:config', 'allowParallel', target.checked);
};

const updateConcurrency = (value: string | number): void => {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!isNaN(numValue)) {
    emit('update:config', 'parallelConcurrency', numValue);
  }
};
</script>

<style scoped>
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
  padding: 0.5rem 0;
}

.parallel-checkbox {
  width: 1rem;
  height: 1rem;
}

.parallel-label {
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
}

.concurrency-input {
  max-width: 120px;
}

/* Responsive grid adjustments */
@media (max-width: 768px) {
  .options-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .parallel-toggle {
    justify-content: center;
  }
}
</style>
