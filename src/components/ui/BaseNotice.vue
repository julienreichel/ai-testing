<template>
  <div v-if="modelValue" :class="noticeClasses">
    <div class="notice-icon" v-if="showIcon">
      <span>{{ iconText }}</span>
    </div>

    <div class="notice-content">
      <h3 v-if="title" class="notice-title">{{ title }}</h3>
      <div class="notice-body">
        <slot />
      </div>

      <div v-if="$slots.actions" class="notice-actions">
        <slot name="actions" />
      </div>
    </div>

    <button
      v-if="dismissible"
      class="notice-dismiss"
      @click="handleDismiss"
      aria-label="Dismiss notice"
    >
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface BaseNoticeProps {
  modelValue?: boolean;
  type?: "info" | "warning" | "success" | "error";
  title?: string;
  dismissible?: boolean;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<BaseNoticeProps>(), {
  modelValue: true,
  type: "info",
  title: "",
  dismissible: false,
  showIcon: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  dismiss: [];
}>();

const noticeClasses = computed(() => ["notice", `notice-${props.type}`]);

const iconText = computed(() => {
  switch (props.type) {
    case "success":
      return "✅";
    case "warning":
      return "⚠️";
    case "error":
      return "❌";
    case "info":
    default:
      return "ℹ️";
  }
});

const handleDismiss = (): void => {
  emit("update:modelValue", false);
  emit("dismiss");
};
</script>

<style scoped>
.notice {
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  position: relative;
}

.notice-info {
  background: #cce7ff;
  border: 1px solid #b3d7ff;
  color: #004085;
}

.notice-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.notice-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.notice-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.notice-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.notice-content {
  flex: 1;
}

.notice-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.notice-body {
  line-height: 1.5;
}

.notice-body p {
  margin: 0 0 0.5rem 0;
}

.notice-body p:last-child {
  margin-bottom: 0;
}

.notice-body ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.notice-body li {
  margin-bottom: 0.25rem;
}

.notice-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.notice-dismiss {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.notice-dismiss:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseNotice",
});
</script>
