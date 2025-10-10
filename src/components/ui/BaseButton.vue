<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <base-spinner v-if="loading" :size="spinnerSize" />
    <slot v-if="!loading" />
    <template v-else>{{ loadingText }}</template>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseSpinner from "./BaseSpinner.vue";

export interface BaseButtonProps {
  variant?: "primary" | "outline" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  type?: "button" | "submit" | "reset";
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  loading: false,
  loadingText: "Loading...",
  type: "button",
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => [
  "btn",
  `btn-${props.variant}`,
  `btn-${props.size}`,
  {
    "btn-loading": props.loading,
  },
]);

const spinnerSize = computed(() => {
  switch (props.size) {
    case "sm":
      return "sm";
    case "lg":
      return "lg";
    default:
      return "md";
  }
});

const handleClick = (event: MouseEvent): void => {
  if (!props.disabled && !props.loading) {
    emit("click", event);
  }
};
</script>

<style scoped>
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  min-height: 32px;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  min-height: 48px;
}

.btn-loading {
  cursor: wait;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseButton",
});
</script>
