<template>
  <div class="provider-options">
    <div class="options-row">
      <!-- Max Tokens Input -->
      <base-input-field
        :model-value="maxTokensValue"
        :label="$t('promptEditor.maxTokens')"
        type="number"
        :min="resolvedOptions.maxTokensMin"
        :max="resolvedOptions.maxTokensMax"
        :disabled="isDisabled"
        @update:model-value="handleMaxTokensChange"
      />

      <!-- Parallel Toggle (conditionally shown) -->
      <div v-if="shouldShowParallelToggle" class="parallel-toggle">
        <input
          :id="parallelCheckboxId"
          :checked="parallelEnabled"
          type="checkbox"
          :disabled="isDisabled"
          class="parallel-checkbox"
          @change="handleParallelToggle"
        />
        <label :for="parallelCheckboxId" class="parallel-label">
          {{ $t("quickRun.enableParallel") }}
        </label>
      </div>

      <!-- Concurrency Input (conditionally shown) -->
      <base-input-field
        v-if="shouldShowConcurrencyInput"
        :model-value="concurrencyValue"
        :label="$t('quickRun.concurrency')"
        type="number"
        :min="resolvedOptions.concurrencyMin"
        :max="resolvedOptions.concurrencyMax"
        :disabled="isDisabled"
        class="concurrency-input"
        @update:model-value="handleConcurrencyChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseInputField } from "@/components/ui";
import { useProviderOptions } from "@/composables/useProviderOptions";
import type {
  ProviderOptionsProps,
  ProviderOptionsEmits
} from "@/composables/useProviderOptions";

const props = withDefaults(defineProps<ProviderOptionsProps>(), {
  isDisabled: false,
  options: () => ({}),
});

const emit = defineEmits<ProviderOptionsEmits>();

// Use the composable
const {
  resolvedOptions,
  maxTokensValue,
  parallelEnabled,
  concurrencyValue,
  shouldShowParallelToggle,
  shouldShowConcurrencyInput,
  parallelCheckboxId,
  handleMaxTokensChange,
  handleParallelToggle,
  handleConcurrencyChange,
} = useProviderOptions(props, emit);
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
