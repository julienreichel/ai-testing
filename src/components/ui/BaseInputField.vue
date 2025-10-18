<template>
  <div :class="fieldClasses">
    <label
      v-if="label"
      :for="fieldId"
      class="field-label"
      :class="{ 'field-label-required': required }"
    >
      {{ label }}
    </label>

    <div class="field-input-wrapper">
      <input
        v-if="type !== 'textarea' && type !== 'select'"
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <textarea
        v-else-if="type === 'textarea'"
        :id="fieldId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <select
        v-else-if="type === 'select'"
        :id="fieldId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="inputClasses"
        @change="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <option value="" v-if="placeholder">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div v-if="error" class="field-error">
      {{ error }}
    </div>

    <div v-if="hint && !error" class="field-hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

export interface BaseInputFieldOption {
  value: string | number;
  label: string;
}

export interface BaseInputFieldProps {
  modelValue?: string | number;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "url"
    | "textarea"
    | "select";
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  size?: "sm" | "md" | "lg";
  rows?: number;
  options?: BaseInputFieldOption[];
}

const props = withDefaults(defineProps<BaseInputFieldProps>(), {
  modelValue: "",
  type: "text",
  label: "",
  placeholder: "",
  hint: "",
  error: "",
  disabled: false,
  readonly: false,
  required: false,
  size: "md",
  rows: 3,
  options: () => [],
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  blur: [event: Event];
  focus: [event: Event];
}>();

const fieldId = useId();

const fieldClasses = computed(() => [
  "base-field",
  `field-${props.size}`,
  {
    "field-disabled": props.disabled,
    "field-readonly": props.readonly,
    "field-error": props.error,
  },
]);

const inputClasses = computed(() => [
  "field-input",
  `input-${props.size}`,
  {
    "input-error": props.error,
    "input-disabled": props.disabled,
    "input-readonly": props.readonly,
  },
]);

const handleInput = (event: Event): void => {
  const target = event.target as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;
  const value = props.type === "number" ? Number(target.value) : target.value;
  emit("update:modelValue", value);
};

const handleBlur = (event: Event): void => {
  emit("blur", event);
};

const handleFocus = (event: Event): void => {
  emit("focus", event);
};
</script>

<style scoped>
.base-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);
  font-size: 0.875rem;
}

.field-label-required::after {
  content: " *";
  color: var(--color-error, #dc3545);
}

.field-input-wrapper {
  position: relative;
}

.field-input {
  width: 95%;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1a1a1a);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input:disabled {
  background: var(--bg-disabled, #f9fafb);
  color: var(--text-disabled, #6b7280);
  cursor: not-allowed;
}

.field-input:readonly {
  background: var(--bg-readonly, #f9fafb);
  cursor: default;
}

/* Size variants */
.input-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.input-md {
  padding: 0.625rem 0.625rem;
  font-size: 0.875rem;
}

.input-lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* Error state */
.input-error {
  border-color: var(--color-error, #dc3545);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.field-error {
  font-size: 0.8125rem;
  color: var(--color-error, #dc3545);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-hint {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
}

/* Textarea specific */
textarea.field-input {
  resize: vertical;
  min-height: 80px;
}

/* Select specific */
select.field-input {
  cursor: pointer;
}

select.field-input:disabled {
  cursor: not-allowed;
}

/* Field states */
.field-disabled {
  opacity: 0.6;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BaseInputField",
});
</script>
