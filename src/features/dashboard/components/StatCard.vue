<template>
  <base-card variant="elevated" padding="lg" class="stat-card">
    <div class="stat-content">
      <div :class="iconClasses">{{ icon }}</div>
      <div class="stat-info">
        <h3 class="stat-number">{{ value }}</h3>
        <p class="stat-label">{{ label }}</p>
        <p class="stat-detail">{{ detail }}</p>
      </div>
    </div>
  </base-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { BaseCard } from "../../../components/ui";

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  detail: string;
  variant: "providers" | "tests" | "runs";
}

const props = defineProps<StatCardProps>();

const iconClasses = computed(() => [
  "stat-icon",
  `stat-icon-${props.variant}`,
]);
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-icon-providers {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.stat-icon-tests {
  background: linear-gradient(135deg, #10b981, #047857);
}

.stat-icon-runs {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.25rem 0;
  line-height: 1;
}

.stat-label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.125rem 0;
}

.stat-detail {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}
</style>