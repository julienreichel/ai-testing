import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { useCostEstimator } from "../../src/composables/useCostEstimator";
import type { CostEstimatorParams } from "../../src/composables/useCostEstimator";

// Mock the providers store
vi.mock("../../src/store/providers", () => ({
  useProvidersStore: (): { getProviderPricing: (providerId: string, model: string) => { inputTokensPer1K: number; outputTokensPer1K: number } | null } => ({
    getProviderPricing: vi.fn().mockReturnValue({
      inputTokensPer1K: 0.001,
      outputTokensPer1K: 0.002,
    }),
  }),
}));

describe("useCostEstimator - User Cost Estimation Behavior", () => {
  let mockParams: CostEstimatorParams;

  beforeEach(() => {
    mockParams = {
      systemPrompt: ref("You are a helpful assistant."),
      userPrompt: ref("Hello, how are you?"),
      providerId: ref("openai"),
      model: ref("gpt-3.5-turbo"),
      maxTokens: ref(150),
    };
  });

  describe("When user wants to estimate costs", () => {
    it("should provide accurate cost estimates for typical user inputs", () => {
      const { costEstimate, canEstimate } = useCostEstimator(mockParams);

      // User can see that estimation is possible
      expect(canEstimate.value).toBe(true);

      // User gets comprehensive cost breakdown
      const estimate = costEstimate.value;
      expect(estimate.inputCost).toBeGreaterThan(0);
      expect(estimate.outputCost).toBeGreaterThan(0);
      expect(estimate.totalCost).toBe(estimate.inputCost + estimate.outputCost);
      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.estimatedOutputTokens).toBe(150); // matches maxTokens
      expect(estimate.totalTokens).toBe(estimate.inputTokens + estimate.estimatedOutputTokens);
    });

    it("should show user-friendly formatted cost display", () => {
      const { formattedCost } = useCostEstimator(mockParams);

      // User sees properly formatted cost with dollar sign (handles both exact amounts and "< $0.001" format)
      expect(formattedCost.value).toMatch(/^\$\d+\.\d{3}$|^< \$\d+\.\d{3}$/);
      expect(formattedCost.value).toContain("$");
    });

    it("should handle very low costs with appropriate user messaging", () => {
      // User has minimal input
      mockParams.systemPrompt.value = "";
      mockParams.userPrompt.value = "Hi";

      const { formattedCost } = useCostEstimator(mockParams);

      // User sees clear indication of minimal cost
      expect(formattedCost.value).toMatch(/^(<\s)?\$0\.001$/);
    });
  });

  describe("When user provides different input lengths", () => {
    it("should reflect input size in cost calculations", () => {
      const shortInput = useCostEstimator({
        ...mockParams,
        userPrompt: ref("Hi"),
      });

      const longInput = useCostEstimator({
        ...mockParams,
        userPrompt: ref("This is a much longer prompt that should cost more to process because it contains significantly more text and will require more tokens to represent properly."),
      });

      // User sees higher costs for longer inputs
      expect(longInput.costEstimate.value.inputCost).toBeGreaterThan(
        shortInput.costEstimate.value.inputCost
      );
      expect(longInput.costEstimate.value.inputTokens).toBeGreaterThan(
        shortInput.costEstimate.value.inputTokens
      );
    });

    it("should handle empty inputs appropriately", () => {
      mockParams.systemPrompt.value = "";
      mockParams.userPrompt.value = "";

      const { canEstimate, costEstimate } = useCostEstimator(mockParams);

      // User knows when estimation isn't possible
      expect(canEstimate.value).toBe(false);

      // But still gets valid numbers for cost calculations
      expect(costEstimate.value.inputTokens).toBe(0);
      expect(costEstimate.value.totalCost).toBeGreaterThanOrEqual(0);
    });
  });

  describe("When user adjusts output settings", () => {
    it("should reflect max tokens setting in cost estimates", () => {
      const lowTokens = useCostEstimator({
        ...mockParams,
        maxTokens: ref(50),
      });

      const highTokens = useCostEstimator({
        ...mockParams,
        maxTokens: ref(500),
      });

      // User sees cost increase with higher token limits
      expect(highTokens.costEstimate.value.outputCost).toBeGreaterThan(
        lowTokens.costEstimate.value.outputCost
      );
      expect(highTokens.costEstimate.value.estimatedOutputTokens).toBeGreaterThan(
        lowTokens.costEstimate.value.estimatedOutputTokens
      );
    });

    it("should use reasonable defaults when max tokens not specified", () => {
      mockParams.maxTokens.value = 0; // User didn't set a limit

      const { costEstimate } = useCostEstimator(mockParams);

      // User gets reasonable default estimation
      expect(costEstimate.value.estimatedOutputTokens).toBe(150); // DEFAULT_MAX_TOKENS
      expect(costEstimate.value.outputCost).toBeGreaterThan(0);
    });
  });

  describe("Reactive behavior for user interactions", () => {
    it("should update costs immediately when user changes inputs", () => {
      const { costEstimate } = useCostEstimator(mockParams);

      const initialCost = costEstimate.value.totalCost;

      // User types more text
      mockParams.userPrompt.value = "This is a much longer prompt that will cost more";

      // User sees updated cost immediately
      expect(costEstimate.value.totalCost).toBeGreaterThan(initialCost);
    });

    it("should react to provider and model changes", () => {
      const { costEstimate } = useCostEstimator(mockParams);

      // User selects different model/provider
      mockParams.providerId.value = "anthropic";
      mockParams.model.value = "claude-3";

      // User gets updated estimates (even with default pricing)
      expect(costEstimate.value).toBeDefined();
      expect(costEstimate.value.totalCost).toBeGreaterThan(0);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing provider information gracefully", () => {
      mockParams.providerId.value = "";
      mockParams.model.value = "";

      const { costEstimate, canEstimate } = useCostEstimator(mockParams);

      // User still gets cost estimates with default pricing
      expect(canEstimate.value).toBe(true);
      expect(costEstimate.value.totalCost).toBeGreaterThan(0);
    });

    it("should provide consistent token counting behavior", () => {
      mockParams.userPrompt.value = "1234"; // Exactly 4 characters

      const { costEstimate } = useCostEstimator(mockParams);

      // User gets predictable token counting (4 chars per token)
      const userTokensFromPrompt = Math.ceil(4 / 4); // Should be 1 token
      expect(costEstimate.value.inputTokens).toBeGreaterThanOrEqual(userTokensFromPrompt);
    });
  });

  describe("Performance and usability", () => {
    it("should provide all necessary data for user decision making", () => {
      const result = useCostEstimator(mockParams);

      // User has access to all needed information
      expect(result).toHaveProperty("costEstimate");
      expect(result).toHaveProperty("formattedCost");
      expect(result).toHaveProperty("canEstimate");
      expect(result).toHaveProperty("estimatedInputTokens");
      expect(result).toHaveProperty("estimatedOutputTokens");
      expect(result).toHaveProperty("totalEstimatedTokens");

      // All properties are reactive refs
      expect(result.costEstimate.value).toBeDefined();
      expect(result.formattedCost.value).toBeDefined();
      expect(typeof result.canEstimate.value).toBe("boolean");
    });

    it("should maintain precision appropriate for financial display", () => {
      const { formattedCost, costEstimate } = useCostEstimator(mockParams);

      // User sees appropriate decimal precision
      if (!formattedCost.value.startsWith("<")) {
        const costString = formattedCost.value.replace("$", "");
        const decimalPlaces = costString.split(".")[1]?.length || 0;
        expect(decimalPlaces).toBe(3); // 3 decimal places for cost precision
      }

      // Raw numbers maintain full precision for calculations
      expect(typeof costEstimate.value.totalCost).toBe("number");
      expect(costEstimate.value.totalCost).toBeGreaterThan(0);
    });
  });
});
