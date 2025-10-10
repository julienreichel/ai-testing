<template>
  <div class="prompt-editor">
    <div class="editor-header">
      <h1>{{ $t("promptEditor.title") }}</h1>
    </div>

    <div class="editor-content">
      <div class="editor-sidebar">
        <!-- Provider Selection -->
        <div class="editor-section">
          <provider-selector
            v-model="providerSelection"
            :is-running="promptRunner.state.value.isRunning"
          />
        </div>

        <!-- Prompt Inputs -->
        <div class="editor-section">
          <prompt-inputs
            v-model="promptData"
            :is-running="promptRunner.state.value.isRunning"
            :token-estimate="costEstimator.formattedCost.value"
          />
        </div>

        <!-- Actions -->
        <div class="editor-section">
          <div class="action-buttons">
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

          <!-- Cost Estimate -->
          <div v-if="costEstimator.canEstimate.value" class="cost-estimate">
            <div class="estimate-card">
              <div class="estimate-header">
                <span class="estimate-title">{{
                  $t("promptEditor.estimatedTokens")
                }}</span>
                <span class="estimate-cost">{{
                  costEstimator.formattedCost.value
                }}</span>
              </div>
              <div class="estimate-details">
                <span class="detail-item">
                  Input: {{ costEstimator.estimatedInputTokens.value }}
                </span>
                <span class="detail-item">
                  Output: ~{{ costEstimator.estimatedOutputTokens.value }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="editor-main">
        <results-display
          :result="promptRunner.state.value.result"
          :error="promptRunner.state.value.error"
          :is-running="promptRunner.state.value.isRunning"
          @cancel="promptRunner.cancelRun"
          @retry="runPrompt"
          @clear-results="promptRunner.clearResults"
          @save-as-test="saveAsTestCase"
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
import { useCostEstimator } from "../../composables/useCostEstimator";
import { BaseButton } from "../../components/ui";
import { ProviderSelector, PromptInputs, ResultsDisplay } from "./components";
import type { ProviderSelection } from "./components/ProviderSelector.vue";
import type { PromptInputData } from "./components/PromptInputs.vue";

const router = useRouter();
const providersStore = useProvidersStore();

// Component state
const providerSelection = ref<ProviderSelection>({
  providerId: "",
  model: "",
});

const promptData = ref<PromptInputData>({
  systemPrompt: "",
  userPrompt: "",
  temperature: 0.7,
  maxTokens: 150,
});

// Composables
const promptRunner = usePromptRunner();

const costEstimator = useCostEstimator({
  systemPrompt: computed(() => promptData.value.systemPrompt),
  userPrompt: computed(() => promptData.value.userPrompt),
  providerId: computed(() => providerSelection.value.providerId),
  model: computed(() => providerSelection.value.model),
  maxTokens: computed(() => promptData.value.maxTokens),
});

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
const runPrompt = async (): Promise<void> => {
  if (!canRunPrompt.value) return;

  const messages = [];

  if (promptData.value.systemPrompt.trim()) {
    messages.push({
      role: "system" as const,
      content: promptData.value.systemPrompt.trim(),
    });
  }

  messages.push({
    role: "user" as const,
    content: promptData.value.userPrompt.trim(),
  });

  const request = {
    model: providerSelection.value.model,
    messages,
    temperature: promptData.value.temperature,
    maxTokens: promptData.value.maxTokens,
  };

  await promptRunner.runPrompt(providerSelection.value.providerId, request);
};

const clearAll = (): void => {
  promptData.value = {
    systemPrompt: "",
    userPrompt: "",
    temperature: 0.7,
    maxTokens: 150,
  };
  promptRunner.clearResults();
};

const saveAsTestCase = (): void => {
  // Navigate to test case creation with current data
  const queryParams = {
    systemPrompt: promptData.value.systemPrompt,
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
  min-height: 100vh;
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
  display: grid;
  grid-template-columns: 800px 1fr;
  gap: 2rem;
  min-height: 600px;
}

.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.editor-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.editor-main {
  display: flex;
  flex-direction: column;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.cost-estimate {
  margin-top: 1rem;
}

.estimate-card {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 6px;
  padding: 1rem;
}

.estimate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.estimate-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0369a1;
}

.estimate-cost {
  font-size: 1rem;
  font-weight: 700;
  color: #0c4a6e;
}

.estimate-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #0369a1;
}

.detail-item {
  opacity: 0.8;
}

@media (max-width: 1920px) {
  .editor-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .editor-sidebar {
    order: 2;
  }

  .editor-main {
    order: 1;
  }
}

@media (max-width: 768px) {
  .prompt-editor {
    padding: 1rem;
  }

  .editor-header h1 {
    font-size: 2rem;
  }

  .editor-section {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
