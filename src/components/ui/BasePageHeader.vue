<template>
  <header class="page-header">
    <div class="header-content">
      <div class="title-section">
        <base-breadcrumb
          v-if="breadcrumbItems && breadcrumbItems.length > 0"
          :items="breadcrumbItems"
        />
        <div class="title-wrapper">
          <h1 class="page-title">{{ title }}</h1>
          <p v-if="description" class="page-description">{{ description }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';

interface BreadcrumbItem {
  label: string;
  to?: string;
  action?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbItems?: BreadcrumbItem[];
}

defineProps<PageHeaderProps>();
</script>

<style scoped>
.page-header {
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 2rem;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  text-align: left;
}

.title-section {
  flex: 1;
  min-width: 0;
}

.title-wrapper {
  margin-top: 0.5rem;
}

.page-title {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.2;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

.header-actions {
  flex-shrink: 0;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .header-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BasePageHeader",
});
</script>
