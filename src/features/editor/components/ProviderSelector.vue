<template>
  <div class="provider-selector">
    <div class="provider-fields">
      <base-form class="provider-form" :show-default-actions="false">
        <div class="form-row">
          <base-input-field
            :model-value="modelValue.providerId"
            :label="$t('promptEditor.provider')"
            :placeholder="$t('promptEditor.selectProvider')"
            type="select"
            :options="providerOptions"
            :disabled="isRunning"
            @update:model-value="updateProvider"
          />

          <base-input-field
            :model-value="modelValue.model"
            :label="$t('promptEditor.model')"
            :placeholder="$t('promptEditor.selectModel')"
            type="select"
            :options="modelOptions"
            :disabled="isRunning || !modelValue.providerId"
            @update:model-value="updateModel"
          />
        </div>
      </base-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useProvidersStore } from "../../../store/providers";
import { BaseForm, BaseInputField } from "../../../components/ui";

export interface ProviderSelection {
  providerId: string;
  model: string;
}

interface ProviderSelectorProps {
  modelValue: ProviderSelection;
  isRunning?: boolean;
}

const props = withDefaults(defineProps<ProviderSelectorProps>(), {
  isRunning: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: ProviderSelection];
}>();

const { t } = useI18n();
const providersStore = useProvidersStore();
const { providerStatuses, validProviders } = storeToRefs(providersStore);

const providerOptions = computed(() => {
  return validProviders.value.map((provider) => ({
    label: provider.name,
    value: provider.id,
  }));
});

const modelOptions = computed(() => {
  if (!props.modelValue.providerId) {
    return [];
  }

  // Get models from the selected provider
  const models = providersStore.getProviderModels(props.modelValue.providerId);
  return models.map((model) => ({
    label: model.name,
    value: model.id,
  }));
});

const selectedProviderStatus = computed(() => {
  return providerStatuses.value.find(
    (p) => p.id === props.modelValue.providerId,
  );
});

const statusIcon = computed(() => {
  if (!selectedProviderStatus.value) return "";

  const status = selectedProviderStatus.value;
  if (!status.hasKey) return "⚠️";
  if (status.isValid === true) return "✅";
  if (status.isValid === false) return "❌";
  return "⏳";
});

const statusText = computed(() => {
  if (!selectedProviderStatus.value) return "";

  const status = selectedProviderStatus.value;
  if (!status.hasKey) return t("providers.status.noKey");
  if (!status.isActive) return t("providers.status.inactive");
  if (status.isValid === true) return t("providers.status.active");
  if (status.isValid === false) return t("providers.status.error");
  return t("providers.status.untested");
});

const statusClasses = computed(() => [
  "status-indicator",
  {
    "status-success": selectedProviderStatus.value?.isValid === true,
    "status-error": selectedProviderStatus.value?.isValid === false,
    "status-warning": !selectedProviderStatus.value?.hasKey,
    "status-pending":
      selectedProviderStatus.value?.isValid === null &&
      selectedProviderStatus.value?.hasKey,
  },
]);

const updateProvider = (providerId: string | number): void => {
  emit("update:modelValue", {
    providerId: String(providerId),
    model: "", // Reset model when provider changes
  });
};

const updateModel = (model: string | number): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    model: String(model),
  });
};
</script>

<style scoped>
.provider-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.provider-fields {
  flex: 1;
}

.provider-form {
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.provider-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.status-indicator {
  font-size: 1rem;
}

.status-text {
  color: #374151;
  font-weight: 500;
}

.status-success .status-text {
  color: #10b981;
}

.status-error .status-text {
  color: #ef4444;
}

.status-warning .status-text {
  color: #f59e0b;
}

.status-pending .status-text {
  color: #6b7280;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
