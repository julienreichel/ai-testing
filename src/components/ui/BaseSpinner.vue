<template>
  <div :class="spinnerClasses">
    <div class="spinner-inner"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface BaseSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "dark";
}

const props = withDefaults(defineProps<BaseSpinnerProps>(), {
  size: "md",
  color: "primary",
});

const spinnerClasses = computed(() => [
  "spinner",
  `spinner-${props.size}`,
  `spinner-${props.color}`,
]);
</script>

<style scoped>
.spinner {
  display: inline-block;
}

.spinner-inner {
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Sizes */
.spinner-sm .spinner-inner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
}

.spinner-md .spinner-inner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
}

.spinner-lg .spinner-inner {
  width: 24px;
  height: 24px;
  border: 3px solid transparent;
}

/* Colors */
.spinner-primary .spinner-inner {
  border-top-color: #007acc;
  border-right-color: rgba(0, 122, 204, 0.3);
}

.spinner-white .spinner-inner {
  border-top-color: white;
  border-right-color: rgba(255, 255, 255, 0.3);
}

.spinner-dark .spinner-inner {
  border-top-color: #141515;
  border-right-color: rgba(20, 21, 21, 0.3);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseSpinner",
});
</script>
