<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click="handleOverlayClick">
      <div
        v-bind="$attrs"
        :class="dialogClasses"
        @click.stop
        role="dialog"
        :aria-labelledby="titleId"
        aria-modal="true"
      >
        <div class="dialog-header" v-if="$slots.header || title">
          <slot name="header">
            <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
          </slot>
          <button
            v-if="closable"
            class="dialog-close"
            @click="handleClose"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div class="dialog-body">
          <slot />
        </div>

        <div class="dialog-footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";

export interface BaseDialogProps {
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  closable?: boolean;
  closeOnOverlay?: boolean;
}

const props = withDefaults(defineProps<BaseDialogProps>(), {
  title: "",
  size: "md",
  closable: true,
  closeOnOverlay: true,
});

// Use defineModel for v-model binding
const isOpen = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  close: [];
}>();

// Make sure attributes can be inherited by the dialog div
defineOptions({
  inheritAttrs: false
});

const BASE_36 = 36;
const SUBSTRING_START = 2;
const SUBSTRING_LENGTH = 9;

const titleId = computed(
  () =>
    `dialog-title-${Math.random().toString(BASE_36).substr(SUBSTRING_START, SUBSTRING_LENGTH)}`,
);

const dialogClasses = computed(() => ["dialog", `dialog-${props.size}`]);

const handleClose = (): void => {
  isOpen.value = false;
  emit("close");
};

const handleOverlayClick = (): void => {
  if (props.closeOnOverlay) {
    handleClose();
  }
};

const handleEscapeKey = (event: KeyboardEvent): void => {
  if (event.key === "Escape" && props.closable) {
    handleClose();
  }
};

// Watch for dialog open/close to handle body overflow
watch(isOpen, (newValue) => {
  if (newValue) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
});

onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
  // Ensure body overflow is reset when component unmounts
  document.body.style.overflow = "";
});
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.2s ease-out;
}

.dialog-sm {
  width: 100%;
  max-width: 400px;
}

.dialog-md {
  width: 100%;
  max-width: 600px;
}

.dialog-lg {
  width: 100%;
  max-width: 800px;
}

.dialog-xl {
  width: 100%;
  max-width: 1200px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #f8f9fa;
  color: #495057;
}

.dialog-body {
  padding: 2rem;
}

.dialog-footer {
  padding: 1rem 2rem 1.5rem 2rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseDialog",
});
</script>
