<template>
  <base-dialog
    v-model="isVisible"
    :title="$t('testManagement.deleteProject')"
    class="delete-dialog"
  >
    <div>
      <p v-if="project">
        {{
          $t("testManagement.deleteProjectConfirmation", {
            projectName: project.name,
          })
        }}
      </p>

      <div class="dialog-actions">
        <base-button
          variant="outline"
          @click="handleCancel"
          :disabled="isLoading"
        >
          {{ $t("common.cancel") }}
        </base-button>
        <base-button
          variant="danger"
          @click="handleDelete"
          :loading="isLoading"
        >
          {{ $t("testManagement.deleteProject") }}
        </base-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { BaseButton, BaseDialog } from "../../../components/ui";
import type { Project } from "../../../types/testManagement";

interface Props {
  modelValue: boolean;
  project: Project | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "delete", project: Project): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Loading state
const isLoading = ref(false);

// Computed visibility
const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

// Handlers
const handleDelete = async (): Promise<void> => {
  if (!props.project) return;

  isLoading.value = true;

  try {
    emit("delete", props.project);
    // Don't close the dialog here - let the parent handle success/error
    // and close the dialog after successful deletion
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = (): void => {
  isVisible.value = false;
};

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
.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.delete-dialog p {
  margin-bottom: 1.5rem;
  color: #374151;
  line-height: 1.6;
}
</style>
