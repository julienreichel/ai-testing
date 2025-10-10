<template>
  <div :class="cardClasses" @click="handleClick">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>

    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface BaseCardProps {
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<BaseCardProps>(), {
  variant: "default",
  padding: "md",
  hover: false,
  clickable: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const cardClasses = computed(() => [
  "card",
  `card-${props.variant}`,
  `card-padding-${props.padding}`,
  {
    "card-hover": props.hover,
    "card-clickable": props.clickable,
  },
]);

const handleClick = (event: MouseEvent): void => {
  if (props.clickable) {
    emit("click", event);
  }
};
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  transition: all 0.2s;
}

.card-default {
  border: 1px solid #e9ecef;
}

.card-outlined {
  border: 2px solid #e9ecef;
}

.card-elevated {
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:hover {
  border-color: #007acc;
}

/* Padding variants */
.card-padding-none .card-body {
  padding: 0;
}

.card-padding-sm .card-body {
  padding: 0.75rem;
}

.card-padding-md .card-body {
  padding: 1.5rem;
}

.card-padding-lg .card-body {
  padding: 2rem;
}

.card-header {
  padding: 1rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.card-footer {
  padding: 0 1.5rem 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  margin-top: 1rem;
  padding-top: 1rem;
}

.card-actions {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: center;
}

/* Special layout for provider cards */
.card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: auto;
}

.card-content {
  flex: 1;
}

.card-actions-inline {
  flex-shrink: 0;
  margin-left: 1rem;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseCard",
});
</script>
