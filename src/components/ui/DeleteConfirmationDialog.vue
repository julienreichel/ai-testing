<template>
  <base-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    size="sm"
  >
    <div class="delete-confirmation">
      <div class="delete-icon">
        <svg
          class="warning-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <div class="delete-content">
        <p class="delete-message">
          {{ message }}
        </p>

        <p v-if="description" class="delete-description">
          {{ description }}
        </p>
      </div>
    </div>

    <template #footer>
      <base-button variant="outline" @click="handleCancel">
        {{ cancelLabel }}
      </base-button>
      <base-button
        variant="danger"
        :loading="isDeleting"
        @click="handleConfirm"
      >
        {{ confirmLabel }}
      </base-button>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { BaseDialog, BaseButton } from "./index";

export interface DeleteConfirmationDialogProps {
  modelValue: boolean;
  title?: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
}

withDefaults(defineProps<DeleteConfirmationDialogProps>(), {
  title: "Confirm Deletion",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
  isDeleting: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const handleConfirm = (): void => {
  emit("confirm");
};

const handleCancel = (): void => {
  emit("update:modelValue", false);
  emit("cancel");
};
</script>

<style scoped>
.delete-confirmation {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.delete-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon {
  width: 24px;
  height: 24px;
  color: #dc2626;
}

.delete-content {
  flex: 1;
}

.delete-message {
  color: #111827;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
}

.delete-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}
</style>
