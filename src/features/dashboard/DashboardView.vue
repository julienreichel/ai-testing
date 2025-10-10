<template>
  <div class="dashboard">
    <h1>{{ $t('dashboard.title') }}</h1>
    <div class="dashboard-grid">
      <div class="stats-card">
        <h3>{{ $t('dashboard.activeProviders') }}</h3>
        <p class="stat-number">{{ activeProviders.length }}</p>
      </div>
      <div class="stats-card">
        <h3>{{ $t('dashboard.totalTests') }}</h3>
        <p class="stat-number">{{ testCases.length }}</p>
      </div>
      <div class="stats-card">
        <h3>{{ $t('dashboard.recentRuns') }}</h3>
        <p class="stat-number">{{ recentTestRuns.length }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../store'

const appStore = useAppStore()
const { activeProviders, testCases, recentTestRuns } = storeToRefs(appStore)
</script>

<style scoped>
.dashboard {
  padding: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stats-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #007acc;
  margin: 0.5rem 0;
}
</style>
