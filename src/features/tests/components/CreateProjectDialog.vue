<template>
  <base-dialog
    v-model="isVisible"
    title="Create New Project"
    size="md"
  >
    <div class="create-project-form">
      <div class="form-group">
        <label for="projectName">{{ $t("testManagement.projectName") }} *</label>
        <base-input-field
          id="projectName"
          v-model="projectName"
          :placeholder="$t('testManagement.projectNamePlaceholder')"
          required
        />
      </div>
      <div class="form-group">
        <label for="projectDescription">{{ $t("testManagement.projectDescription") }}</label>
        <base-input-field
          id="projectDescription"
          v-model="projectDescription"
          :placeholder="$t('testManagement.projectDescriptionPlaceholder')"
          type="textarea"
          :rows="3"
        />
      </div>
      <div class="dialog-actions">
        <base-button
          variant="primary"
          :disabled="!projectName.trim() || isLoading"
          :loading="isLoading"
          @click="handleCreate"
        >
          {{ $t("testManagement.createProject") }}
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
import { BaseButton, BaseInputField, BaseDialog } from "../../../components/ui";

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "create", data: { name: string; description?: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Form state
const projectName = ref("");
const projectDescription = ref("");
const isLoading = ref(false);

// Computed visibility
const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

// Form handlers
const handleCreate = async (): Promise<void> => {
  if (!projectName.value.trim()) return;

  isLoading.value = true;

  try {
    emit("create", {
      name: projectName.value.trim(),
      description: projectDescription.value.trim() || undefined,
    });

    // Don't close the dialog here - let the parent handle success/error
    // and close the dialog after successful creation
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = (): void => {
  isVisible.value = false;
};

// Reset form when dialog closes
watch(isVisible, (newValue) => {
  if (!newValue) {
    projectName.value = "";
    projectDescription.value = "";
    isLoading.value = false;
  }
});

// Expose methods for parent to control loading state
defineExpose({
  setLoading: (loading: boolean) => {
    isLoading.value = loading;
  },
  closeDialog: () => {
    isVisible.value = false;
  },
});
</script>

<style scoped>
.create-project-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
