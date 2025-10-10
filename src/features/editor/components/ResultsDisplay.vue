<template>
  <div class="results-display">
    <!-- Loading State -->
    <div v-if="isRunning" class="result-loading">
      <base-card padding="lg">
        <div class="loading-content">
          <base-spinner size="lg" />
          <div class="loading-text">
            <h3>{{ $t("promptEditor.generatingResponse") }}</h3>
            <p>{{ $t("promptEditor.pleaseWait") }}</p>
          </div>
          <base-button variant="outline" size="sm" @click="$emit('cancel')">
            {{ $t("common.cancel") }}
          </base-button>
        </div>
      </base-card>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="result-error">
      <base-notice
        type="error"
        :title="$t('promptEditor.executionError')"
        dismissible
        @dismiss="$emit('clearResults')"
      >
        <p>{{ error }}</p>
        <template #actions>
          <base-button variant="outline" size="sm" @click="$emit('retry')">
            {{ $t("common.retry") }}
          </base-button>
        </template>
      </base-notice>
    </div>

    <!-- Success Result -->
    <div v-else-if="result" class="result-success">
      <base-card padding="lg">
        <div class="result-header">
          <h3>{{ $t("promptEditor.response") }}</h3>
          <div class="result-meta">
            <span class="meta-item">
              <span class="meta-label">{{ $t("promptEditor.model") }}</span>
              <span class="meta-value">{{ result.model }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">{{ $t("promptEditor.latency") }}</span>
              <span class="meta-value">{{
                formatLatency(result.metadata.latency)
              }}</span>
            </span>
          </div>
        </div>

        <div class="result-content">
          <div class="response-text">
            <pre>{{ result.content }}</pre>
          </div>
        </div>

        <div class="result-metrics">
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">{{
                $t("promptEditor.inputTokens")
              }}</span>
              <span class="metric-value">{{
                result.usage.inputTokens.toLocaleString()
              }}</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">{{
                $t("promptEditor.outputTokens")
              }}</span>
              <span class="metric-value">{{
                result.usage.outputTokens.toLocaleString()
              }}</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">{{
                $t("promptEditor.totalTokens")
              }}</span>
              <span class="metric-value">{{
                result.usage.totalTokens.toLocaleString()
              }}</span>
            </div>

            <div class="metric-card metric-cost">
              <span class="metric-label">{{ $t("promptEditor.cost") }}</span>
              <span class="metric-value"
                >${{ result.cost.totalCost.toFixed(4) }}</span
              >
            </div>
          </div>
        </div>

        <div class="result-actions">
          <base-button variant="primary" size="sm" @click="$emit('saveAsTest')">
            {{ $t("promptEditor.saveAsTestCase") }}
          </base-button>

          <base-button variant="outline" size="sm" @click="copyToClipboard">
            {{ $t("common.copy") }}
          </base-button>

          <base-button
            variant="outline"
            size="sm"
            @click="$emit('clearResults')"
          >
            {{ $t("common.clear") }}
          </base-button>
        </div>
      </base-card>
    </div>

    <!-- Empty State -->
    <div v-else class="result-empty">
      <base-empty-state
        :title="$t('promptEditor.noResults')"
        :description="$t('promptEditor.runPromptToSeeResults')"
        icon="🚀"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProviderResponse } from "../../../types/providers";
import {
  BaseCard,
  BaseSpinner,
  BaseButton,
  BaseNotice,
  BaseEmptyState,
} from "../../../components/ui";

interface ResultsDisplayProps {
  result: ProviderResponse | null;
  error: string | null;
  isRunning: boolean;
}

defineProps<ResultsDisplayProps>();

const emit = defineEmits<{
  cancel: [];
  retry: [];
  clearResults: [];
  saveAsTest: [];
}>();

const formatLatency = (latencyMs: number): string => {
  if (latencyMs < 1000) {
    return `${Math.round(latencyMs)}ms`;
  }
  return `${(latencyMs / 1000).toFixed(1)}s`;
};

const copyToClipboard = async (): Promise<void> => {
  // This would be implemented with the actual result content
  try {
    // await navigator.clipboard.writeText(result.content);
    // Show success feedback
  } catch (error) {
    // Handle copy error
    console.error("Failed to copy to clipboard:", error);
  }
};
</script>

<style scoped>
.results-display {
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.result-loading,
.result-error,
.result-success,
.result-empty {
  flex: 1;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem;
}

.loading-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.loading-text p {
  margin: 0;
  color: #6b7280;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.result-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.result-meta {
  display: flex;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.result-content {
  margin-bottom: 1.5rem;
}

.response-text {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.response-text pre {
  margin: 0;
  font-family: "Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.result-metrics {
  margin-bottom: 1.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: center;
}

.metric-cost {
  background: #fef3e8;
  border-color: #fed7aa;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.metric-cost .metric-value {
  color: #ea580c;
}

.result-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-start;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .result-meta {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .meta-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .result-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
