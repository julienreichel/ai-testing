<!--
  Save Test Case Dialog
  Allows user to choose project and provide test case details
-->
<template>
  <base-dialog
    :model-value="modelValue"
    :title="props.isUpdateMode ? $t('testManagement.updateTestCase') : $t('testManagement.saveTestCase')"
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
        <base-input-field
          v-model="selectedProjectOption"
          :label="`${$t('testManagement.project')} *`"
          :placeholder="$t('testManagement.chooseProject')"
          type="select"
          :options="projectOptions"
          @update:model-value="onProjectSelectionChange"
        />
      </div>

      <!-- New Project Creation -->
      <div v-if="isCreatingNewProject" class="new-project-section">
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
        <template v-if="props.isUpdateMode">
          <!-- Update Mode: Show Update and Save as New options -->
          <base-button
            variant="primary"
            :disabled="!canSave || isSaving"
            :loading="isSaving && saveMode === 'update'"
            @click="handleSave('update')"
          >
            {{ $t('testManagement.updateTestCase') }}
          </base-button>
          <base-button
            variant="outline"
            :disabled="!canSave || isSaving"
            :loading="isSaving && saveMode === 'create'"
            @click="handleSave('create')"
          >
            {{ $t('testManagement.saveAsNewTestCase') }}
          </base-button>
        </template>
        <template v-else>
          <!-- Create Mode: Show regular save -->
          <base-button
            variant="primary"
            :disabled="!canSave || isSaving"
            :loading="isSaving"
            @click="handleSave('create')"
          >
            {{ $t("common.save") }}
          </base-button>
        </template>
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
import { testDB } from "../services/testManagementDatabase";
import { BaseDialog, BaseButton, BaseInputField } from "./ui";
import type { RuleSet } from "../types/rules";

const PROMPT_PREVIEW_LENGTH = 100;

interface Props {
  modelValue: boolean;
  prompt: string;
  rules: RuleSet[];
  existingTestCaseId?: string | null;
  isUpdateMode?: boolean;
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
const selectedProjectOption = ref<string>("");
const newProjectName = ref("");
const newProjectDescription = ref("");
const isSaving = ref(false);
const saveMode = ref<'update' | 'create'>('create');

// Special value to identify when creating a new project
const CREATE_NEW_PROJECT_VALUE = "__create_new__";

// Computed properties
const availableProjects = computed(() => testManager.projectTree.value || []);

const projectOptions = computed(() => {
  const options = availableProjects.value.map(project => ({
    label: project.name,
    value: project.id,
  }));

  // Add "Create new project" option at the end
  options.push({
    label: `+ Create New Project`,
    value: CREATE_NEW_PROJECT_VALUE,
  });

  return options;
});

const isCreatingNewProject = computed(() =>
  selectedProjectOption.value === CREATE_NEW_PROJECT_VALUE
);

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
    (selectedProjectOption.value !== "" && selectedProjectOption.value !== CREATE_NEW_PROJECT_VALUE) ||
    (isCreatingNewProject.value && newProjectName.value.trim() !== "");

  return hasTestCaseName && hasValidProject;
});

// Load existing test case data when in update mode
watch(() => [props.modelValue, props.existingTestCaseId, props.isUpdateMode], async ([isOpen, testCaseId, isUpdate]) => {
  if (isOpen && isUpdate && testCaseId && typeof testCaseId === 'string') {
    try {
      const testCase = await testDB.getTestCase(testCaseId);
      if (testCase) {
        testCaseName.value = testCase.name;
        testCaseDescription.value = testCase.description || '';
        // Note: project and rules are already handled by EditorView prefilling
      }
    } catch (error) {
      console.error('Failed to load test case for dialog:', error);
    }
  }
}, { immediate: true });

// Methods
const onProjectSelectionChange = (value: string | number): void => {
  selectedProjectOption.value = String(value);
  // Reset new project fields when switching away from create new
  if (selectedProjectOption.value !== CREATE_NEW_PROJECT_VALUE) {
    newProjectName.value = "";
    newProjectDescription.value = "";
  }
};

const handleSave = async (mode: 'update' | 'create' = 'create'): Promise<void> => {
  if (!canSave.value) return;

  try {
    saveMode.value = mode;
    isSaving.value = true;

    let projectId = selectedProjectOption.value;

    // Create new project if needed
    if (isCreatingNewProject.value) {
      const newProject = await testManager.createProject({
        name: newProjectName.value.trim(),
        description: newProjectDescription.value.trim() || undefined,
      });
      projectId = newProject.id;
    }

    // Ensure we have a project selected
    if (projectId && projectId !== CREATE_NEW_PROJECT_VALUE) {
      await testManager.selectProject(projectId);
    }

    // Prepare test case data - serialize rules to avoid DataCloneError
    const serializedRules = JSON.parse(JSON.stringify(props.rules));

    const testCaseData = {
      name: testCaseName.value.trim(),
      description: testCaseDescription.value.trim() || undefined,
      prompt: props.prompt,
      rules: serializedRules,
      tags: [] as string[], // No provider-specific tags as requested
    };

    let testCaseId: string;
    if (mode === 'update' && props.existingTestCaseId) {
      // Update existing test case
      await testManager.updateTestCase(props.existingTestCaseId, testCaseData);
      testCaseId = props.existingTestCaseId;
    } else {
      // Create new test case
      const testCase = await testManager.createTestCase(testCaseData);
      testCaseId = testCase.id;
    }

    emit("saved", testCaseId);
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
  selectedProjectOption.value = "";
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
