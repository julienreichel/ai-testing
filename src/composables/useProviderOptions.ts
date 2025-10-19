import { computed } from "vue";
import type { ComputedRef, WritableComputedRef } from "vue";
import type { QuickRunProviderConfig } from "@/types/quickRun";

export interface ProviderOptionsConfig {
  showParallelToggle?: boolean;
  maxTokensMin?: number;
  maxTokensMax?: number;
  concurrencyMin?: number;
  concurrencyMax?: number;
}

export interface ProviderOptionsProps {
  config: QuickRunProviderConfig;
  isDisabled?: boolean;
  options?: ProviderOptionsConfig;
}

export interface ProviderOptionsEmits {
  (e: "update-max-tokens", configId: string, value: number): void;
  (e: "update-parallel", configId: string, enabled: boolean): void;
  (e: "update-concurrency", configId: string, value: number): void;
}

export function useProviderOptions(
  props: ProviderOptionsProps,
  emit: ProviderOptionsEmits
): {
  resolvedOptions: ComputedRef<Required<ProviderOptionsConfig>>;
  maxTokensValue: WritableComputedRef<number>;
  parallelEnabled: WritableComputedRef<boolean>;
  concurrencyValue: WritableComputedRef<number>;
  shouldShowParallelToggle: ComputedRef<boolean>;
  shouldShowConcurrencyInput: ComputedRef<boolean>;
  parallelCheckboxId: ComputedRef<string>;
  handleMaxTokensChange: (value: string | number) => void;
  handleParallelToggle: (event: Event) => void;
  handleConcurrencyChange: (value: string | number) => void;
} {
  // Default options
  const defaultOptions: Required<ProviderOptionsConfig> = {
    showParallelToggle: true,
    maxTokensMin: 1,
    maxTokensMax: 8192,
    concurrencyMin: 1,
    concurrencyMax: 10,
  };

  // Merge provided options with defaults
  const resolvedOptions = computed(() => ({
    ...defaultOptions,
    ...props.options,
  }));

  // Computed properties for form values
  const maxTokensValue = computed({
    get: () => props.config.maxTokens,
    set: (value: number) => emit("update-max-tokens", props.config.id, value),
  });

  const parallelEnabled = computed({
    get: () => props.config.allowParallel && resolvedOptions.value.showParallelToggle,
    set: (enabled: boolean) => {
      if (resolvedOptions.value.showParallelToggle) {
        emit("update-parallel", props.config.id, enabled);
      }
    },
  });

  const concurrencyValue = computed({
    get: () => props.config.parallelConcurrency,
    set: (value: number) => emit("update-concurrency", props.config.id, value),
  });

  // Computed properties for component state
  const shouldShowParallelToggle = computed(() =>
    resolvedOptions.value.showParallelToggle
  );

  const shouldShowConcurrencyInput = computed(() =>
    resolvedOptions.value.showParallelToggle && props.config.allowParallel
  );

  const parallelCheckboxId = computed(() => `parallel-${props.config.id}`);

  // Event handlers
  const handleMaxTokensChange = (value: string | number): void => {
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    if (!isNaN(numValue)) {
      maxTokensValue.value = numValue;
    }
  };

  const handleParallelToggle = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    parallelEnabled.value = target.checked;
  };

  const handleConcurrencyChange = (value: string | number): void => {
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    if (!isNaN(numValue)) {
      concurrencyValue.value = numValue;
    }
  };

  return {
    // Options
    resolvedOptions,

    // Computed values
    maxTokensValue,
    parallelEnabled,
    concurrencyValue,

    // State flags
    shouldShowParallelToggle,
    shouldShowConcurrencyInput,
    parallelCheckboxId,

    // Event handlers
    handleMaxTokensChange,
    handleParallelToggle,
    handleConcurrencyChange,
  };
}
