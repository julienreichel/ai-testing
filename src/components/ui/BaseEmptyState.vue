<template>
  <div :class="emptyStateClasses">
    <div class="empty-state-icon" v-if="showIcon">
      <slot name="icon">
        <span class="empty-state-emoji">{{ defaultIcon }}</span>
      </slot>
    </div>

    <div class="empty-state-content">
      <h3 v-if="title" class="empty-state-title">
        {{ title }}
      </h3>

      <p v-if="description" class="empty-state-description">
        {{ description }}
      </p>

      <slot name="content" />
    </div>

    <div class="empty-state-actions" v-if="$slots.action || actionLabel">
      <slot name="action">
        <button
          v-if="actionLabel"
          class="empty-state-button"
          @click="handleAction"
        >
          {{ actionLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface BaseEmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "bordered";
  actionLabel?: string;
}

const props = withDefaults(defineProps<BaseEmptyStateProps>(), {
  title: "",
  description: "",
  icon: "",
  showIcon: true,
  size: "md",
  variant: "default",
  actionLabel: "",
});

const emit = defineEmits<{
  action: [];
}>();

const emptyStateClasses = computed(() => [
  "empty-state",
  `empty-state-${props.size}`,
  `empty-state-${props.variant}`,
]);

const defaultIcon = computed(() => {
  if (props.icon) {
    return props.icon;
  }
  return "📦"; // Default empty box icon
});

const handleAction = (): void => {
  emit("action");
};
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary, #6b7280);
}

.empty-state-icon {
  margin-bottom: 1rem;
}

.empty-state-emoji {
  font-size: 3rem;
  opacity: 0.6;
}

.empty-state-content {
  margin-bottom: 1.5rem;
}

.empty-state-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.empty-state-description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 400px;
}

.empty-state-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.empty-state-button {
  padding: 0.625rem 1.25rem;
  background: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-state-button:hover {
  background: var(--color-primary-hover, #2563eb);
  transform: translateY(-1px);
}

.empty-state-button:active {
  transform: translateY(0);
}

/* Size variants */
.empty-state-sm {
  padding: 1.5rem;
}

.empty-state-sm .empty-state-emoji {
  font-size: 2rem;
}

.empty-state-sm .empty-state-title {
  font-size: 1rem;
}

.empty-state-sm .empty-state-description {
  font-size: 0.8125rem;
}

.empty-state-lg {
  padding: 3rem;
}

.empty-state-lg .empty-state-emoji {
  font-size: 4rem;
}

.empty-state-lg .empty-state-title {
  font-size: 1.25rem;
}

.empty-state-lg .empty-state-description {
  font-size: 1rem;
}

/* Variant styles */
.empty-state-subtle {
  background: transparent;
  border: none;
}

.empty-state-bordered {
  border: 2px dashed var(--border-color, #d1d5db);
  border-radius: 8px;
  background: var(--bg-subtle, #f9fafb);
}

.empty-state-default {
  background: var(--bg-primary, #ffffff);
  border-radius: 8px;
}

/* Responsive */
@media (max-width: 640px) {
  .empty-state {
    padding: 1.5rem 1rem;
  }

  .empty-state-description {
    max-width: 300px;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseEmptyState",
});
</script>
