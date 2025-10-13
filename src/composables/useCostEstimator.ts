import { computed, type Ref } from "vue";
import type { ProviderPricing } from "../types/providers";
import { useProvidersStore } from "../store/providers";

// Constants for cost estimation
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 1000;
const TOKENS_PER_THOUSAND = 1000;
const MIN_COST_THRESHOLD = 0.001;
const COST_PRECISION = 3;

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
}

export interface CostEstimatorParams {
  systemPrompt: Ref<string>;
  userPrompt: Ref<string>;
  providerId: Ref<string>;
  model: Ref<string>;
  maxTokens: Ref<number>;
}

export interface CostEstimatorReturn {
  costEstimate: Ref<CostEstimate>;
  formattedCost: Ref<string>;
  canEstimate: Ref<boolean>;
  estimatedInputTokens: Ref<number>;
  estimatedOutputTokens: Ref<number>;
  totalEstimatedTokens: Ref<number>;
}

export function useCostEstimator(
  params: CostEstimatorParams,
): CostEstimatorReturn {
  const { systemPrompt, userPrompt, providerId, model, maxTokens } = params;
  const providersStore = useProvidersStore();

  const estimatedInputTokens = computed(() => {
    const systemTokens = Math.ceil(systemPrompt.value.length / CHARS_PER_TOKEN);
    const userTokens = Math.ceil(userPrompt.value.length / CHARS_PER_TOKEN);
    return systemTokens + userTokens;
  });

  const estimatedOutputTokens = computed(() => {
    // Use maxTokens as estimate, or default to reasonable value
    return maxTokens.value || DEFAULT_MAX_TOKENS;
  });

  const totalEstimatedTokens = computed(() => {
    return estimatedInputTokens.value + estimatedOutputTokens.value;
  });

  const defaultPricing: ProviderPricing = {
    inputTokensPer1K: 0.001,
    outputTokensPer1K: 0.002,
  };

  const pricing = computed(() => {
    if (!providerId.value || !model.value) {
      return defaultPricing;
    }

    // Get real pricing from the provider
    const realPricing = providersStore.getProviderPricing(
      providerId.value,
      model.value,
    );
    return realPricing || defaultPricing;
  });

  const costEstimate = computed<CostEstimate>(() => {
    const currentPricing = pricing.value;
    const inputCost =
      (estimatedInputTokens.value / TOKENS_PER_THOUSAND) *
      currentPricing.inputTokensPer1K;
    const outputCost =
      (estimatedOutputTokens.value / TOKENS_PER_THOUSAND) *
      currentPricing.outputTokensPer1K;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      inputTokens: estimatedInputTokens.value,
      estimatedOutputTokens: estimatedOutputTokens.value,
      totalTokens: totalEstimatedTokens.value,
    };
  });

  const formattedCost = computed(() => {
    const cost = costEstimate.value.totalCost;
    if (cost < MIN_COST_THRESHOLD) {
      return `< $${MIN_COST_THRESHOLD.toFixed(COST_PRECISION)}`;
    }
    return `$${cost.toFixed(COST_PRECISION)}`;
  });

  const canEstimate = computed(() => {
    return systemPrompt.value.trim() !== "" || userPrompt.value.trim() !== "";
  });

  return {
    costEstimate,
    formattedCost,
    canEstimate,
    estimatedInputTokens,
    estimatedOutputTokens,
    totalEstimatedTokens,
  };
}
