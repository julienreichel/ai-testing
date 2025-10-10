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
              <span :class="['status-value', getValidationClass(provider)]">
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
            class="btn btn-outline"
            :disabled="testingProvider === provider.id"
            @click="testProvider(provider.id)"
          >
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

    <!-- Add Provider Dialog -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="closeAddDialog">
      <div class="dialog" @click.stop>
        <h2>{{ $t("providers.addProvider") }}</h2>

        <form @submit.prevent="addProvider">
          <div class="form-group">
            <label>{{ $t("providers.providerType") }}</label>
            <select v-model="newProvider.type" required>
              <option value="">{{ $t("providers.selectType") }}</option>
              <option
                v-for="type in supportedProviderTypes"
                :key="type"
                :value="type"
              >
                {{ type.toUpperCase() }}
              </option>
            </select>
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
              {{ isLoading ? $t("providers.adding") : $t("providers.add") }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useProvidersStore } from "../../store/providers";
import type { ProviderKeyStatus } from "../../store/providers";
import type { ProviderType } from "../../providers";

const providersStore = useProvidersStore();

// State
const showAddDialog = ref(false);
const hasShownNotice = computed(() =>
  providersStore.hasShownEncryptionNotice(),
);

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

// Methods
const acknowledgeNotice = (): void => {
  providersStore.markEncryptionNoticeShown();
};

const closeAddDialog = (): void => {
  showAddDialog.value = false;
  newProvider.value = { type: "", name: "", apiKey: "", baseUrl: "" };
};

const addProvider = (): void => {
  if (!newProvider.value.type || !newProvider.value.name) return;

  try {
    const type = newProvider.value.type;
    providersStore.addKey(
      type,
      newProvider.value.name,
      newProvider.value.apiKey,
      newProvider.value.baseUrl || undefined,
    );
    closeAddDialog();
  } catch (err) {
    console.error("Failed to add provider:", err);
  }
};

const testProvider = async (id: string): Promise<void> => {
  await providersStore.testKey(id);
};

const editProvider = (provider: ProviderKeyStatus): void => {
  // TODO: Implement edit functionality
  console.log("Edit provider:", provider);
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
.status-value.valid {
  color: #054213;
}
.status-value.invalid {
  color: #dc3545;
}
.status-value.not-tested {
  color: #6c757d;
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
  color: #007acc;
  border: 1px solid #007acc;
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
</style>
