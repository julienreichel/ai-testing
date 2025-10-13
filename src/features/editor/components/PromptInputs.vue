<template>
  <div class="prompt-inputs">
    <base-form class="prompt-form" :show-default-actions="false">
      <div class="prompt-section">
        <base-input-field
          :model-value="modelValue.systemPrompt"
          :label="$t('promptEditor.systemPrompt')"
          :placeholder="$t('promptEditor.systemPromptPlaceholder')"
          type="textarea"
          :rows="4"
          :disabled="isRunning"
          @update:model-value="updateSystemPrompt"
        />

        <div class="system-prompt-hint">
          <span class="hint-text">{{
            $t("promptEditor.systemPromptHint")
          }}</span>
        </div>
      </div>

      <div class="prompt-section">
        <base-input-field
          :model-value="modelValue.userPrompt"
          :label="$t('promptEditor.userPrompt')"
          :placeholder="$t('promptEditor.userPromptPlaceholder')"
          type="textarea"
          :rows="6"
          :disabled="isRunning"
          required
          @update:model-value="updateUserPrompt"
        />

        <div class="token-estimate" v-if="tokenEstimate">
          <span class="estimate-label">{{
            $t("promptEditor.estimatedTokens")
          }}</span>
          <span class="estimate-value">{{ tokenEstimate }}</span>
        </div>
      </div>

      <div class="parameters-section">
        <h4 class="section-title">{{ $t("promptEditor.parameters") }}</h4>

        <div class="parameters-grid">
          <base-input-field
            :model-value="modelValue.temperature"
            :label="$t('promptEditor.temperature')"
            type="number"
            :min="0"
            :max="2"
            :step="0.1"
            :disabled="isRunning"
            @update:model-value="updateTemperature"
          >
            <template #hint>
              <span class="parameter-hint">{{
                $t("promptEditor.temperatureHint")
              }}</span>
            </template>
          </base-input-field>

          <base-input-field
            :model-value="modelValue.maxTokens"
            :label="$t('promptEditor.maxTokens')"
            type="number"
            :min="1"
            :max="4096"
            :disabled="isRunning"
            @update:model-value="updateMaxTokens"
          >
            <template #hint>
              <span class="parameter-hint">{{
                $t("promptEditor.maxTokensHint")
              }}</span>
            </template>
          </base-input-field>
        </div>
      </div>
    </base-form>
  </div>
</template>

<script setup lang="ts">
import { BaseForm, BaseInputField } from "../../../components/ui";

export interface PromptInputData {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface PromptInputsProps {
  modelValue: PromptInputData;
  isRunning?: boolean;
  tokenEstimate?: string;
}

const props = withDefaults(defineProps<PromptInputsProps>(), {
  isRunning: false,
  tokenEstimate: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: PromptInputData];
}>();

const updateSystemPrompt = (value: string | number): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    systemPrompt: String(value),
  });
};

const updateUserPrompt = (value: string | number): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    userPrompt: String(value),
  });
};

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000;

const updateTemperature = (value: string | number): void => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  emit("update:modelValue", {
    ...props.modelValue,
    temperature: isNaN(numValue) ? DEFAULT_TEMPERATURE : numValue,
  });
};

const updateMaxTokens = (value: string | number): void => {
  const numValue = typeof value === "string" ? parseInt(value, 10) : value;
  emit("update:modelValue", {
    ...props.modelValue,
    maxTokens: isNaN(numValue) ? DEFAULT_MAX_TOKENS : numValue,
  });
};
</script>

<style scoped>
.prompt-inputs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.prompt-form {
  margin: 0;
}

.prompt-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.system-prompt-hint {
  margin-top: -0.25rem;
}

.hint-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.token-estimate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 4px;
  font-size: 0.875rem;
}

.estimate-label {
  color: #0369a1;
  font-weight: 500;
}

.estimate-value {
  color: #0c4a6e;
  font-weight: 600;
}

.parameters-section {
  margin-top: 1rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.parameters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.parameter-hint {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .parameters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
