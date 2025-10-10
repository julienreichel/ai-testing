<template>
  <base-card clickable @click="$emit('view', provider)">
    <template #header>
      <div class="provider-header">
        <h3>{{ provider.name }}</h3>
        <base-badge :variant="getProviderTypeVariant(provider.type)">
          {{ provider.type.toUpperCase() }}
        </base-badge>
      </div>
    </template>

    <div class="provider-status">
      <div class="status-item">
        <span class="status-label">{{ $t("providers.apiKey") }}:</span>
        <base-badge
          :variant="provider.hasKey ? 'success' : 'warning'"
          :icon="provider.hasKey ? '✅' : '⚠️'"
        >
          {{
            provider.hasKey
              ? $t("providers.configured")
              : $t("providers.notConfigured")
          }}
        </base-badge>
      </div>

      <div v-if="provider.hasKey" class="status-item">
        <span class="status-label">{{ $t("providers.validation") }}:</span>
        <base-badge
          :variant="getValidationVariant(provider)"
          :icon="getValidationIcon(provider)"
        >
          {{ getValidationText(provider) }}
        </base-badge>
      </div>

      <div v-if="provider.lastTested" class="status-item">
        <span class="status-label">{{ $t("providers.lastTested") }}:</span>
        <span class="status-value">{{ formatDate(provider.lastTested) }}</span>
      </div>
    </div>

    <template #actions>
      <div class="provider-actions">
        <base-button
          v-if="provider.hasKey"
          :variant="testingProvider === provider.id ? 'primary' : 'outline'"
          :loading="testingProvider === provider.id"
          :disabled="testingProvider === provider.id"
          size="sm"
          @click.stop="$emit('test', provider.id)"
        >
          {{
            testingProvider === provider.id
              ? $t("providers.testing")
              : $t("providers.test")
          }}
        </base-button>

        <base-button
          variant="outline"
          size="sm"
          @click.stop="$emit('edit', provider)"
        >
          {{ $t("providers.edit") }}
        </base-button>

        <base-button
          variant="danger"
          size="sm"
          @click.stop="$emit('delete', provider)"
        >
          {{ $t("providers.remove") }}
        </base-button>
      </div>
    </template>
  </base-card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import BaseCard from "../../../components/ui/BaseCard.vue";
import BaseBadge from "../../../components/ui/BaseBadge.vue";
import BaseButton from "../../../components/ui/BaseButton.vue";

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    type: string;
    hasKey: boolean;
    isValid: boolean | null;
    lastTested: Date | null;
    isActive: boolean;
  };
  testingProvider?: string | null;
}

defineProps<ProviderCardProps>();

type ProviderType = ProviderCardProps["provider"];

defineEmits<{
  view: [provider: ProviderType];
  test: [providerId: string];
  edit: [provider: ProviderType];
  delete: [provider: ProviderType];
}>();

const { t } = useI18n();

// Helper methods
const getProviderTypeVariant = (
  type: string,
): "primary" | "success" | "warning" | "info" | "danger" | "light" | "dark" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "info"> = {
    openai: "primary",
    anthropic: "success",
    google: "warning",
    mock: "info",
  };
  return typeMap[type.toLowerCase()] || "info";
};

const getValidationVariant = (
  provider: ProviderType,
): "primary" | "success" | "warning" | "info" | "danger" | "light" | "dark" => {
  if (provider.isValid === null) return "light";
  if (provider.isValid === true) return "success";
  if (provider.isValid === false) return "danger";
  return "light";
};

const getValidationIcon = (provider: ProviderType): string => {
  if (provider.isValid === null) return "❓";
  if (provider.isValid === true) return "✅";
  if (provider.isValid === false) return "❌";
  return "❓";
};

const getValidationText = (provider: ProviderType): string => {
  if (provider.isValid === null) return t("providers.notTested");
  if (provider.isValid === true) return t("providers.valid");
  if (provider.isValid === false) return t("providers.invalid");
  return t("providers.notTested");
};

const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
</script>

<style scoped>
.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.provider-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.provider-status {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.status-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.status-value {
  font-size: 0.875rem;
  color: var(--text-primary, #1a1a1a);
}

.provider-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 640px) {
  .provider-actions {
    flex-direction: column;
  }

  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ProviderCard",
});
</script>
