<template>
  <div class="prompt-editor">
    <div class="editor-header">
      <h1>{{ $t("promptEditor.title") }}</h1>
    </div>

    <div class="editor-content">
      <!-- User Prompt Section -->
      <div class="prompt-section">
        <base-input-field
          :model-value="promptData.userPrompt"
          :label="$t('promptEditor.userPrompt')"
          :placeholder="$t('promptEditor.enterPrompt')"
          type="textarea"
          :rows="4"
          :disabled="promptRunner.state.value.isRunning"
          @update:model-value="updateUserPrompt"
        />
      </div>

      <!-- Provider and Run Section -->
      <div class="provider-run-section">
        <div class="provider-controls">
          <provider-selector
            v-model="providerSelection"
            :is-running="promptRunner.state.value.isRunning"
          />
        </div>

        <div class="run-controls">
          <base-button
            variant="primary"
            :disabled="!canRunPrompt"
            :loading="promptRunner.state.value.isRunning"
            @click="runPrompt"
          >
            {{ $t("promptEditor.runOnce") }}
          </base-button>

          <base-button
            variant="outline"
            :disabled="promptRunner.state.value.isRunning"
            @click="clearAll"
          >
            {{ $t("promptEditor.clear") }}
          </base-button>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section">
        <results-display
          :result="promptRunner.state.value.result"
          :error="promptRunner.state.value.error"
          :is-running="promptRunner.state.value.isRunning"
          :validation-result="validationResult"
          @cancel="promptRunner.cancelRun"
          @retry="runPrompt"
          @clear-results="promptRunner.clearResults"
          @save-as-test="saveAsTestCase"
        />
      </div>

      <!-- Rules Section - After Results -->
      <div
        v-if="promptRunner.state.value.result?.content"
        class="rules-section"
      >
        <h3>Output Validation Rules</h3>
        <rules-editor-compact
          v-model:rule-set="validationRules"
          :test-data="promptRunner.state.value.result.content"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProvidersStore } from "../../store/providers";
import { usePromptRunner } from "../../composables/usePromptRunner";
import { BaseButton, BaseInputField } from "../../components/ui";
import { ProviderSelector, ResultsDisplay } from "./components";
import RulesEditorCompact from "./components/RulesEditorCompact.vue";
import { createRuleSet } from "../../utils/rulesUtils";
import { RuleEngine } from "../../utils/rulesEngine";
import type { ProviderSelection } from "./components/ProviderSelector.vue";
import type { RuleSet, RuleSetResult } from "../../types/rules";

interface PromptData {
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

const router = useRouter();
const providersStore = useProvidersStore();

// Component state
const providerSelection = ref<ProviderSelection>({
  providerId: "",
  model: "",
});

const promptData = ref<PromptData>({
  userPrompt: "",
  temperature: 0.7,
  maxTokens: 150,
});

// Rules state
const validationRules = ref<RuleSet>(createRuleSet());
const validationResult = ref<RuleSetResult | null>(null);

// Composables
const promptRunner = usePromptRunner();

// Computed properties
const canRunPrompt = computed(() => {
  return (
    promptRunner.canRun.value &&
    providerSelection.value.providerId &&
    providerSelection.value.model &&
    promptData.value.userPrompt.trim() !== ""
  );
});

// Methods
const updateUserPrompt = (value: string | number): void => {
  promptData.value.userPrompt = String(value);
};

const runPrompt = async (): Promise<void> => {
  if (!canRunPrompt.value) return;

  const messages = [
    {
      role: "user" as const,
      content: promptData.value.userPrompt.trim(),
    },
  ];

  const request = {
    model: providerSelection.value.model,
    messages,
    temperature: promptData.value.temperature,
    maxTokens: promptData.value.maxTokens,
  };

  await promptRunner.runPrompt(providerSelection.value.providerId, request);

  // Run rule validation if we have a successful result
  const result = promptRunner.state.value.result;
  if (result && result.content && validationRules.value.rules.length > 0) {
    validationResult.value = RuleEngine.validateRuleSet(
      validationRules.value,
      result.content,
    );
  } else {
    validationResult.value = null;
  }
};

const clearAll = (): void => {
  promptData.value = {
    userPrompt: "",
    temperature: 0.7,
    maxTokens: 150,
  };
  promptRunner.clearResults();
  validationResult.value = null;
};

const saveAsTestCase = (): void => {
  // Navigate to test case creation with current data
  const queryParams = {
    userPrompt: promptData.value.userPrompt,
    temperature: promptData.value.temperature.toString(),
    maxTokens: promptData.value.maxTokens.toString(),
    providerId: providerSelection.value.providerId,
    model: providerSelection.value.model,
  };

  void router.push({
    path: "/tests/create",
    query: queryParams,
  });
};

// Initialize providers on mount
onMounted(() => {
  providersStore.initialize();
});
</script>

<style scoped>
.prompt-editor {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.editor-header {
  margin-bottom: 2rem;
}

.editor-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 90vh;
  overflow-y: auto;
}

.prompt-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.provider-run-section {
  display: flex;
  align-items: end;
  gap: 2rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.provider-controls {
  flex: 1;
}

.run-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.rules-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.results-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  min-height: 300px;
}

@media (max-width: 768px) {
  .prompt-editor {
    padding: 1rem;
  }

  .editor-header h1 {
    font-size: 2rem;
  }

  .provider-run-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .run-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
