<template>
  <div
    class="tooltip-container"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <!-- Default slot for the trigger element -->
    <slot />

    <!-- Tooltip element -->
    <div v-if="visible && hasText" class="custom-tooltip" :style="tooltipStyle">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  text: string;
  maxWidth?: number;
  maxHeight?: number;
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {

  delay: 0,
});

const visible = ref(false);
const position = ref({ x: 0, y: 0 });
let timeoutId: number | null = null;

const hasText = computed(() => props.text && props.text !== "-");

const tooltipStyle = computed(() => ({
  left: position.value.x + "px",
  top: position.value.y + "px",
  maxWidth: props.maxWidth ? props.maxWidth + "px" : "80%",
  maxHeight: props.maxHeight ? props.maxHeight + "px" : "80%",
}));

const showTooltip = (event: MouseEvent): void => {
  if (!hasText.value) return;

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const showTooltipNow = (): void => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const MARGIN = 10;
    position.value = {
      x: rect.left,
      y: rect.top - MARGIN,
    };
    visible.value = true;
  };

  if (props.delay > 0) {
    timeoutId = window.setTimeout(showTooltipNow, props.delay);
  } else {
    showTooltipNow();
  }
};

const hideTooltip = (): void => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  visible.value = false;
};
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CustomTooltip",
});
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-block;
}

.custom-tooltip {
  position: fixed;
  z-index: 1000;
  background: #1f2937;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-y: clip;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%) translateY(-100%);
  pointer-events: none;
  opacity: 1;
  animation: tooltipFadeIn 0.2s ease-out;
}

.custom-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1f2937;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(-100%) scale(1);
  }
}
</style>
