<template>
  <span :class="badgeClasses">
    <span v-if="icon" class="badge-icon">{{ icon }}</span>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface BaseBadgeProps {
  variant?:
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "light"
    | "dark";
  size?: "sm" | "md" | "lg";
  icon?: string;
  outlined?: boolean;
}

const props = withDefaults(defineProps<BaseBadgeProps>(), {
  variant: "primary",
  size: "md",
  icon: "",
  outlined: false,
});

const badgeClasses = computed(() => [
  "badge",
  `badge-${props.variant}`,
  `badge-${props.size}`,
  {
    "badge-outlined": props.outlined,
  },
]);
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  text-align: center;
  vertical-align: baseline;
  border: 1px solid transparent;
}

/* Sizes */
.badge-sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.badge-md {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.badge-lg {
  padding: 0.375rem 1rem;
  font-size: 1rem;
  gap: 0.5rem;
}

/* Variants - Solid */
.badge-primary {
  background: #007acc;
  color: white;
}

.badge-success {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
  border-color: #ffeaa7;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.badge-info {
  background: #cce7ff;
  color: #004085;
  border-color: #b3d7ff;
}

.badge-light {
  background: #e9ecef;
  color: #495057;
  border-color: #ced4da;
}

.badge-dark {
  background: #495057;
  color: white;
}

/* Outlined variants */
.badge-outlined {
  background: transparent;
}

.badge-outlined.badge-primary {
  color: #007acc;
  border-color: #007acc;
}

.badge-outlined.badge-success {
  background: transparent;
  color: #155724;
  border-color: #c3e6cb;
}

.badge-outlined.badge-warning {
  background: transparent;
  color: #856404;
  border-color: #ffeaa7;
}

.badge-outlined.badge-danger {
  background: transparent;
  color: #721c24;
  border-color: #f5c6cb;
}

.badge-outlined.badge-info {
  background: transparent;
  color: #004085;
  border-color: #b3d7ff;
}

.badge-outlined.badge-light {
  background: transparent;
  color: #495057;
  border-color: #ced4da;
}

.badge-outlined.badge-dark {
  background: transparent;
  color: #495057;
  border-color: #495057;
}

.badge-icon {
  font-size: 1rem;
  line-height: 1;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseBadge",
});
</script>
