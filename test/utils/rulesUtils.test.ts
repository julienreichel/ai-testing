import { describe, it, expect, vi } from "vitest";
import { useRulesUtils } from "composables/useRulesUtils";
import type { StringRule, RegexRule, LengthRule } from "../../src/types/rules";

// Mock i18n
vi.mock("vue-i18n", () => ({
  useI18n: (): {
    t: (key: string, params?: Record<string, unknown>) => string;
  } => ({
    t: (key: string): string => key,
  }),
}));

describe("Rules Utils", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const rulesUtils = useRulesUtils();
      const id1 = rulesUtils.generateId();
      const id2 = rulesUtils.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });
  });

  describe("createRule", () => {
    it("should create string rules with defaults", () => {
      const rulesUtils = useRulesUtils();
      const rule = rulesUtils.createRule("contains") as StringRule;

      expect(rule.id).toBeDefined();
      expect(rule.type).toBe("contains");
      expect(rule.value).toBe("");
      expect(rule.caseSensitive).toBe(false);
      expect(rule.respectPunctuation).toBe(false);
    });

    it("should create regex rules with defaults", () => {
      const rulesUtils = useRulesUtils();
      const rule = rulesUtils.createRule("regex") as RegexRule;

      expect(rule.id).toBeDefined();
      expect(rule.type).toBe("regex");
      expect(rule.caseSensitive).toBe(false);
      expect(rule.respectPunctuation).toBe(false);
      expect(rule.pattern).toBe("");
      expect(rule.flags).toBe("g");
    });

    it("should create length rules with defaults", () => {
      const rulesUtils = useRulesUtils();
      const rule = rulesUtils.createRule("length") as LengthRule;

      expect(rule.id).toBeDefined();
      expect(rule.type).toBe("length");
      expect(rule.min).toBe(0);
      expect(rule.max).toBeUndefined();
    });

    it("should throw error for unknown rule types", () => {
      const rulesUtils = useRulesUtils();
      // TypeScript prevents this at compile time, but test runtime behavior
      expect(() => rulesUtils.createRule("unknown" as never)).toThrow(
        "Unsupported rule type: unknown",
      );
    });
  });

  describe("createRuleSet", () => {
    it("should create rule set with defaults", () => {
      const rulesUtils = useRulesUtils();
      const ruleSet = rulesUtils.createRuleSet();

      expect(ruleSet.id).toBeDefined();
      expect(ruleSet.rules).toEqual([]);
      expect(ruleSet.aggregation).toBe("AND");
    });
  });

  describe("cloneRule", () => {
    it("should clone rule with new ID", () => {
      const rulesUtils = useRulesUtils();
      const original = rulesUtils.createRule("equals") as StringRule;
      original.value = "test";

      const cloned = rulesUtils.cloneRule(original) as StringRule;

      expect(cloned.id).toBeDefined();
      expect(cloned.id).not.toBe(original.id);
      expect(cloned.type).toBe(original.type);
      expect(cloned.value).toBe(original.value);
      expect(cloned.caseSensitive).toBe(original.caseSensitive);
    });
  });

  describe("cloneRuleSet", () => {
    it("should clone rule set with new ID and cloned rules", () => {
      const rulesUtils = useRulesUtils();
      const original = rulesUtils.createRuleSet();

      const rule = rulesUtils.createRule("contains") as StringRule;
      rule.value = "test";
      original.rules = [rule];

      const cloned = rulesUtils.cloneRuleSet(original);

      expect(cloned.id).toBeDefined();
      expect(cloned.id).not.toBe(original.id);
      expect(cloned.aggregation).toBe(original.aggregation);
      expect(cloned.rules).toHaveLength(1);
      expect(cloned.rules[0]?.id).not.toBe(rule.id);
      expect((cloned.rules[0] as StringRule)?.value).toBe("test");
    });
  });

  describe("validateRuleConfig", () => {
    it("should validate string rule config", () => {
      const rulesUtils = useRulesUtils();
      const rule = rulesUtils.createRule("equals") as StringRule;
      rule.value = "test";
      const result = rulesUtils.validateRuleConfig(rule);

      expect(result).toBe(true);
    });

    it("should validate regex rule config", () => {
      const rulesUtils = useRulesUtils();
      const rule = rulesUtils.createRule("regex") as RegexRule;
      rule.pattern = "\\d+";
      const result = rulesUtils.validateRuleConfig(rule);

      expect(result).toBe(true);
    });

    it("should validate length rule config", () => {
      const rulesUtils = useRulesUtils();
      const rule = rulesUtils.createRule("length") as LengthRule;
      rule.min = 1;
      rule.max = 10;
      const result = rulesUtils.validateRuleConfig(rule);

      expect(result).toBe(true);
    });
  });

  describe("moveRule", () => {
    it("should rearrange rules correctly", () => {
      const rulesUtils = useRulesUtils();
      const rule1 = rulesUtils.createRule("equals") as StringRule;
      const rule2 = rulesUtils.createRule("contains") as StringRule;
      const rule3 = rulesUtils.createRule("startsWith") as StringRule;
      const originalRules = [rule1, rule2, rule3];

      const result = rulesUtils.moveRule(originalRules, 2, 0); // Move rule3 to position 0

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(rule3);
      expect(result[1]).toBe(rule1);
      expect(result[2]).toBe(rule2);
    });

    it("should handle invalid indices", () => {
      const rulesUtils = useRulesUtils();
      const rule1 = rulesUtils.createRule("equals") as StringRule;
      const originalRules = [rule1];

      const result = rulesUtils.moveRule(originalRules, 5, 0); // Invalid fromIndex

      expect(result).toEqual(originalRules);
    });

    it("should handle empty array", () => {
      const rulesUtils = useRulesUtils();
      const originalRules: StringRule[] = [];

      const result = rulesUtils.moveRule(originalRules, 0, 0);

      expect(result).toEqual([]);
    });

    it("should not mutate original array", () => {
      const rulesUtils = useRulesUtils();
      const rule1 = rulesUtils.createRule("equals") as StringRule;
      const rule2 = rulesUtils.createRule("contains") as StringRule;
      const originalRules = [rule1, rule2];
      const originalLength = originalRules.length;

      const result = rulesUtils.moveRule(originalRules, 1, 0);

      expect(originalRules).toHaveLength(originalLength);
      expect(result).not.toBe(originalRules);
      expect(result[0]).toBe(rule2);
      expect(originalRules[0]).toBe(rule1);
    });
  });
});
