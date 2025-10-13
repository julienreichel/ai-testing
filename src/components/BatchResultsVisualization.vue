<template>
  <div class="batch-results-visualization">
    <!-- Progress Timeline Chart -->
    <base-card class="chart-card timeline-card">
      <template #header>
        <h4>{{ $t("batch.charts.timeline.title") }}</h4>
      </template>
      <div class="chart-container">
        <canvas ref="timelineChartRef"></canvas>
      </div>
    </base-card>

    <!-- Summary Statistics -->
    <base-card class="summary-card">
      <template #header>
        <h4>{{ $t("batch.charts.summary.title") }}</h4>
      </template>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value success">
            {{ statistics.passRate.toFixed(1) }}%
          </div>
          <div class="summary-label">
            {{ $t("batch.charts.summary.passRate") }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-value info">{{ statistics.p50Duration }}ms</div>
          <div class="summary-label">
            {{ $t("batch.charts.summary.p50Latency") }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-value warning">
            {{ statistics.p90Duration }}ms
          </div>
          <div class="summary-label">
            {{ $t("batch.charts.summary.p90Latency") }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-value purple">
            ${{ statistics.totalCost.toFixed(4) }}
          </div>
          <div class="summary-label">
            {{ $t("batch.charts.summary.totalCost") }}
          </div>
        </div>
      </div>
    </base-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
} from "chart.js";
import type { ChartConfiguration } from "chart.js";
import type {
  BatchRunResult,
  BatchStatistics,
} from "../composables/useBatchRunner";
import BaseCard from "./ui/BaseCard.vue";

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
);

interface Props {
  results: BatchRunResult[];
  statistics: BatchStatistics;
  isRunning?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isRunning: false,
});

// Chart refs
const timelineChartRef = ref<HTMLCanvasElement>();

// Chart instances
let timelineChart: Chart | null = null;

// Constants
const CHART_COLORS = {
  success: "#059669",
  error: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
  purple: "#7c3aed",
  gray: "#6b7280",
} as const;

const createTimelineChart = (): void => {
  if (!timelineChartRef.value) return;

  // Destroy existing chart if it exists
  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
  }

  const ctx = timelineChartRef.value.getContext("2d");
  if (!ctx) return;

  const maxRuns = Math.max(props.results.length, 1);
  const runIndices = Array.from({ length: maxRuns }, (_, i) => i + 1);

  // Calculate cumulative pass rates
  const PERCENT_MULTIPLIER = 100;
  const cumulativePassRates = runIndices.map((runIndex) => {
    const completedUpToNow = props.results
      .slice(0, runIndex)
      .filter((r) => r.status === "completed");
    const passedUpToNow = completedUpToNow.filter((r) => r.passed === true);
    return completedUpToNow.length > 0
      ? (passedUpToNow.length / completedUpToNow.length) * PERCENT_MULTIPLIER
      : 0;
  });

  const config: ChartConfiguration = {
    type: "line",
    data: {
      labels: runIndices.map((i) => `${i}`),
      datasets: [
        {
          label: "Cumulative Pass Rate (%)",
          data: cumulativePassRates,
          borderColor: CHART_COLORS.success,
          backgroundColor: `${CHART_COLORS.success}20`,
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    },
  };

  timelineChart = new Chart(ctx, config);
};

const destroyCharts = (): void => {
  try {
    timelineChart?.destroy();
  } catch (error) {
    console.warn("Error destroying charts:", error);
  }

  timelineChart = null;
};

const createCharts = async (): Promise<void> => {
  await nextTick();

  destroyCharts();

  if (props.results.length === 0) return;

  createTimelineChart();
};

const updateCharts = (): void => {
  if (props.results.length === 0) {
    destroyCharts();
    return;
  }

  // Recreate timeline chart as the data structure changes
  if (timelineChart) {
    void createCharts();
  }
};

// Lifecycle and watchers
onMounted(() => {
  if (props.results.length > 0) {
    void createCharts();
  }
});

watch(
  () => [props.results.length, props.statistics],
  () => {
    if (props.results.length === 0) {
      destroyCharts();
    } else if (timelineChart) {
      updateCharts();
    } else {
      void createCharts();
    }
  },
  { deep: true },
);

// Cleanup on unmount
onBeforeUnmount(() => {
  destroyCharts();
});
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BatchResultsVisualization",
});
</script>

<style scoped>
.batch-results-visualization {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-card {
  min-height: 300px;
}

.timeline-card {
  min-height: 250px;
  width: 100%;
}

.chart-container {
  position: relative;
  height: 250px;
  width: 100%;
  padding: 1rem;
}

.timeline-card .chart-container {
  height: 200px;
}

.summary-card {
  margin-top: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.summary-value.success {
  color: #059669;
}

.summary-value.info {
  color: #2563eb;
}

.summary-value.warning {
  color: #d97706;
}

.summary-value.purple {
  color: #7c3aed;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
</style>
