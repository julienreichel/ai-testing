<template>
  <div
    v-if="visible"
    class="batch-run-modal-overlay"
    @click="handleOverlayClick"
  >
    <div class="batch-run-modal" @click.stop>
      <div class="modal-header">
        <h3>
          {{ testCaseName }} - {{ $t("runs.batchHistory.details") }}
        </h3>
        <base-button variant="outline" @click="handleClose">
          ✕ {{ $t("common.close") }}
        </base-button>
      </div>

      <div class="modal-content">
        <!-- Test Case Details -->
        <div class="test-case-details" v-if="testCase">
          <div class="detail-section">
            <h4>{{ $t("runs.batchHistory.testDetails") }}</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>{{ $t("runs.batchHistory.provider") }}:</label>
                <span>{{ providerName }}</span>
              </div>
              <div class="detail-item">
                <label>{{ $t("runs.batchHistory.model") }}:</label>
                <span>{{ batchRun.model }}</span>
              </div>
              <div class="detail-item prompt-item">
                <label>{{ $t("runs.batchHistory.prompt") }}:</label>
                <div class="prompt-text">{{ testCase.prompt }}</div>
              </div>
            </div>
          </div>
        </div>

        <batch-results-visualization
          :results="batchRun.results"
          :statistics="batchRun.statistics"
        />

        <div class="run-results-table">
          <h4>{{ $t("runs.batchHistory.individualResults") }}</h4>
          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>{{ $t("runs.table.runIndex") }}</th>
                  <th>{{ $t("runs.table.status") }}</th>
                  <th>{{ $t("runs.table.duration") }}</th>
                  <th>{{ $t("runs.table.passed") }}</th>
                  <th>{{ $t("runs.table.response") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="result in batchRun.results"
                  :key="result.id"
                  :class="{
                    'failed-run':
                      result.status === 'failed' || result.passed === false,
                  }"
                >
                  <td>{{ result.runIndex + 1 }}</td>
                  <td>
                    <base-badge :variant="getResultStatusVariant(result)">
                      {{ result.status }}
                    </base-badge>
                  </td>
                  <td>
                    {{
                      result.duration ? Math.round(result.duration) + "ms" : "-"
                    }}
                  </td>
                  <td>
                    <base-badge
                      :variant="result.passed ? 'success' : 'danger'"
                    >
                      {{ result.passed ? $t("common.yes") : $t("common.no") }}
                    </base-badge>
                  </td>
                  <td class="response-cell">
                    <custom-tooltip :text="result.response || ''">
                      <div class="response-text-container">
                        <div class="response-text">
                          {{ result.response || "-" }}
                        </div>
                      </div>
                    </custom-tooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BatchRunSession } from "../../../services/testManagementDatabase";
import type { TestCase } from "../../../types/testManagement";
import type { BatchRunResult } from "../../../composables/useBatchRunner";
import BaseButton from "../../../components/ui/BaseButton.vue";
import BaseBadge from "../../../components/ui/BaseBadge.vue";
import BatchResultsVisualization from "./BatchResultsVisualization.vue";
import CustomTooltip from "../../../components/ui/CustomTooltip.vue";

interface Props {
  visible: boolean;
  batchRun: BatchRunSession;
  testCase: TestCase | null;
  testCaseName: string;
  providerName: string;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const handleClose = (): void => {
  emit("close");
};

const handleOverlayClick = (): void => {
  emit("close");
};

const getResultStatusVariant = (
  result: BatchRunResult,
): "success" | "danger" | "warning" | "info" => {
  if (result.status === "completed") {
    return result.passed ? "success" : "warning";
  }
  return result.status === "failed" ? "danger" : "info";
};
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BatchRunDetailsModal",
});
</script>

<style scoped>
/* Modal Styles */
.batch-run-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.batch-run-modal {
  background: white;
  color: #000;
  border-radius: 8px;
  max-width: min(90%, 980px);
  max-height: 80%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: clip;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.test-case-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
}

.detail-item span {
  color: #333;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.prompt-item {
  grid-column: 1 / -1;
}

.prompt-text {
  color: #333;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.run-results-table {
  color: black;
}

.run-results-table h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.results-table th,
.results-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.results-table th {
  font-weight: 600;
  color: #374151;
  background-color: #f9fafb;
}

.results-table tr.failed-run {
  background-color: #fef2f2;
}

.results-table tr:hover {
  background-color: #f9fafb;
}

.results-table tr.failed-run:hover {
  background-color: #fee2e2;
}

.response-cell {
  max-width: 300px;
  padding: 0.5rem;
  position: relative;
  overflow: hidden;
}

.response-text-container {
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 8px;
  transition: background-color 0.2s ease;
}

.response-text-container:hover {
  background-color: #f3f4f6;
}

.response-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #374151;
}
</style>
