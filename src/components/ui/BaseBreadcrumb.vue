<template>
  <nav class="breadcrumb" aria-label="Breadcrumb navigation">
    <ol class="breadcrumb-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumb-item"
      >
        <button
          v-if="item.action && index < items.length - 1"
          @click="item.action"
          class="breadcrumb-link"
          type="button"
        >
          {{ item.label }}
        </button>
        <router-link
          v-else-if="item.to && index < items.length - 1"
          :to="item.to"
          class="breadcrumb-link"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          class="breadcrumb-current"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
        <span
          v-if="index < items.length - 1"
          class="breadcrumb-separator"
          aria-hidden="true"
        >
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string;
  to?: string;
  action?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

defineProps<BreadcrumbProps>();
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 1rem;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  font-size: 0.875rem;
  font-family: inherit;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #9ca3af;
  user-select: none;
}

.breadcrumb-current {
  color: #374151;
  font-weight: 500;
}

/* Focus styles for accessibility */
.breadcrumb-link:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Router link styles */
a.breadcrumb-link {
  color: #6366f1;
  text-decoration: none;
}

a.breadcrumb-link:hover {
  text-decoration: underline;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseBreadcrumb",
});
</script>
