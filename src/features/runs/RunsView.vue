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
          :project-id="selectedProjectId"
          :limit="50"
          @batch-run-selected="onBatchRunSelected"
        />
      </div>
    </div>

    <!-- Project Filter -->
    <div class="project-filter">
      <label for="project-select">{{ $t("runs.filter.project") }}</label>
      <select
        id="project-select"
        v-model="selectedProjectId"
        class="project-select"
      >
        <option value="">{{ $t("runs.filter.allProjects") }}</option>
        <option
          v-for="project in projects"
          :key="project.id"
          :value="project.id"
        >
          {{ project.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { testDB, type BatchRunSession } from "../../services/testManagementDatabase";
import type { Project } from "../../types/testManagement";
import BatchRunHistory from "../../components/BatchRunHistory.vue";

// State
const selectedProjectId = ref<string>("");
const projects = ref<Project[]>([]);

// Methods
const loadProjects = async (): Promise<void> => {
  try {
    const allProjects = await testDB.getProjects();
    projects.value = allProjects;
  } catch (error) {
    console.error("Failed to load projects:", error);
  }
};

const onBatchRunSelected = (batchRun: BatchRunSession): void => {
  console.log("Selected batch run:", batchRun);
  // Could navigate to detailed view or emit to parent
};

// Lifecycle
onMounted(async () => {
  await loadProjects();
});
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

.project-filter {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.project-filter label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.project-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.project-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

@media (max-width: 768px) {
  .runs-view {
    padding: 1rem;
  }

  .runs-header h1 {
    font-size: 2rem;
  }

  .project-filter {
    position: static;
    margin-top: 2rem;
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
