<!--
  Save Test Case Dialog
  Allows user to choose project and provide test case details
-->
<template>
  <base-dialog
    :model-value="modelValue"
    :title="$t('testManagement.saveTestCase')"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="save-test-case-dialog">
      <!-- Test Case Name -->
      <div class="form-group">
        <label for="testCaseName"
          >{{ $t("testManagement.testCaseName") }} *</label
        >
        <base-input-field
          id="testCaseName"
          v-model="testCaseName"
          :placeholder="$t('testManagement.enterTestCaseName')"
          required
        />
      </div>

      <!-- Test Case Description -->
      <div class="form-group">
        <label for="testCaseDescription">{{
          $t("testManagement.description")
        }}</label>
        <base-input-field
          id="testCaseDescription"
          v-model="testCaseDescription"
          :placeholder="$t('testManagement.enterDescription')"
          type="textarea"
          :rows="3"
        />
      </div>

      <!-- Project Selection -->
      <div class="form-group">
        <label for="projectSelection"
          >{{ $t("testManagement.project") }} *</label
        >
        <div class="project-selection-wrapper">
          <select
            id="projectSelection"
            v-model="selectedProjectMode"
            class="project-mode-select"
            @change="onProjectModeChange"
          >
            <option value="">{{ $t("testManagement.chooseOption") }}</option>
            <option v-if="availableProjects.length > 0" value="existing">
              {{ $t("testManagement.useExistingProject") }}
            </option>
            <option value="new">
              {{ $t("testManagement.createNewProject") }}
            </option>
          </select>
        </div>
      </div>

      <!-- Existing Project Selection -->
      <div v-if="selectedProjectMode === 'existing'" class="form-group">
        <label for="existingProject">{{
          $t("testManagement.selectExistingProject")
        }}</label>
        <select
          id="existingProject"
          v-model="selectedProjectId"
          class="project-select"
        >
          <option value="">{{ $t("testManagement.chooseProject") }}</option>
          <option
            v-for="project in availableProjects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </div>

      <!-- New Project Creation -->
      <div v-if="selectedProjectMode === 'new'" class="new-project-section">
        <div class="form-group">
          <label for="newProjectName"
            >{{ $t("testManagement.projectName") }} *</label
          >
          <base-input-field
            id="newProjectName"
            v-model="newProjectName"
            :placeholder="$t('testManagement.enterProjectName')"
            required
          />
        </div>
        <div class="form-group">
          <label for="newProjectDescription">{{
            $t("testManagement.projectDescription")
          }}</label>
          <base-input-field
            id="newProjectDescription"
            v-model="newProjectDescription"
            :placeholder="$t('testManagement.enterProjectDescription')"
            type="textarea"
            :rows="2"
          />
        </div>
      </div>

      <!-- Prompt Preview -->
      <div class="form-group">
        <label>{{ $t("testManagement.promptPreview") }}</label>
        <div class="prompt-preview">
          {{ promptPreview }}
        </div>
      </div>

      <!-- Rules Preview -->
      <div v-if="hasRules" class="form-group">
        <label>{{ $t("testManagement.validationRules") }}</label>
        <div class="rules-preview">
          {{ $t("testManagement.rulesCount", { count: rulesCount }) }}
        </div>
      </div>

      <!-- Dialog Actions -->
      <div class="dialog-actions">
        <base-button
          variant="primary"
          :disabled="!canSave || isSaving"
          :loading="isSaving"
          @click="handleSave"
        >
          {{ $t("common.save") }}
        </base-button>
        <base-button variant="outline" @click="handleCancel">
          {{ $t("common.cancel") }}
        </base-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTestManagement } from "../composables/useTestManagement";
import { BaseDialog, BaseButton, BaseInputField } from "./ui";
import type { RuleSet } from "../types/rules";

const PROMPT_PREVIEW_LENGTH = 100;

interface Props {
  modelValue: boolean;
  prompt: string;
  rules: RuleSet[];
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "saved", testCaseId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Test Management composable
const testManager = useTestManagement();

// Form state
const testCaseName = ref("");
const testCaseDescription = ref("");
const selectedProjectMode = ref<"existing" | "new" | "">("");
const selectedProjectId = ref("");
const newProjectName = ref("");
const newProjectDescription = ref("");
const isSaving = ref(false);

// Computed properties
const availableProjects = computed(() => testManager.projectTree.value || []);
const hasRules = computed(() => props.rules.length > 0);
const rulesCount = computed(() =>
  props.rules.reduce((count, ruleSet) => count + ruleSet.rules.length, 0),
);

const promptPreview = computed(() => {
  if (props.prompt.length <= PROMPT_PREVIEW_LENGTH) {
    return props.prompt;
  }
  return `${props.prompt.substring(0, PROMPT_PREVIEW_LENGTH)}...`;
});

const canSave = computed(() => {
  const hasTestCaseName = testCaseName.value.trim() !== "";
  const hasValidProject =
    (selectedProjectMode.value === "existing" &&
      selectedProjectId.value !== "") ||
    (selectedProjectMode.value === "new" && newProjectName.value.trim() !== "");

  return hasTestCaseName && hasValidProject;
});

// Methods
const onProjectModeChange = (): void => {
  // Reset project-specific selections when mode changes
  selectedProjectId.value = "";
  newProjectName.value = "";
  newProjectDescription.value = "";
};

const handleSave = async (): Promise<void> => {
  if (!canSave.value) return;

  try {
    isSaving.value = true;

    let projectId = selectedProjectId.value;

    // Create new project if needed
    if (selectedProjectMode.value === "new") {
      const newProject = await testManager.createProject({
        name: newProjectName.value.trim(),
        description: newProjectDescription.value.trim() || undefined,
      });
      projectId = newProject.id;
    }

    // Ensure we have a project selected
    if (projectId) {
      await testManager.selectProject(projectId);
    }

    // Create the test case - serialize rules to avoid DataCloneError
    // Use JSON serialization to ensure complete removal of Vue reactivity
    const serializedRules = JSON.parse(JSON.stringify(props.rules));

    const testCaseData = {
      name: testCaseName.value.trim(),
      description: testCaseDescription.value.trim() || undefined,
      prompt: props.prompt,
      rules: serializedRules,
      tags: [] as string[], // No provider-specific tags as requested
    };

    const testCase = await testManager.createTestCase(testCaseData);

    emit("saved", testCase.id);
    handleCancel();
  } catch (error) {
    console.error("Failed to save test case:", error);

    // Provide user-friendly error message
    let errorMessage = "Failed to save test case";
    if (error instanceof Error) {
      if (error.message.includes("DataCloneError")) {
        errorMessage = "Unable to save: Data contains unsupported format";
      } else if (error.message.includes("QuotaExceededError")) {
        errorMessage = "Unable to save: Storage quota exceeded";
      } else {
        errorMessage = `Failed to save: ${error.message}`;
      }
    }

    alert(errorMessage); // TODO: Replace with proper toast notification
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = (): void => {
  emit("update:modelValue", false);
  // Reset form
  resetForm();
};

const resetForm = (): void => {
  testCaseName.value = "";
  testCaseDescription.value = "";
  selectedProjectMode.value = "";
  selectedProjectId.value = "";
  newProjectName.value = "";
  newProjectDescription.value = "";
};

// Initialize default test case name when dialog opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      testCaseName.value = `Test Case - ${new Date().toLocaleString()}`;
    }
  },
);
</script>

<style scoped>
.save-test-case-dialog {
  min-width: 500px;
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.project-selection-wrapper {
  margin-bottom: 0.5rem;
}

.project-mode-select,
.project-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.project-mode-select:focus,
.project-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.new-project-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.prompt-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.75rem;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.8rem;
  color: #4b5563;
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

.rules-preview {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #92400e;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SaveTestCaseDialog",
});
</script>
