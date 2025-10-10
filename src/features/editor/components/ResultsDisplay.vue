<template>
  <div class="results-display">
    <!-- Loading State -->
    <div v-if="isRunning" class="result-state">
      <div class="result-header">
        <div class="header-left">
          <span class="response-label">{{ $t("promptEditor.generatingResponse") }}</span>
          <base-spinner size="sm" class="header-spinner" />
        </div>
        <div class="header-right">
          <base-button variant="outline" size="sm" @click="$emit('cancel')">
            {{ $t("common.cancel") }}
          </base-button>
        </div>
      </div>

      <div class="result-content">
        <div class="loading-placeholder">
          <p>{{ $t("promptEditor.pleaseWait") }}</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="result-state">
      <div class="result-header">
        <div class="header-left">
          <span class="response-label error">{{ $t('promptEditor.executionError') }}</span>
        </div>
        <div class="header-right">
          <base-button variant="outline" size="sm" @click="$emit('retry')">
            {{ $t("common.retry") }}
          </base-button>
        </div>
      </div>

      <div class="result-content">
        <div class="error-content">
          <p>{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Success Result -->
    <div v-else-if="result" class="result-state">
      <!-- First line: response and latency -->
      <div class="result-header">
        <div class="header-left">
          <span class="response-label">{{ $t("promptEditor.response") }}</span>
          <span class="latency">{{ formatLatency(result.metadata.latency) }}</span>
        </div>
        <div class="header-right">
          <base-button variant="primary" size="sm" @click="$emit('saveAsTest')">
            {{ $t("promptEditor.saveAsTestCase") }}
          </base-button>
          <base-button variant="outline" size="sm" @click="copyToClipboard">
            {{ $t("common.copy") }}
          </base-button>
          <base-button variant="outline" size="sm" @click="$emit('clearResults')">
            {{ $t("common.clear") }}
          </base-button>
        </div>
      </div>

      <!-- Second line: result of the prompt -->
      <div class="result-content">
        <div class="response-text">
          <pre>{{ result.content }}</pre>
        </div>
      </div>

      <!-- Third line: tokens and cost -->
      <div class="result-footer">
        <div class="metrics">
          <span class="metric">
            <span class="metric-label">{{ $t("promptEditor.inputTokens") }}:</span>
            <span class="metric-value">{{ result.usage.inputTokens.toLocaleString() }}</span>
          </span>
          <span class="metric">
            <span class="metric-label">{{ $t("promptEditor.outputTokens") }}:</span>
            <span class="metric-value">{{ result.usage.outputTokens.toLocaleString() }}</span>
          </span>
          <span class="metric">
            <span class="metric-label">{{ $t("promptEditor.totalTokens") }}:</span>
            <span class="metric-value">{{ result.usage.totalTokens.toLocaleString() }}</span>
          </span>
          <span class="metric cost">
            <span class="metric-label">{{ $t("promptEditor.cost") }}:</span>
            <span class="metric-value">${{ result.cost.totalCost.toFixed(4) }}</span>
          </span>
        </div>
      </div>
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
  BaseSpinner,
  BaseButton,
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.result-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* First line: response and latency with action buttons */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.response-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.response-label.error {
  color: #dc2626;
}

.header-spinner {
  margin-left: 0.5rem;
}

.latency {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

/* Second line: result content */
.result-content {
  flex: 1;
  margin-bottom: 1rem;
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

.loading-placeholder {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.error-content {
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
}

/* Third line: tokens and cost */
.result-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.metrics {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.metric.cost .metric-value {
  color: #ea580c;
  font-weight: 700;
}

@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-left {
    justify-content: space-between;
  }

  .header-right {
    justify-content: center;
  }

  .metrics {
    flex-direction: column;
    gap: 0.5rem;
  }

  .metric {
    justify-content: space-between;
  }
}
</style>
