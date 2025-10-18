<template>
  <div class="progress-section">
    <div class="progress-header">
      <span>{{
        $t("batch.progress.completed", {
          completed: completedRuns,
          total: totalRuns,
        })
      }}</span>
      <span>{{ Math.round(progressPercentage) }}%</span>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar" :style="progressBarStyle"></div>
    </div>

    <!-- Real-time Statistics -->
    <div v-if="showStatistics" class="stats-grid">
      <div class="stat-item">
        <div class="stat-value stat-success">
          {{ statistics.passedRuns }}
        </div>
        <div class="stat-label">{{ $t("batch.stats.passed") }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value stat-error">
          {{ statistics.failedRuns }}
        </div>
        <div class="stat-label">{{ $t("batch.stats.failed") }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value stat-info">
          {{ Math.round(statistics.avgDuration) }}ms
        </div>
        <div class="stat-label">{{ $t("batch.stats.avgLatency") }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value stat-purple">
          ${{ statistics.totalCost.toFixed(4) }}
        </div>
        <div class="stat-label">{{ $t("batch.stats.totalCost") }}</div>
      </div>
    </div>

    <!-- Results Preview (for QuickRun mode) -->
    <div v-if="showResultsPreview && recentResults.length > 0" class="results-preview">
      <h4>{{ $t("quickRun.latestResults") }}</h4>
      <div class="results-list">
        <div
          v-for="(result, index) in recentResults"
          :key="index"
          class="result-item"
        >
          <span class="result-index">{{ index + 1 }}</span>
          <span class="result-preview">
            {{ result.content.substring(0, 100) }}...
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface BatchStatistics {
  passedRuns: number;
  failedRuns: number;
  avgDuration: number;
  totalCost: number;
}

interface ResultPreview {
  content: string;
}

interface Props {
  completedRuns: number;
  totalRuns: number;
  progressPercentage: number;
  showStatistics?: boolean;
  showResultsPreview?: boolean;
  statistics?: BatchStatistics;
  recentResults?: ResultPreview[];
}

const props = withDefaults(defineProps<Props>(), {
  showStatistics: true,
  showResultsPreview: false,
  statistics: () => ({
    passedRuns: 0,
    failedRuns: 0,
    avgDuration: 0,
    totalCost: 0,
  }),
  recentResults: () => [],
});

const progressBarStyle = computed(() => ({
  width: `${props.progressPercentage}%`,
}));
</script>

<style scoped>
/* Progress Section */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #2563eb;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stat-success {
  color: #059669;
}

.stat-error {
  color: #dc2626;
}

.stat-info {
  color: #2563eb;
}

.stat-purple {
  color: #7c3aed;
}

.stat-label {
  color: #6b7280;
}

/* Results Preview */
.results-preview {
  margin-top: 1rem;
}

.results-preview h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 8rem;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.result-index {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.75rem;
  color: #374151;
}

.result-preview {
  flex: 1;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
