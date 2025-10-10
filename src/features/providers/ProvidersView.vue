<template>
  <div class="providers">
    <!-- Header -->
    <div class="providers-header">
      <h1>{{ $t("providers.title") }}</h1>
      <button class="btn btn-primary" @click="showAddDialog = true">
        {{ $t("providers.addProvider") }}
      </button>
    </div>

    <!-- Security Notice -->
    <div v-if="!hasShownNotice" class="security-notice">
      <div class="notice-content">
        <h3>{{ $t("providers.securityNotice.title") }}</h3>
        <p>{{ $t("providers.securityNotice.message") }}</p>
        <ul>
          <li>{{ $t("providers.securityNotice.point1") }}</li>
          <li>{{ $t("providers.securityNotice.point2") }}</li>
          <li>{{ $t("providers.securityNotice.point3") }}</li>
        </ul>
        <div class="notice-actions">
          <button class="btn btn-primary" @click="acknowledgeNotice">
            {{ $t("providers.securityNotice.acknowledge") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Providers List -->
    <div class="providers-list">
      <div v-if="providerStatuses.length === 0" class="empty-state">
        <p>{{ $t("providers.noProviders") }}</p>
      </div>

      <div
        v-for="provider in providerStatuses"
        :key="provider.id"
        class="provider-card"
      >
        <div class="provider-info">
          <div class="provider-header">
            <h3>{{ provider.name }}</h3>
            <span class="provider-type">{{ provider.type.toUpperCase() }}</span>
          </div>

          <div class="provider-status">
            <div class="status-item">
              <span class="status-label">{{ $t("providers.apiKey") }}:</span>
              <span
                :class="[
                  'status-value',
                  provider.hasKey ? 'has-key' : 'no-key',
                ]"
              >
                {{
                  provider.hasKey
                    ? $t("providers.configured")
                    : $t("providers.notConfigured")
                }}
              </span>
            </div>

            <div v-if="provider.hasKey" class="status-item">
              <span class="status-label"
                >{{ $t("providers.validation") }}:</span
              >
              <span :class="['status-value', 'status-badge', getValidationClass(provider)]">
                <span class="status-icon">{{ getValidationIcon(provider) }}</span>
                {{ getValidationText(provider) }}
              </span>
            </div>

            <div v-if="provider.lastTested" class="status-item">
              <span class="status-label"
                >{{ $t("providers.lastTested") }}:</span
              >
              <span class="status-value">{{
                formatDate(provider.lastTested)
              }}</span>
            </div>
          </div>
        </div>

        <div class="provider-actions">
          <button
            v-if="provider.hasKey"
            :class="[
              'btn',
              testingProvider === provider.id ? 'btn-testing' : 'btn-outline'
            ]"
            :disabled="testingProvider === provider.id"
            @click="testProvider(provider.id)"
          >
            <span v-if="testingProvider === provider.id" class="loading-spinner"></span>
            {{
              testingProvider === provider.id
                ? $t("providers.testing")
                : $t("providers.test")
            }}
          </button>

          <button class="btn btn-outline" @click="editProvider(provider)">
            {{ $t("providers.edit") }}
          </button>

          <button class="btn btn-danger" @click="confirmDelete(provider)">
            {{ $t("providers.remove") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Provider Dialog -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="closeAddDialog">
      <div class="dialog" @click.stop>
        <h2>{{ dialogTitle }}</h2>

        <form @submit.prevent="addProvider">
          <div class="form-group">
            <label>{{ $t("providers.providerType") }}</label>
            <select v-model="newProvider.type" required :disabled="isEditMode">
              <option value="">{{ $t("providers.selectType") }}</option>
              <option
                v-for="type in supportedProviderTypes"
                :key="type"
                :value="type"
              >
                {{ type.toUpperCase() }}
              </option>
            </select>
            <small v-if="isEditMode" class="form-help">
              Provider type cannot be changed when editing
            </small>
          </div>

          <div class="form-group">
            <label>{{ $t("providers.name") }}</label>
            <input
              v-model="newProvider.name"
              type="text"
              required
              :placeholder="$t('providers.namePlaceholder')"
            />
          </div>

          <div v-if="newProvider.type !== 'mock'" class="form-group">
            <label>{{ $t("providers.apiKey") }}</label>
            <input
              v-model="newProvider.apiKey"
              type="password"
              required
              :placeholder="getApiKeyPlaceholder(newProvider.type)"
            />
          </div>

          <div v-if="showBaseUrl" class="form-group">
            <label
              >{{ $t("providers.baseUrl") }} ({{
                $t("providers.optional")
              }})</label
            >
            <input
              v-model="newProvider.baseUrl"
              type="url"
              :placeholder="$t('providers.baseUrlPlaceholder')"
            />
          </div>

          <div class="dialog-actions">
            <button
              type="button"
              class="btn btn-outline"
              @click="closeAddDialog"
            >
              {{ $t("common.cancel") }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ submitButtonText }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="clearError">&times;</button>
    </div>

    <!-- Toast Notifications -->
    <div
      v-if="showToastNotification"
      :class="['toast-notification', `toast-${toastType}`]"
      @click="hideToast"
    >
      {{ toastMessage }}
      <button class="toast-close" @click="hideToast">&times;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useProvidersStore } from "../../store/providers";
import type { ProviderKeyStatus } from "../../store/providers";
import type { ProviderType } from "../../providers";

const providersStore = useProvidersStore();
const { t } = useI18n();

// State
const showAddDialog = ref(false);
const isEditMode = ref(false);
const editingProviderId = ref<string | null>(null);
const hasShownNotice = computed(() =>
  providersStore.hasShownEncryptionNotice(),
);

// Toast notifications
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "">("");
const showToastNotification = ref(false);

const newProvider = ref({
  type: "" as ProviderType | "",
  name: "",
  apiKey: "",
  baseUrl: "",
});

// Computed
const providerStatuses = computed(() => providersStore.providerStatuses);
const supportedProviderTypes = computed(
  () => providersStore.supportedProviderTypes,
);
const isLoading = computed(() => providersStore.isLoading);
const error = computed(() => providersStore.error);
const testingProvider = computed(() => providersStore.testingProvider);

const showBaseUrl = computed(() => newProvider.value.type === "openai");

// Dialog computed properties
const dialogTitle = computed(() => 
  isEditMode.value ? t("providers.editProvider") : t("providers.addProvider")
);

const submitButtonText = computed(() => {
  if (isLoading.value) {
    return isEditMode.value ? t("providers.updating") : t("providers.adding");
  }
  return isEditMode.value ? t("providers.update") : t("providers.add");
});

// Methods
const acknowledgeNotice = (): void => {
  providersStore.markEncryptionNoticeShown();
};

const closeAddDialog = (): void => {
  showAddDialog.value = false;
  isEditMode.value = false;
  editingProviderId.value = null;
  newProvider.value = { type: "", name: "", apiKey: "", baseUrl: "" };
};

const addProvider = (): void => {
  if (!newProvider.value.type || !newProvider.value.name) return;

  try {
    const type = newProvider.value.type;
    
    if (isEditMode.value && editingProviderId.value) {
      // Update existing provider
      providersStore.removeKey(editingProviderId.value);
      providersStore.addKey(
        type,
        newProvider.value.name,
        newProvider.value.apiKey,
        newProvider.value.baseUrl || undefined,
      );
      showToast(`✏️ ${newProvider.value.name} updated successfully!`, 'success');
    } else {
      // Add new provider
      providersStore.addKey(
        type,
        newProvider.value.name,
        newProvider.value.apiKey,
        newProvider.value.baseUrl || undefined,
      );
      showToast(`➕ ${newProvider.value.name} added successfully!`, 'success');
    }
    
    closeAddDialog();
  } catch (err) {
    console.error("Failed to save provider:", err);
    const action = isEditMode.value ? 'update' : 'add';
    showToast(`❌ Failed to ${action} provider. Please try again.`, 'error');
  }
};

const testProvider = async (id: string): Promise<void> => {
  const success = await providersStore.testKey(id);

  // Show temporary success/failure message
  const provider = providerStatuses.value.find(p => p.id === id);
  const providerName = provider?.name || 'Provider';

  if (success) {
    showToast(`✅ ${providerName} test successful!`, 'success');
  } else {
    showToast(`❌ ${providerName} test failed. Check your API key.`, 'error');
  }
};

const editProvider = (provider: ProviderKeyStatus): void => {
  // Find the full provider config to get all details
  const config = providersStore.providerConfigs.find(c => c.id === provider.id);
  if (!config) return;
  
  // Set edit mode and populate form
  isEditMode.value = true;
  editingProviderId.value = provider.id;
  
  newProvider.value = {
    type: provider.type,
    name: provider.name,
    apiKey: config.apiKey || "",
    baseUrl: config.baseUrl || "",
  };
  
  // Show the dialog
  showAddDialog.value = true;
};

const confirmDelete = (provider: ProviderKeyStatus): void => {
  if (confirm(`Remove ${provider.name}?`)) {
    providersStore.removeKey(provider.id);
  }
};

const getValidationClass = (provider: ProviderKeyStatus): string => {
  if (provider.isValid === null) return "not-tested";
  return provider.isValid ? "valid" : "invalid";
};

const getValidationText = (provider: ProviderKeyStatus): string => {
  if (provider.isValid === null) return "Not tested";
  return provider.isValid ? "Valid" : "Invalid";
};

const getValidationIcon = (provider: ProviderKeyStatus): string => {
  if (provider.isValid === null) return "❓";
  return provider.isValid ? "✅" : "❌";
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

const getApiKeyPlaceholder = (type: ProviderType | ""): string => {
  switch (type) {
    case "openai":
      return "sk-...";
    case "claude":
      return "sk-ant-...";
    default:
      return "Enter API key";
  }
};

const clearError = (): void => {
  providersStore.clearError();
};

const TOAST_AUTO_HIDE_DURATION = 4000; // 4 seconds

const showToast = (message: string, type: "success" | "error"): void => {
  toastMessage.value = message;
  toastType.value = type;
  showToastNotification.value = true;

  // Auto-hide after 4 seconds
  setTimeout(() => {
    showToastNotification.value = false;
  }, TOAST_AUTO_HIDE_DURATION);
};

const hideToast = (): void => {
  showToastNotification.value = false;
};

// Lifecycle
onMounted(() => {
  providersStore.initialize();
});
</script>

<style scoped>
.providers {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.providers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.providers-header h1 {
  margin: 0;
}

.security-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.notice-content h3 {
  margin-top: 0;
  color: #856404;
}

.notice-content p,
.notice-content li {
  color: #856404;
}

.notice-actions {
  margin-top: 1rem;
}

.providers-list {
  display: grid;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.provider-card {
  background: #3498db;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.provider-info {
  flex: 1;
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.provider-header h3 {
  margin: 0;
}

.provider-type {
  background: #007acc;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.provider-status {
  display: grid;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  gap: 0.5rem;
}

.status-label {
  font-weight: 500;
  min-width: 80px;
}

.status-value.has-key {
  color: #054213;
}
.status-value.no-key {
  color: #dc3545;
}

/* Status badges with better visual feedback */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.valid {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.invalid {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-badge.not-tested {
  background: #e9ecef;
  color: #495057;
  border: 1px solid #ced4da;
}

.status-icon {
  font-size: 1rem;
}

.provider-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #3498db;
  border-radius: 8px;
  padding: 2rem;
  min-width: 400px;
  max-width: 90vw;
}

.dialog h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
  font-style: italic;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007acc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #005a9e;
}

.btn-outline {
  background: transparent;
  color: #141515;
  border: 1px solid #141515;
}

.btn-outline:hover:not(:disabled) {
  background: #007acc;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-testing {
  background: #007acc;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.error-message button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #721c24;
}

/* Toast Notifications */
.toast-notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 300px;
  animation: slideInRight 0.3s ease-out;
}

.toast-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.toast-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
