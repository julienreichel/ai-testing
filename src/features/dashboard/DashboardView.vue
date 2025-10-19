<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>{{ $t("dashboard.title") }}</h1>
      <p class="dashboard-subtitle">{{ $t("dashboard.subtitle") }}</p>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <stat-card
        icon="🔑"
        :value="validProviders.length"
        :label="$t('dashboard.activeProviders')"
        :detail="$t('dashboard.outOf', { total: providerStatuses.length })"
        variant="providers"
      />

      <stat-card
        icon="📋"
        :value="totalTestCases"
        :label="$t('dashboard.totalTests')"
        :detail="$t('dashboard.testCasesReady')"
        variant="tests"
      />

      <stat-card
        icon="🚀"
        :value="recentRunsCount"
        :label="$t('dashboard.recentRuns')"
        :detail="$t('dashboard.last24Hours')"
        variant="runs"
      />
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>{{ $t("dashboard.quickActions") }}</h2>
      <div class="actions-grid">
        <div class="action-card">
          <h3>{{ $t("dashboard.createTest") }}</h3>
          <p>{{ $t("dashboard.createTestDescription") }}</p>
          <base-button variant="primary" @click="() => router.push('/editor')">
            {{ $t("dashboard.createTest") }}
          </base-button>
        </div>

        <div class="action-card">
          <h3>{{ $t("testManagement.title") }}</h3>
          <p>Import and export test projects for team collaboration</p>
          <test-export-import />
        </div>

        <div class="action-card">
          <h3>{{ $t("dashboard.viewResults") }}</h3>
          <p>{{ $t("dashboard.viewResultsDescription") }}</p>
          <base-button variant="outline" @click="() => router.push('/runs')">
            {{ $t("dashboard.viewResults") }}
          </base-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useProvidersStore } from "@/store/providers";
import { useTestManagement } from "../../composables/useTestManagement";
import { useBatchRunPersistence } from "../../composables/useBatchRunPersistence";
import { StatCard } from "./components";
import { BaseButton } from "components/ui";
import { TestExportImport } from "../tests/components";

const router = useRouter();
const providersStore = useProvidersStore();
const testManagement = useTestManagement();
const batchPersistence = useBatchRunPersistence();

const { providerStatuses, validProviders } = storeToRefs(providersStore);

// Get real data from composables
const totalTestCases = ref(0);

const recentRunsCount = computed(() => {
  return batchPersistence.recentSessions.value.length;
});

// Initialize all data on component mount
onMounted(async () => {
  await testManagement.initialize();
  providersStore.initialize();
  await batchPersistence.loadRecentBatchRuns();

  // Load total test case count
  totalTestCases.value = await testManagement.getTotalTestCaseCount();
});
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
}

.dashboard-subtitle {
  margin: 0;
  font-size: 1.125rem;
  color: #6b7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.quick-actions {
  margin-top: 2rem;
}

.quick-actions h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.action-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.action-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  flex: 1;
}
</style>
