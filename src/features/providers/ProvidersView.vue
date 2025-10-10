<template>
  <div class="providers">
    <!-- Header -->
    <div class="providers-header">
      <h1>{{ $t("providers.title") }}</h1>
      <base-button variant="primary" @click="showAddDialog = true">
        {{ $t("providers.addProvider") }}
      </base-button>
    </div>

    <!-- Security Notice -->
    <base-notice
      v-if="!hasShownNotice"
      type="warning"
      :title="$t('providers.securityNotice.title')"
      dismissible
      @dismiss="acknowledgeNotice"
    >
      <p>{{ $t("providers.securityNotice.message") }}</p>
      <ul>
        <li>{{ $t("providers.securityNotice.point1") }}</li>
        <li>{{ $t("providers.securityNotice.point2") }}</li>
        <li>{{ $t("providers.securityNotice.point3") }}</li>
      </ul>

      <template #actions>
        <base-button variant="primary" size="sm" @click="acknowledgeNotice">
          {{ $t("providers.securityNotice.acknowledge") }}
        </base-button>
      </template>
    </base-notice>

    <!-- Empty State -->
    <base-empty-state
      v-if="providerStatuses.length === 0"
      :title="$t('providers.noProviders')"
      :description="$t('providers.noProvidersDescription')"
      icon="🔑"
      :action-label="$t('providers.addProvider')"
      @action="showAddDialog = true"
    />

    <!-- Providers List -->
    <div v-else class="providers-list">
      <provider-card
        v-for="provider in providerStatuses"
        :key="provider.id"
        :provider="provider"
        :testing-provider="providersStore.testingProvider"
        @test="testProvider"
        @edit="editProvider"
        @delete="confirmDelete"
      />
    </div>

    <!-- Add/Edit Provider Dialog -->
    <base-dialog v-model="showAddDialog" :title="dialogTitle" size="md">
      <provider-form
        :provider="newProvider"
        :is-edit-mode="isEditMode"
        :supported-types="supportedProviderTypes"
        @submit="addProvider"
        @cancel="closeAddDialog"
      />
    </base-dialog>

    <!-- Delete Confirmation Dialog -->
    <base-dialog v-model="showDeleteDialog" title="Confirm Deletion" size="sm">
      <p>
        {{ $t("providers.confirmDelete", { name: providerToDelete?.name }) }}
      </p>

      <template #actions>
        <base-button variant="outline" @click="showDeleteDialog = false">
          {{ $t("common.cancel") }}
        </base-button>
        <base-button variant="danger" @click="deleteProvider">
          {{ $t("common.delete") }}
        </base-button>
      </template>
    </base-dialog>

    <!-- Toast Notifications -->
    <base-toast
      v-model="showToast"
      :type="toastType"
      :title="toastTitle"
      :message="toastMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useProvidersStore } from "../../../src/store/providers";
import {
  BaseButton,
  BaseNotice,
  BaseEmptyState,
  BaseDialog,
  BaseToast,
} from "../../components/ui";
import ProviderCard from "./components/ProviderCard.vue";
import ProviderForm from "./components/ProviderForm.vue";
import type { ProviderConfig } from "../../types/providers";

type ProviderDisplayData = {
  id: string;
  name: string;
  type: string;
  hasKey: boolean;
  isValid: boolean | null;
  lastTested: Date | null;
  isActive: boolean;
};

const { t } = useI18n();
const providersStore = useProvidersStore();

// Reactive state
const showAddDialog = ref(false);
const showDeleteDialog = ref(false);
const showToast = ref(false);
const hasShownNotice = ref(providersStore.hasShownEncryptionNotice());
const providerToDelete = ref<ProviderConfig | null>(null);

// Toast state
const toastType = ref<"success" | "error" | "warning" | "info">("info");
const toastTitle = ref("");
const toastMessage = ref("");

// Form state
const isEditMode = ref(false);
const newProvider = ref({
  type: "",
  name: "",
  apiKey: "",
  baseUrl: "",
  models: [] as string[],
});

// Computed
const supportedProviderTypes = computed(
  () => providersStore.supportedProviderTypes,
);
const providerStatuses = computed(() => providersStore.providerStatuses);

const dialogTitle = computed(() =>
  isEditMode.value ? t("providers.editProvider") : t("providers.addProvider"),
);

// Methods
const acknowledgeNotice = (): void => {
  hasShownNotice.value = true;
  providersStore.markEncryptionNoticeShown();
};

const showNotification = (
  type: typeof toastType.value,
  title: string,
  message: string,
): void => {
  toastType.value = type;
  toastTitle.value = title;
  toastMessage.value = message;
  showToast.value = true;
};

const testProvider = async (providerId: string): Promise<void> => {
  try {
    const result = await providersStore.testKey(providerId);

    if (result) {
      showNotification(
        "success",
        t("providers.testSuccess"),
        t("providers.testSuccessMessage"),
      );
    } else {
      showNotification(
        "error",
        t("providers.testFailed"),
        t("providers.testFailedMessage"),
      );
    }
  } catch (error) {
    showNotification(
      "error",
      t("providers.testFailed"),
      error instanceof Error ? error.message : t("providers.testFailedMessage"),
    );
  }
};

const editProvider = (provider: ProviderDisplayData): void => {
  isEditMode.value = true;
  newProvider.value = {
    type: provider.type,
    name: provider.name,
    apiKey: "", // Don't pre-fill API key for security
    baseUrl: "",
    models: [],
  };
  showAddDialog.value = true;
};

const confirmDelete = (provider: ProviderDisplayData): void => {
  // Convert to ProviderConfig for storage operations
  providerToDelete.value = {
    id: provider.id,
    name: provider.name,
    isActive: provider.isActive,
  };
  showDeleteDialog.value = true;
};

const deleteProvider = (): void => {
  if (providerToDelete.value) {
    providersStore.removeKey(providerToDelete.value.id);
    showNotification(
      "success",
      t("providers.deleteSuccess"),
      t("providers.deleteSuccessMessage"),
    );
    showDeleteDialog.value = false;
    providerToDelete.value = null;
  }
};

const addProvider = (formData: {
  type: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  models?: string[];
}): void => {
  try {
    if (!formData.type || !formData.name) {
      showNotification("error", t("providers.error"), t("validation.required"));
      return;
    }

    if (isEditMode.value) {
      // For edit mode, we'd need an update method or remove + add
      showNotification(
        "info",
        t("providers.info"),
        "Edit functionality needs implementation",
      );
    } else {
      const type = formData.type as
        | "openai"
        | "claude"
        | "mistral"
        | "lechat"
        | "mock";
      providersStore.addKey(
        type,
        formData.name,
        formData.apiKey,
        formData.baseUrl,
      );
      showNotification(
        "success",
        t("providers.addSuccess"),
        t("providers.addSuccessMessage"),
      );
    }

    closeAddDialog();
  } catch (error) {
    showNotification(
      "error",
      t("providers.error"),
      error instanceof Error ? error.message : t("providers.unknownError"),
    );
  }
};

const closeAddDialog = (): void => {
  showAddDialog.value = false;
  isEditMode.value = false;
  newProvider.value = {
    type: "",
    name: "",
    apiKey: "",
    baseUrl: "",
    models: [],
  };
};

// Lifecycle
onMounted(() => {
  providersStore.initialize();
});
</script>

<style scoped>
.providers {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.providers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.providers-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
}

.providers-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(800px, 1fr));
}

/* Responsive */
@media (max-width: 768px) {
  .providers {
    padding: 1rem;
  }

  .providers-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .providers-list {
    grid-template-columns: 1fr;
  }
}
</style>
