<template>
  <div class="batch-run-history">
    <div class="history-header">
      <h3>{{ $t("runs.batchHistory.title") }}</h3>
      <div class="header-controls">
        <div class="search-filter">
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="$t('runs.filter.search')"
            class="search-input"
          >
        </div>
        <base-button
          variant="outline"
          @click="refreshHistory"
          :loading="isLoading"
        >
          ↻ {{ $t("common.refresh") }}
        </base-button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>{{ $t("common.loading") }}</p>
    </div>

    <div v-else-if="filteredBatchRuns.length === 0" class="empty-state">
      <p v-if="searchTerm">{{ $t("runs.filter.noResults") }}</p>
      <p v-else>{{ $t("runs.batchHistory.empty") }}</p>
    </div>

    <div v-else class="batch-runs-table-container">
      <table class="batch-runs-table">
        <thead>
          <tr>
            <th>{{ $t("runs.table.testName") }}</th>
            <th>{{ $t("runs.table.provider") }}</th>
            <th>{{ $t("runs.table.passRate") }}</th>
            <th>{{ $t("runs.table.cost") }}</th>
            <th>{{ $t("runs.table.date") }}</th>
            <th>{{ $t("runs.table.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="batchRun in filteredBatchRuns"
            :key="batchRun.id"
            class="batch-run-row"
          >
            <td class="test-name-cell">
              <div class="test-name">
                {{ getTestCaseName(batchRun) }}
              </div>
              <div class="test-meta">
                {{ batchRun.config.runCount }} runs • {{ batchRun.status }}
              </div>
            </td>
            <td class="provider-cell">
              <div class="provider-info">
                <div class="provider">{{ getProviderName(batchRun.config.providerId) }}</div>
                <div class="model">{{ batchRun.config.model }}</div>
              </div>
            </td>
            <td class="pass-rate-cell">
              <div class="pass-rate">
                <span class="rate-value" :class="getPassRateClass(batchRun.statistics.passRate)">
                  {{ Math.round(batchRun.statistics.passRate) }}%
                </span>
                <div class="rate-meta">
                  {{ batchRun.statistics.passedRuns }}/{{ batchRun.statistics.totalRuns }}
                </div>
              </div>
            </td>
            <td class="cost-cell">
              <span class="cost-value">${{ batchRun.statistics.totalCost.toFixed(4) }}</span>
            </td>
            <td class="date-cell">
              <div class="date-info">
                <div class="date">{{ formatDate(batchRun.createdAt) }}</div>
                <div class="time">{{ formatTime(batchRun.createdAt) }}</div>
              </div>
            </td>
            <td class="actions-cell">
              <div class="action-buttons">
                <base-button
                  variant="outline"
                  size="sm"
                  @click="viewDetails(batchRun)"
                  :title="$t('common.viewDetails')"
                >
                  👁️
                </base-button>
                <base-button
                  variant="outline"
                  size="sm"
                  @click="exportResults(batchRun)"
                  :title="$t('batch.actions.export')"
                >
                  📥
                </base-button>
                <base-button
                  variant="danger"
                  size="sm"
                  @click="deleteBatchRun(batchRun)"
                  :title="$t('common.delete')"
                >
                  🗑️
                </base-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detailed View Modal -->
    <div v-if="selectedBatchRun" class="batch-run-modal-overlay" @click="closeBatchRunDetails">
      <div class="batch-run-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ getTestCaseName(selectedBatchRun) }} - {{ $t("runs.batchHistory.details") }}</h3>
          <base-button variant="outline" @click="closeBatchRunDetails">
            ✕ {{ $t("common.close") }}
          </base-button>
        </div>

        <div class="modal-content">
          <batch-results-visualization
            :results="selectedBatchRun.results"
            :statistics="selectedBatchRun.statistics"
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
                    <th>{{ $t("runs.table.cost") }}</th>
                    <th>{{ $t("runs.table.passed") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="result in selectedBatchRun.results"
                    :key="result.id"
                    :class="{ 'failed-run': result.status === 'failed' || result.passed === false }"
                  >
                    <td>{{ result.runIndex + 1 }}</td>
                    <td>
                      <base-badge :variant="getResultStatusVariant(result)">
                        {{ result.status }}
                      </base-badge>
                    </td>
                    <td>{{ result.duration ? Math.round(result.duration) + 'ms' : '-' }}</td>
                    <td>{{ result.cost ? '$' + result.cost.toFixed(4) : '-' }}</td>
                    <td>
                      <base-badge :variant="result.passed ? 'success' : 'danger'">
                        {{ result.passed ? $t("common.yes") : $t("common.no") }}
                      </base-badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useBatchRunPersistence } from "../composables/useBatchRunPersistence";
import { useProvidersStore } from "../store/providers";
import type { BatchRunSession } from "../services/testManagementDatabase";
import type { BatchRunResult } from "../composables/useBatchRunner";
import BaseButton from "./ui/BaseButton.vue";
import BatchResultsVisualization from "./BatchResultsVisualization.vue";

interface Props {
  projectId?: string;
  testCaseId?: string;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
  testCaseId: undefined,
  limit: 20,
});

// State
const isLoading = ref(false);
const selectedBatchRun = ref<BatchRunSession | null>(null);
const searchTerm = ref("");

// Composables
const batchPersistence = useBatchRunPersistence();
const providersStore = useProvidersStore();

// Computed
const batchRuns = computed(() => batchPersistence.recentSessions.value);

const filteredBatchRuns = computed(() => {
  if (!searchTerm.value.trim()) {
    return batchRuns.value;
  }

  const term = searchTerm.value.toLowerCase().trim();
  return batchRuns.value.filter((batchRun) => {
    const testName = getTestCaseName(batchRun).toLowerCase();
    const provider = getProviderName(batchRun.config.providerId).toLowerCase();
    const model = batchRun.config.model.toLowerCase();
    

    return testName.includes(term) || 
           provider.includes(term) || 
           model.includes(term);
  });
});

// Methods
const refreshHistory = async (): Promise<void> => {
  isLoading.value = true;
  try {
    await batchPersistence.loadRecentBatchRuns(props.projectId, props.limit);
  } catch (error) {
    console.error("Failed to load batch run history:", error);
  } finally {
    isLoading.value = false;
  }
};



const viewDetails = (batchRun: BatchRunSession): void => {
  selectedBatchRun.value = batchRun;
};

const closeBatchRunDetails = (): void => {
  selectedBatchRun.value = null;
};

const exportResults = (batchRun: BatchRunSession): void => {
  const csvContent = "data:text/csv;charset=utf-8," +
    "Run,Status,Duration,Cost,Passed,Response\n" +
    batchRun.results.map((r: BatchRunResult) =>
      `${r.runIndex + 1},${r.status},${r.duration || 0},${r.cost || 0},${r.passed},${r.response?.replace(/,/g, ';') || ''}`
    ).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `batch_results_${batchRun.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const deleteBatchRun = async (batchRun: BatchRunSession): Promise<void> => {
  if (!confirm(`Are you sure you want to delete this batch run? This action cannot be undone.`)) {
    return;
  }

  try {
    await batchPersistence.deleteBatchRun(batchRun.id);
    await refreshHistory();
  } catch (error) {
    console.error("Failed to delete batch run:", error);
    alert("Failed to delete batch run. Please try again.");
  }
};

const getTestCaseName = (batchRun: BatchRunSession): string => {
  const TEST_CASE_ID_SUFFIX_LENGTH = 8;
  return batchRun.testCaseSnapshot.name || batchRun.config.testCase.name || `Test Case ${batchRun.testCaseId.slice(-TEST_CASE_ID_SUFFIX_LENGTH)}`;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getPassRateClass = (passRate: number): string => {
  const EXCELLENT_THRESHOLD = 90;
  const GOOD_THRESHOLD = 70;
  const FAIR_THRESHOLD = 50;
  
  if (passRate >= EXCELLENT_THRESHOLD) return "excellent";
  if (passRate >= GOOD_THRESHOLD) return "good";
  if (passRate >= FAIR_THRESHOLD) return "fair";
  return "poor";
};

const getProviderName = (providerId: string): string => {
  const providerStatus = providersStore.providerStatuses.find(status => status.id === providerId);
  return providerStatus?.name || providerId;
};



const getResultStatusVariant = (result: BatchRunResult): "success" | "danger" | "warning" | "info" => {
  if (result.status === "completed") {
    return result.passed ? "success" : "warning";
  }
  return result.status === "failed" ? "danger" : "info";
};

// Lifecycle
onMounted(() => {
  void refreshHistory();
});
</script>

<style scoped>
.batch-run-history {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.history-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-filter {
  display: flex;
  align-items: center;
}

.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 250px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.batch-runs-table-container {
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.batch-runs-table {
  width: 100%;
  border-collapse: collapse;
}

.batch-runs-table th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.batch-runs-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.batch-run-row:hover {
  background: #f9fafb;
}

.test-name-cell {
  min-width: 200px;
}

.test-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.test-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.provider-cell {
  min-width: 150px;
}

.provider-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.provider {
  font-weight: 500;
  color: #374151;
}

.model {
  font-size: 0.875rem;
  color: #6b7280;
}

.pass-rate-cell {
  min-width: 120px;
}

.pass-rate {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.rate-value {
  font-weight: 600;
  font-size: 1rem;
}

.rate-value.excellent {
  color: #059669;
}

.rate-value.good {
  color: #65a30d;
}

.rate-value.fair {
  color: #d97706;
}

.rate-value.poor {
  color: #dc2626;
}

.rate-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.cost-cell {
  min-width: 100px;
}

.cost-value {
  font-weight: 500;
  color: #7c3aed;
}

.date-cell {
  min-width: 120px;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date {
  font-weight: 500;
  color: #374151;
}

.time {
  font-size: 0.875rem;
  color: #6b7280;
}

.actions-cell {
  min-width: 150px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

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
  max-width: 90vw;
  max-height: 90vh;
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
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BatchRunHistory",
});
</script>
