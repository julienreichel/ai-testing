<template>
  <div class="runs-view">
    <div class="runs-header">
      <h1>{{ $t("runs.title") }}</h1>
      <p>{{ $t("runs.description") }}</p>
    </div>

    <div class="runs-content">
      <!-- Batch Runs Content -->
      <div class="tab-content">
        <batch-run-history
          :limit="50"
          @batch-run-selected="onBatchRunSelected"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BatchRunSession } from "../../services/testManagementDatabase";
import BatchRunHistory from "../../components/BatchRunHistory.vue";

// Methods
const onBatchRunSelected = (batchRun: BatchRunSession): void => {
  console.log("Selected batch run:", batchRun);
  // Could navigate to detailed view or emit to parent
};
</script>

<style scoped>
.runs-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.runs-header {
  margin-bottom: 2rem;
}

.runs-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
}

.runs-header p {
  margin: 0;
  font-size: 1.125rem;
  color: #6b7280;
}

.runs-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tabs-container {
  border-bottom: 1px solid #e5e7eb;
}

.tabs {
  display: flex;
  gap: 1rem;
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  min-height: 400px;
}

.individual-runs-placeholder {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.individual-runs-placeholder h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #374151;
}

.individual-runs-placeholder p {
  margin: 0 0 0.5rem 0;
}

.coming-soon {
  font-style: italic;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .runs-view {
    padding: 1rem;
  }

  .runs-header h1 {
    font-size: 2rem;
  }

  .tabs {
    flex-wrap: wrap;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RunsView",
});
</script>
