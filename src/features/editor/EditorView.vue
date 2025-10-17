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

      <!-- Rules Section - After Results -->
      <div class="rules-section">
        <h3>Output Validation Rules</h3>
        <rules-editor-compact
          v-model:rule-set="validationRules"
          :test-data="promptRunner.state.value.result?.content"
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
            variant="primary"
            :disabled="!canRunBatch"
            @click="toggleBatchRunner"
          >
            {{
              showBatchRunner
                ? $t("promptEditor.hideBatch")
                : $t("promptEditor.showBatch")
            }}
          </base-button>
        </div>
      </div>

      <!-- Batch Runner Section -->
      <div v-if="showBatchRunner" class="batch-runner-section">
        <batch-runner
          :test-case="testCaseForBatch"
          :provider-id="providerSelection.providerId"
          :model="providerSelection.model"
          :disabled="!canRunBatch"
          @batch-started="onBatchStarted"
          @batch-completed="onBatchCompleted"
          @batch-cancelled="onBatchCancelled"
          @export-results="onExportResults"
        />
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
    </div>

    <save-test-case-dialog
      v-model="showSaveDialog"
      :prompt="promptData.userPrompt"
      :rules="validationRules.rules.length > 0 ? [validationRules] : []"
      :existing-test-case-id="currentTestCaseId"
      :is-update-mode="isUpdateMode"
      @saved="onTestCaseSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useProvidersStore } from "../../store/providers";
import { usePromptRunner } from "../../composables/usePromptRunner";
import { BaseButton, BaseInputField } from "../../components/ui";
import { ProviderSelector, ResultsDisplay } from "./components";
import RulesEditorCompact from "./components/RulesEditorCompact.vue";
import SaveTestCaseDialog from "./components/SaveTestCaseDialog.vue";
import BatchRunner from "./components/BatchRunner.vue";
import { useRulesUtils } from "../../composables/useRulesUtils";
import { useRulesEngine } from "../../composables/useRulesEngine";
import { testDB } from "../../services/testManagementDatabase";
import type { ProviderSelection } from "./components/ProviderSelector.vue";
import type { RuleSet, RuleSetResult } from "../../types/rules";
import type { TestCase } from "../../types/testManagement";
import type { BatchRunResult } from "../../composables/useBatchRunner";

interface PromptData {
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

const router = useRouter();
const route = useRoute();
const providersStore = useProvidersStore();
const { createRuleSet } = useRulesUtils();

// Component state
const providerSelection = ref<ProviderSelection>({
  providerId: "",
  model: "",
});

const promptData = ref<PromptData>({
  userPrompt: "",
  temperature: 0.7,
  maxTokens: 4096,
});

// Rules state
const validationRules = ref<RuleSet>(createRuleSet());
const validationResult = ref<RuleSetResult | null>(null);

// Dialog state
const showSaveDialog = ref(false);

// Batch runner state
const showBatchRunner = ref(false);

// Current test case state (for update functionality)
const currentTestCaseId = ref<string | null>(null);
const currentTestCase = ref<TestCase | null>(null);
const isUpdateMode = computed(() => !!currentTestCaseId.value);

// Composables
const promptRunner = usePromptRunner();
const rulesEngine = useRulesEngine();

// Computed properties
const canRunPrompt = computed(() => {
  return (
    promptRunner.canRun.value &&
    providerSelection.value.providerId &&
    providerSelection.value.model &&
    promptData.value.userPrompt.trim() !== ""
  );
});

const canRunBatch = computed(() => {
  return (
    canRunPrompt.value &&
    validationRules.value.rules.length > 0 &&
    !promptRunner.state.value.isRunning
  );
});

const testCaseForBatch = computed((): TestCase => {
  return {
    id: currentTestCaseId.value || crypto.randomUUID(),
    projectId: currentTestCase.value?.projectId || "editor-batch",
    name: currentTestCase.value?.name || "Editor Batch Test",
    description:
      currentTestCase.value?.description || "Batch test created from editor",
    prompt: promptData.value.userPrompt,
    rules:
      validationRules.value.rules.length > 0 ? [validationRules.value] : [],
    tags: currentTestCase.value?.tags || [],
    createdAt: currentTestCase.value?.createdAt || new Date(),
    updatedAt: new Date(),
  };
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
    validationResult.value = rulesEngine.validateRuleSet(
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
    maxTokens: 4096,
  };
  promptRunner.clearResults();
  validationResult.value = null;
};

const saveAsTestCase = (): void => {
  // Show the save dialog
  showSaveDialog.value = true;
};

const onTestCaseSaved = (testCaseId: string): void => {
  console.log("Test case saved successfully:", testCaseId);

  // Show success notification
  // Using setTimeout to ensure the dialog closes first
  const NOTIFICATION_DELAY = 100; // ms
  setTimeout(() => {
    const proceed = confirm(
      "Test case saved successfully!\n\nWould you like to navigate to the Tests page to view it?",
    );

    if (proceed) {
      void router.push({
        path: "/tests",
        query: { selectedTestCase: testCaseId },
      });
    }
  }, NOTIFICATION_DELAY);
};

// Batch runner methods
const toggleBatchRunner = (): void => {
  showBatchRunner.value = !showBatchRunner.value;
};

const onBatchStarted = (): void => {
  console.log("Batch execution started");
};

const onBatchCompleted = (results: BatchRunResult[]): void => {
  console.log("Batch execution completed", results);
  // Could show a success notification here
};

const onBatchCancelled = (): void => {
  console.log("Batch execution cancelled");
};

const onExportResults = (results: BatchRunResult[]): void => {
  console.log("Exporting batch results", results);
  // TODO: Implement CSV export or similar
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "Run,Status,Duration,Cost,Passed,Response\n" +
    results
      .map(
        (r) =>
          `${r.runIndex},${r.status},${r.duration || 0},${r.cost || 0},${r.passed},${r.response?.replace(/,/g, ";") || ""}`,
      )
      .join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "batch_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Initialize providers and handle test case prefilling on mount
onMounted(async () => {
  providersStore.initialize();

  // Check if there's a test case ID in the query parameters for prefilling
  const testCaseId = route.query.testCaseId as string;
  if (!testCaseId) return;

  try {
    const testCase = await testDB.getTestCase(testCaseId);
    if (!testCase) return;

    // Set current test case ID and full test case for update mode
    currentTestCaseId.value = testCaseId;
    currentTestCase.value = testCase;

    // Prefill the prompt
    promptData.value.userPrompt = testCase.prompt;

    // Prefill the rules if they exist
    if (!testCase.rules || testCase.rules.length === 0) return;

    const firstRuleSet = testCase.rules[0];
    if (!firstRuleSet) return;

    validationRules.value = {
      id: firstRuleSet.id || crypto.randomUUID(),
      rules: firstRuleSet.rules || [],
      aggregation: firstRuleSet.aggregation || "AND",
    };
  } catch (error) {
    console.error("Failed to load test case for prefilling:", error);
  }
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
  color: #000;
}

.batch-runner-section {
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
