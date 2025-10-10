<template>
  <Teleport to="body">
    <div v-if="modelValue" :class="toastClasses" @click="handleClick">
      <div class="toast-icon" v-if="showIcon">
        <span>{{ iconText }}</span>
      </div>

      <div class="toast-content">
        <div class="toast-title" v-if="title">{{ title }}</div>
        <div class="toast-message">
          <slot>{{ message }}</slot>
        </div>
      </div>

      <button
        v-if="closable"
        class="toast-close"
        @click="handleClose"
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";

export interface BaseToastProps {
  modelValue: boolean;
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  autoHide?: boolean;
  duration?: number;
  closable?: boolean;
  showIcon?: boolean;
  clickToClose?: boolean;
}

const props = withDefaults(defineProps<BaseToastProps>(), {
  type: "info",
  title: "",
  message: "",
  position: "top-right",
  autoHide: true,
  duration: 4000,
  closable: true,
  showIcon: true,
  clickToClose: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
}>();

let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

const toastClasses = computed(() => [
  "toast",
  `toast-${props.type}`,
  `toast-${props.position}`,
  {
    "toast-clickable": props.clickToClose,
  },
]);

const iconText = computed(() => {
  switch (props.type) {
    case "success":
      return "✅";
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "info":
    default:
      return "ℹ️";
  }
});

const handleClose = (): void => {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
  emit("update:modelValue", false);
  emit("close");
};

const handleClick = (): void => {
  if (props.clickToClose) {
    handleClose();
  }
};

onMounted(() => {
  if (props.autoHide && props.duration > 0) {
    autoHideTimer = setTimeout(() => {
      handleClose();
    }, props.duration);
  }
});

onUnmounted(() => {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
  }
});
</script>

<style scoped>
.toast {
  position: fixed;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 300px;
  max-width: 500px;
  animation: slideIn 0.3s ease-out;
}

/* Positions */
.toast-top-right {
  top: 1rem;
  right: 1rem;
  animation-name: slideInRight;
}

.toast-top-left {
  top: 1rem;
  left: 1rem;
  animation-name: slideInLeft;
}

.toast-bottom-right {
  bottom: 1rem;
  right: 1rem;
  animation-name: slideInRight;
}

.toast-bottom-left {
  bottom: 1rem;
  left: 1rem;
  animation-name: slideInLeft;
}

.toast-top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  animation-name: slideInDown;
}

.toast-bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  animation-name: slideInUp;
}

/* Types */
.toast-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.toast-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.toast-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.toast-info {
  background: #cce7ff;
  color: #004085;
  border: 1px solid #b3d7ff;
}

.toast-clickable {
  cursor: pointer;
}

.toast-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.toast-message {
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  flex-shrink: 0;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

/* Animations */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    transform: translate(-50%, 100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseToast",
});
</script>
