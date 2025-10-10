<template>
  <form :class="formClasses" @submit="handleSubmit">
    <div class="form-header" v-if="title || $slots.header">
      <h2 v-if="title" class="form-title">{{ title }}</h2>
      <slot name="header" />
    </div>

    <div class="form-body">
      <slot />
    </div>

    <div class="form-footer" v-if="$slots.footer || showDefaultActions">
      <slot name="footer">
        <div class="form-actions" v-if="showDefaultActions">
          <button type="button" class="btn btn-outline" @click="handleCancel">
            {{ cancelLabel }}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading || disabled"
          >
            <span v-if="loading">Loading...</span>
            <span v-else>{{ submitLabel }}</span>
          </button>
        </div>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface BaseFormProps {
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  layout?: "vertical" | "horizontal" | "inline";
  showDefaultActions?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

const props = withDefaults(defineProps<BaseFormProps>(), {
  title: "",
  loading: false,
  disabled: false,
  size: "md",
  layout: "vertical",
  showDefaultActions: true,
  submitLabel: "Submit",
  cancelLabel: "Cancel",
});

const emit = defineEmits<{
  submit: [event: Event];
  cancel: [];
}>();

const formClasses = computed(() => [
  "base-form",
  `form-${props.size}`,
  `form-${props.layout}`,
]);

const handleSubmit = (event: Event): void => {
  event.preventDefault();
  if (!props.loading && !props.disabled) {
    emit("submit", event);
  }
};

const handleCancel = (): void => {
  emit("cancel");
};
</script>

<style scoped>
.base-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Size variants */
.form-sm {
  gap: 1rem;
}

.form-sm .form-body {
  gap: 0.75rem;
}

.form-sm .form-title {
  font-size: 1.125rem;
}

.form-lg {
  gap: 2rem;
}

.form-lg .form-body {
  gap: 1.5rem;
}

.form-lg .form-title {
  font-size: 1.5rem;
}

/* Layout variants */
.form-horizontal .form-body {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 1rem;
  align-items: start;
}

.form-inline .form-body {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: end;
}

.form-inline .form-actions {
  justify-content: flex-start;
}

/* Responsive */
@media (max-width: 768px) {
  .form-horizontal .form-body {
    grid-template-columns: 1fr;
  }

  .form-inline .form-body {
    flex-direction: column;
    align-items: stretch;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseForm",
});
</script>
