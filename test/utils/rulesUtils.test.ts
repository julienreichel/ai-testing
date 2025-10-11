import { describe, it, expect } from "vitest";
import {
  createRule,
  createRuleSet,
  cloneRule,
  cloneRuleSet,
  moveRule,
  generateId,
  validateRuleConfig,
  RULE_TYPE_OPTIONS,
} from "../../src/utils/rulesUtils";
import type { StringRule, RegexRule, LengthRule } from "../../src/types/rules";

describe("Rules Utils", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });
  });

  describe("createRule", () => {
    it("should create string rules with defaults", () => {
      const rule = createRule("contains") as StringRule;

      expect(rule.id).toBeDefined();
      expect(rule.type).toBe("contains");
      expect(rule.value).toBe("");
      expect(rule.caseSensitive).toBe(true);
    });

    it("should create regex rules with defaults", () => {
      const rule = createRule("regex") as RegexRule;

      expect(rule.id).toBeDefined();
      expect(rule.type).toBe("regex");
      expect(rule.pattern).toBe("");
      expect(rule.flags).toBe("g");
    });

    it("should create length rules with defaults", () => {
      const rule = createRule("length") as LengthRule;

      expect(rule.id).toBeDefined();
      expect(rule.type).toBe("length");
      expect(rule.min).toBe(0);
      expect(rule.max).toBeUndefined();
    });

    it("should throw error for unknown rule types", () => {
      // TypeScript prevents this at compile time, but test runtime behavior
      expect(() => createRule("unknown" as never)).toThrow(
        "Unsupported rule type: unknown",
      );
    });
  });

  describe("createRuleSet", () => {
    it("should create rule set with defaults", () => {
      const ruleSet = createRuleSet();

      expect(ruleSet.id).toBeDefined();
      expect(ruleSet.rules).toEqual([]);
      expect(ruleSet.aggregation).toBe("AND");
    });
  });

  describe("cloneRule", () => {
    it("should clone rule with new ID", () => {
      const original = createRule("equals") as StringRule;
      original.value = "test";

      const cloned = cloneRule(original) as StringRule;

      expect(cloned.id).toBeDefined();
      expect(cloned.type).toBe(original.type);
      expect(cloned.value).toBe(original.value);
      expect(cloned.caseSensitive).toBe(original.caseSensitive);
    });
  });

  describe("cloneRuleSet", () => {
    it("should clone rule set with same structure", () => {
      const original = createRuleSet();
      original.aggregation = "OR";
      const rule = createRule("contains") as StringRule;
      rule.value = "test";
      original.rules = [rule];

      const cloned = cloneRuleSet(original);

      expect(cloned.id).toBeDefined();
      expect(cloned.aggregation).toBe("OR");
      expect(cloned.rules).toHaveLength(1);
      expect(cloned.rules[0]?.type).toBe("contains");
      expect((cloned.rules[0] as StringRule).value).toBe("test");
    });
  });

  describe("validateRuleConfig", () => {
    it("should accept any rule as valid (simplified validation)", () => {
      const rule = createRule("equals") as StringRule;

      const result = validateRuleConfig(rule);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept regex rule as valid", () => {
      const rule = createRule("regex") as RegexRule;

      const result = validateRuleConfig(rule);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept length rule as valid", () => {
      const rule = createRule("length") as LengthRule;

      const result = validateRuleConfig(rule);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("moveRule", () => {
    it("should move rule to new position", () => {
      const rule1 = createRule("equals") as StringRule;
      const rule2 = createRule("contains") as StringRule;
      const rule3 = createRule("startsWith") as StringRule;

      const originalRules = [rule1, rule2, rule3];
      const result = moveRule(originalRules, 2, 0); // Move rule3 to position 0

      expect(result).toHaveLength(3);
      expect(result[0]?.id).toBe(rule3.id);
      expect(result[1]?.id).toBe(rule1.id);
      expect(result[2]?.id).toBe(rule2.id);
    });

    it("should handle invalid indices gracefully", () => {
      const rule1 = createRule("equals") as StringRule;
      const originalRules = [rule1];

      const result = moveRule(originalRules, 5, 0); // Invalid fromIndex

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(rule1.id);
    });

    it("should not mutate original array", () => {
      const rule1 = createRule("equals") as StringRule;
      const rule2 = createRule("contains") as StringRule;
      const originalRules = [rule1, rule2];

      const result = moveRule(originalRules, 1, 0);

      expect(originalRules).toHaveLength(2);
      expect(originalRules[0]?.id).toBe(rule1.id);
      expect(result).not.toBe(originalRules);
    });
  });

  describe("RULE_TYPE_OPTIONS", () => {
    it("should provide all rule type options", () => {
      expect(RULE_TYPE_OPTIONS).toHaveLength(6);

      const values = RULE_TYPE_OPTIONS.map((option) => option.value);
      expect(values).toContain("equals");
      expect(values).toContain("contains");
      expect(values).toContain("startsWith");
      expect(values).toContain("endsWith");
      expect(values).toContain("regex");
      expect(values).toContain("length");
    });

    it("should have labels and descriptions for all options", () => {
      RULE_TYPE_OPTIONS.forEach((option) => {
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
        expect(typeof option.label).toBe("string");
        expect(typeof option.description).toBe("string");
        expect(option.label.length).toBeGreaterThan(0);
        expect(option.description.length).toBeGreaterThan(0);
      });
    });
  });
});
