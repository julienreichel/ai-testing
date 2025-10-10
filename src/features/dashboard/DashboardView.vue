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
        :value="testCases.length"
        :label="$t('dashboard.totalTests')"
        :detail="$t('dashboard.testCasesReady')"
        variant="tests"
      />

      <stat-card
        icon="🚀"
        :value="recentTestRuns.length"
        :label="$t('dashboard.recentRuns')"
        :detail="$t('dashboard.last24Hours')"
        variant="runs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "../../store";
import { useProvidersStore } from "../../store/providers";
import { StatCard } from "./components";

const appStore = useAppStore();
const providersStore = useProvidersStore();

const { testCases, recentTestRuns } = storeToRefs(appStore);
const { providerStatuses, validProviders } = storeToRefs(providersStore);

// Initialize provider data on component mount
onMounted(() => {
  providersStore.initialize();
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
}
</style>
