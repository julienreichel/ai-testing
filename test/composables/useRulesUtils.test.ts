import { describe, it, expect, vi } from "vitest";
import { useRulesUtils } from "../../src/composables/useRulesUtils";
import type { RuleType } from "../../src/types/rules";

// Mock i18n
vi.mock("vue-i18n", () => ({
  useI18n: (): {
    t: (key: string, params?: Record<string, unknown>) => string;
  } => ({
    t: (key: string): string => {
      // Simplified mock translations for testing
      const translations: Record<string, string> = {
        "rules.types.equals.label": "Equals",
        "rules.types.equals.description": "Text must match exactly",
        "rules.types.contains.label": "Contains",
        "rules.types.contains.description":
          "Text must contain the specified value",
        "rules.types.startsWith.label": "Starts With",
        "rules.types.startsWith.description":
          "Text must start with the specified value",
        "rules.types.endsWith.label": "Ends With",
        "rules.types.endsWith.description":
          "Text must end with the specified value",
        "rules.types.regex.label": "Regex",
        "rules.types.regex.description":
          "Text must match the regular expression pattern",
        "rules.types.length.label": "Length",
        "rules.types.length.description":
          "Text length must be within specified range",
      };

      return translations[key] || key;
    },
  }),
}));

describe("useRulesUtils", () => {
  describe("getRuleTypeOptions", () => {
    it("should return all rule type options with proper structure", () => {
      const rulesUtils = useRulesUtils();
      const options = rulesUtils.getRuleTypeOptions();

      expect(options).toHaveLength(6);

      // Check structure of first option
      expect(options[0]).toHaveProperty("value");
      expect(options[0]).toHaveProperty("label");
      expect(options[0]).toHaveProperty("description");

      // Check all rule types are present
      const values = options.map((option) => option.value);
      expect(values).toContain("equals");
      expect(values).toContain("contains");
      expect(values).toContain("startsWith");
      expect(values).toContain("endsWith");
      expect(values).toContain("regex");
      expect(values).toContain("length");
    });

    it("should return internationalized labels and descriptions", () => {
      const rulesUtils = useRulesUtils();
      const options = rulesUtils.getRuleTypeOptions();

      const equalsOption = options.find((opt) => opt.value === "equals");
      expect(equalsOption?.label).toBe("Equals");
      expect(equalsOption?.description).toBe("Text must match exactly");

      const containsOption = options.find((opt) => opt.value === "contains");
      expect(containsOption?.label).toBe("Contains");
      expect(containsOption?.description).toBe(
        "Text must contain the specified value",
      );
    });

    it("should have non-empty labels and descriptions for all options", () => {
      const rulesUtils = useRulesUtils();
      const options = rulesUtils.getRuleTypeOptions();

      options.forEach((option) => {
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
        expect(typeof option.label).toBe("string");
        expect(typeof option.description).toBe("string");
        expect(option.label.length).toBeGreaterThan(0);
        expect(option.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getRuleTypeDescriptions", () => {
    it("should return descriptions for all rule types", () => {
      const rulesUtils = useRulesUtils();
      const descriptions = rulesUtils.getRuleTypeDescriptions();

      expect(descriptions.equals).toBe("Text must match exactly");
      expect(descriptions.contains).toBe(
        "Text must contain the specified value",
      );
      expect(descriptions.startsWith).toBe(
        "Text must start with the specified value",
      );
      expect(descriptions.endsWith).toBe(
        "Text must end with the specified value",
      );
      expect(descriptions.regex).toBe(
        "Text must match the regular expression pattern",
      );
      expect(descriptions.length).toBe(
        "Text length must be within specified range",
      );
    });

    it("should have all rule types as keys", () => {
      const rulesUtils = useRulesUtils();
      const descriptions = rulesUtils.getRuleTypeDescriptions();

      const expectedTypes: RuleType[] = [
        "equals",
        "contains",
        "startsWith",
        "endsWith",
        "regex",
        "length",
      ];
      expectedTypes.forEach((type) => {
        expect(descriptions).toHaveProperty(type);
        expect(typeof descriptions[type]).toBe("string");
        expect(descriptions[type].length).toBeGreaterThan(0);
      });
    });
  });

  describe("getRuleTypeLabel", () => {
    it("should return correct labels for each rule type", () => {
      const rulesUtils = useRulesUtils();

      expect(rulesUtils.getRuleTypeLabel("equals")).toBe("Equals");
      expect(rulesUtils.getRuleTypeLabel("contains")).toBe("Contains");
      expect(rulesUtils.getRuleTypeLabel("startsWith")).toBe("Starts With");
      expect(rulesUtils.getRuleTypeLabel("endsWith")).toBe("Ends With");
      expect(rulesUtils.getRuleTypeLabel("regex")).toBe("Regex");
      expect(rulesUtils.getRuleTypeLabel("length")).toBe("Length");
    });

    it("should return internationalized labels", () => {
      const rulesUtils = useRulesUtils();

      // Test that labels are coming from i18n (not hardcoded)
      const label = rulesUtils.getRuleTypeLabel("equals");
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });

  describe("getRuleTypeDescription", () => {
    it("should return correct descriptions for each rule type", () => {
      const rulesUtils = useRulesUtils();

      expect(rulesUtils.getRuleTypeDescription("equals")).toBe(
        "Text must match exactly",
      );
      expect(rulesUtils.getRuleTypeDescription("contains")).toBe(
        "Text must contain the specified value",
      );
      expect(rulesUtils.getRuleTypeDescription("startsWith")).toBe(
        "Text must start with the specified value",
      );
      expect(rulesUtils.getRuleTypeDescription("endsWith")).toBe(
        "Text must end with the specified value",
      );
      expect(rulesUtils.getRuleTypeDescription("regex")).toBe(
        "Text must match the regular expression pattern",
      );
      expect(rulesUtils.getRuleTypeDescription("length")).toBe(
        "Text length must be within specified range",
      );
    });

    it("should return internationalized descriptions", () => {
      const rulesUtils = useRulesUtils();

      // Test that descriptions are coming from i18n (not hardcoded)
      const description = rulesUtils.getRuleTypeDescription("equals");
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe("behavior consistency", () => {
    it("should return consistent data between different methods", () => {
      const rulesUtils = useRulesUtils();
      const options = rulesUtils.getRuleTypeOptions();
      const descriptions = rulesUtils.getRuleTypeDescriptions();

      options.forEach((option) => {
        // Label should match getRuleTypeLabel
        expect(option.label).toBe(rulesUtils.getRuleTypeLabel(option.value));

        // Description should match getRuleTypeDescription and getRuleTypeDescriptions
        expect(option.description).toBe(
          rulesUtils.getRuleTypeDescription(option.value),
        );
        expect(option.description).toBe(descriptions[option.value]);
      });
    });

    it("should handle all valid rule types", () => {
      const rulesUtils = useRulesUtils();
      const validTypes: RuleType[] = [
        "equals",
        "contains",
        "startsWith",
        "endsWith",
        "regex",
        "length",
      ];

      validTypes.forEach((type) => {
        expect(() => rulesUtils.getRuleTypeLabel(type)).not.toThrow();
        expect(() => rulesUtils.getRuleTypeDescription(type)).not.toThrow();

        const label = rulesUtils.getRuleTypeLabel(type);
        const description = rulesUtils.getRuleTypeDescription(type);

        expect(typeof label).toBe("string");
        expect(typeof description).toBe("string");
        expect(label.length).toBeGreaterThan(0);
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });
});
