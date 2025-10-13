<template>
  <base-form
    :title="
      isEditMode ? $t('providers.editProvider') : $t('providers.addProvider')
    "
    :loading="loading"
    :submit-label="isEditMode ? $t('common.update') : $t('common.add')"
    :cancel-label="$t('common.cancel')"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  >
    <base-input-field
      v-model="form.type"
      type="select"
      :label="$t('providers.providerType')"
      :placeholder="$t('providers.selectType')"
      :options="typeOptions"
      :disabled="isEditMode"
      :error="errors.type"
      required
    />

    <base-notice v-if="isEditMode" type="info" size="sm">
      {{ $t("providers.editTypeNotice") }}
    </base-notice>

    <base-input-field
      v-model="form.name"
      type="text"
      :label="$t('providers.name')"
      :placeholder="$t('providers.namePlaceholder')"
      :error="errors.name"
      required
    />

    <base-input-field
      v-if="form.type !== 'mock'"
      v-model="form.apiKey"
      type="password"
      :label="$t('providers.apiKey')"
      :placeholder="$t('providers.apiKeyPlaceholder')"
      :hint="$t('providers.apiKeyHint')"
      :error="errors.apiKey"
      required
    />

    <base-input-field
      v-if="showBaseUrl"
      v-model="form.baseUrl"
      type="url"
      :label="$t('providers.baseUrl')"
      :placeholder="$t('providers.baseUrlPlaceholder')"
      :hint="$t('providers.baseUrlHint')"
      :error="errors.baseUrl"
    />
  </base-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseForm from "../../../components/ui/BaseForm.vue";
import BaseInputField from "../../../components/ui/BaseInputField.vue";
import BaseNotice from "../../../components/ui/BaseNotice.vue";
import type { BaseInputFieldOption } from "../../../components/ui/BaseInputField.vue";
import { ProviderFactory, type ProviderType } from "../../../providers";

interface Provider {
  type: ProviderType;
  name: string;
  apiKey: string;
  baseUrl?: string;
}

interface ProviderFormProps {
  provider: Provider;
  isEditMode?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ProviderFormProps>(), {
  isEditMode: false,
  loading: false,
});

const emit = defineEmits<{
  submit: [provider: Provider];
  cancel: [];
}>();

const { t } = useI18n();

// Form state
const form = ref<Provider>({
  type: "mock" as ProviderType,
  name: "",
  apiKey: "",
  baseUrl: "",
});

const errors = ref({
  type: "",
  name: "",
  apiKey: "",
  baseUrl: "",
});

// Initialize form with prop data
watch(
  () => props.provider,
  (newProvider) => {
    form.value = { ...newProvider };
  },
  { immediate: true },
);

// Computed
const typeOptions = computed((): BaseInputFieldOption[] =>
  ProviderFactory.getSupportedProviders().map((type: ProviderType) => ({
    value: type,
    label: ProviderFactory.getProviderDisplayName(type),
  })),
);

const showBaseUrl = computed(() => {
  return form.value.type && ["openai", "anthropic"].includes(form.value.type);
});

// Methods
const validateForm = (): boolean => {
  errors.value = {
    type: "",
    name: "",
    apiKey: "",
    baseUrl: "",
  };

  let isValid = true;

  if (!form.value.type) {
    errors.value.type = t("validation.required");
    isValid = false;
  }

  if (!form.value.name.trim()) {
    errors.value.name = t("validation.required");
    isValid = false;
  }

  if (form.value.type !== "mock" && !form.value.apiKey.trim()) {
    errors.value.apiKey = t("validation.required");
    isValid = false;
  }

  if (
    showBaseUrl.value &&
    form.value.baseUrl &&
    !isValidUrl(form.value.baseUrl)
  ) {
    errors.value.baseUrl = t("validation.invalidUrl");
    isValid = false;
  }

  return isValid;
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const handleSubmit = (): void => {
  if (validateForm()) {
    emit("submit", { ...form.value });
  }
};

// Clear errors on input change
watch(
  form,
  () => {
    // Clear errors when user starts typing
    Object.keys(errors.value).forEach((key) => {
      if (errors.value[key as keyof typeof errors.value]) {
        errors.value[key as keyof typeof errors.value] = "";
      }
    });
  },
  { deep: true },
);
</script>

<style scoped>
/* Component-specific styles if needed */
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ProviderForm",
});
</script>
