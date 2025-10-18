<template>
  <div class="results-display">
    <!-- Loading State - Single Run -->
    <div v-if="isRunning" class="result-state">
      <div class="result-header">
        <div class="header-left">
          <span class="response-label">{{
            $t("promptEditor.generatingResponse")
          }}</span>
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

    <!-- Loading State - Multiple Runs -->
    <div v-else-if="isRunningRepeated" class="result-state">
      <div class="result-header">
        <div class="header-left">
          <span class="response-label">{{
            $t("promptEditor.generatingMultipleResponses")
          }}</span>
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
          <p>{{ $t("promptEditor.pleaseWaitMultiple", { completed: completedRuns || 0, total: totalRuns || 0 }) }}</p>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${((completedRuns || 0) / (totalRuns || 1)) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="result-state">
      <div class="result-header">
        <div class="header-left">
          <span class="response-label error">{{
            $t("promptEditor.executionError")
          }}</span>
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
          <span class="latency">{{
            formatLatency(result.metadata.latency)
          }}</span>
        </div>
        <div class="header-right">
          <base-button variant="primary" size="sm" @click="$emit('saveAsTest')">
            {{ $t("promptEditor.saveAsTestCase") }}
          </base-button>
          <base-button
            variant="outline"
            size="sm"
            @click="$emit('clearResults')"
          >
            {{ $t("common.clear") }}
          </base-button>
        </div>
      </div>

      <!-- Second line: result of the prompt -->
      <div class="result-content">
        <div class="response-text">
          <pre>{{ result.content }}</pre>
        </div>

        <!-- Validation Results (if available) -->
        <div v-if="validationResult" class="validation-results">
          <div class="validation-header">
            <h4>{{ $t("rules.testResults") }}</h4>
            <div
              :class="[
                'validation-status',
                validationResult.pass ? 'pass' : 'fail',
              ]"
            >
              {{
                validationResult.pass ? $t("rules.passed") : $t("rules.failed")
              }}
            </div>
          </div>
          <div v-if="validationResult.results.length > 0" class="rule-results">
            <div
              v-for="ruleResult in validationResult.results"
              :key="ruleResult.ruleId"
              :class="['rule-result', ruleResult.pass ? 'pass' : 'fail']"
            >
              <div class="rule-result-header">
                <span class="rule-message">{{ ruleResult.message }}</span>
                <span
                  :class="['rule-status', ruleResult.pass ? 'pass' : 'fail']"
                >
                  {{ ruleResult.pass ? "✓" : "✗" }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Third line: tokens and cost -->
      <div class="result-footer">
        <div class="metrics">
          <span class="metric">
            <span class="metric-label"
              >{{ $t("promptEditor.inputTokens") }}:</span
            >
            <span class="metric-value">{{
              result.usage.inputTokens.toLocaleString()
            }}</span>
          </span>
          <span class="metric">
            <span class="metric-label"
              >{{ $t("promptEditor.outputTokens") }}:</span
            >
            <span class="metric-value">{{
              result.usage.outputTokens.toLocaleString()
            }}</span>
          </span>
          <span class="metric">
            <span class="metric-label"
              >{{ $t("promptEditor.totalTokens") }}:</span
            >
            <span class="metric-value">{{
              result.usage.totalTokens.toLocaleString()
            }}</span>
          </span>
          <span class="metric cost">
            <span class="metric-label">{{ $t("promptEditor.cost") }}:</span>
            <span class="metric-value"
              >${{ result.cost.totalCost.toFixed(4) }}</span
            >
          </span>
        </div>
      </div>
    </div>

    <!-- Multiple Results Display -->
    <div v-else-if="repeatedResults && repeatedResults.length > 0" class="result-state multi-results">
      <div class="result-header">
        <div class="header-left">
          <span class="response-label">{{ $t("promptEditor.multipleResults") }}</span>
          <span class="results-count">{{ repeatedResults.length }} results</span>
          <span v-if="repeatedErrors && repeatedErrors.length > 0" class="error-count">
            ({{ repeatedErrors.length }} errors)
          </span>
        </div>
        <div class="header-right">
          <base-button variant="primary" size="sm" @click="$emit('saveAsTest')">
            {{ $t("promptEditor.saveAsTestCase") }}
          </base-button>
          <base-button
            variant="outline"
            size="sm"
            @click="$emit('clearResults')"
          >
            {{ $t("common.clear") }}
          </base-button>
        </div>
      </div>

      <div class="result-content">
        <!-- Results Summary -->
        <div class="results-summary">
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-label">Success Rate:</span>
              <span class="stat-value">{{ Math.round((repeatedResults.length / ((repeatedResults.length || 0) + (repeatedErrors?.length || 0))) * 100) }}%</span>
            </div>
            <div class="stat">
              <span class="stat-label">Avg Latency:</span>
              <span class="stat-value">{{ formatAverageLatency(repeatedResults) }}ms</span>
            </div>
            <div class="stat">
              <span class="stat-label">Total Cost:</span>
              <span class="stat-value">${{ formatTotalCost(repeatedResults) }}</span>
            </div>
          </div>
        </div>

        <!-- Individual Results -->
        <div class="individual-results">
          <div v-for="(result, index) in repeatedResults" :key="`result-${index}`" class="result-item">
            <div class="result-item-header">
              <span class="result-index">Run {{ index + 1 }}</span>
              <span class="result-latency">{{ formatLatency(result.metadata.latency) }}</span>
              <span class="result-cost">${{ result.cost.totalCost.toFixed(4) }}</span>
            </div>
            <div class="result-item-content">
              <pre>{{ result.content.substring(0, PREVIEW_LENGTH) }}{{ result.content.length > PREVIEW_LENGTH ? '...' : '' }}</pre>
            </div>
          </div>

          <!-- Error Results -->
          <div v-if="repeatedErrors && repeatedErrors.length > 0" class="error-results">
            <h4>Errors ({{ repeatedErrors.length }})</h4>
            <div v-for="(error, index) in repeatedErrors" :key="`error-${index}`" class="error-item">
              <span class="error-text">{{ error }}</span>
            </div>
          </div>
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
import type { RuleSetResult } from "../../../types/rules";
import {
  BaseSpinner,
  BaseButton,
  BaseEmptyState,
} from "../../../components/ui";

interface ResultsDisplayProps {
  result: ProviderResponse | null;
  error: string | null;
  isRunning: boolean;
  validationResult?: RuleSetResult | null;
  // Multi-run support
  isRunningRepeated?: boolean;
  repeatedResults?: ProviderResponse[];
  repeatedErrors?: string[];
  completedRuns?: number;
  totalRuns?: number;
}

defineProps<ResultsDisplayProps>();

defineEmits<{
  cancel: [];
  retry: [];
  clearResults: [];
  saveAsTest: [];
}>();

const MILLISECONDS_PER_SECOND = 1000;
const DECIMAL_PLACES = 4;
const PREVIEW_LENGTH = 200;

const formatLatency = (latencyMs: number): string => {
  if (latencyMs < MILLISECONDS_PER_SECOND) {
    return `${Math.round(latencyMs)}ms`;
  }
  return `${(latencyMs / MILLISECONDS_PER_SECOND).toFixed(1)}s`;
};

const formatAverageLatency = (results: ProviderResponse[]): string => {
  if (results.length === 0) return "0";
  const totalLatency = results.reduce((sum, result) => sum + result.metadata.latency, 0);
  const avgLatency = totalLatency / results.length;
  return Math.round(avgLatency).toString();
};

const formatTotalCost = (results: ProviderResponse[]): string => {
  const totalCost = results.reduce((sum, result) => sum + result.cost.totalCost, 0);
  return totalCost.toFixed(DECIMAL_PLACES);
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

/* Validation Results Styles */
.validation-results {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.validation-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.validation-status {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.validation-status.pass {
  color: #10b981;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.validation-status.fail {
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.validation-summary {
  margin-bottom: 1rem;
}

.validation-message {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  color: #374151;
}

.validation-stats {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.rule-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-result {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.75rem;
}

.rule-result.pass {
  border-left: 4px solid #10b981;
}

.rule-result.fail {
  border-left: 4px solid #ef4444;
}

.rule-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.rule-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.rule-status {
  font-weight: 600;
  font-size: 0.875rem;
}

.rule-status.pass {
  color: #10b981;
}

.rule-status.fail {
  color: #ef4444;
}

.rule-message {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
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

/* Multi-results styles */
.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.multi-results .result-header {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.results-count,
.error-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.error-count {
  color: #ef4444;
}

.results-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.individual-results {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.result-item {
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.result-index {
  font-weight: 600;
  color: #374151;
}

.result-latency,
.result-cost {
  font-size: 0.875rem;
  color: #6b7280;
}

.result-item-content pre {
  margin: 0;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-results {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.error-results h4 {
  margin: 0 0 1rem 0;
  color: #dc2626;
  font-size: 1rem;
  font-weight: 600;
}

.error-item {
  padding: 0.5rem;
  background: white;
  border: 1px solid #fecaca;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.error-item:last-child {
  margin-bottom: 0;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
