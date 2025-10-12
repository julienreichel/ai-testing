import { describe, it, expect, vi } from "vitest";
import { useRulesEngine } from "../../src/composables/useRulesEngine";
import { useRulesUtils } from "../../src/composables/useRulesUtils";
import type {
  StringRule,
  RegexRule,
  LengthRule,
} from "../../src/types/rules";

// Mock i18n
vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string, params?: Record<string, unknown>) => string } => ({
    t: (key: string, params?: Record<string, unknown>): string => {
      // Simplified mock translations for testing
      const translations: Record<string, string> = {
        "rules.validation.equals.pass": 'Text equals "{value}"',
        "rules.validation.equals.fail": 'Expected "{expected}", got "{actual}"',
        "rules.validation.contains.pass": 'Text contains "{value}"',
        "rules.validation.contains.fail": 'Text does not contain "{value}"',
        "rules.validation.startsWith.pass": 'Text starts with "{value}"',
        "rules.validation.startsWith.fail": 'Text does not start with "{value}"',
        "rules.validation.endsWith.pass": 'Text ends with "{value}"',
        "rules.validation.endsWith.fail": 'Text does not end with "{value}"',
        "rules.validation.regex.pass": 'Text matches pattern /{pattern}/{flags}',
        "rules.validation.regex.fail": 'Text does not match pattern /{pattern}/{flags}',
        "rules.validation.regex.invalidPattern": 'Invalid regex pattern: {error}',
        "rules.validation.length.withinRange": 'Length {length} is within range {min}-{max}',
        "rules.validation.length.outsideRange": 'Length {length} is not within range {min}-{max}',
        "rules.validation.length.atLeastMin": 'Length {length} is at least {min}',
        "rules.validation.length.belowMin": 'Length {length} is less than minimum {min}',
        "rules.validation.length.atMostMax": 'Length {length} is at most {max}',
        "rules.validation.length.exceedsMax": 'Length {length} exceeds maximum {max}',
        "rules.validation.length.lengthIs": 'Length is {length}',
        "rules.validation.ruleSet.allPassed": 'All {total} rules passed',
        "rules.validation.ruleSet.noRules": 'All 0 rules passed',
        "rules.validation.ruleSet.somePassedAnd": '{passed}/{total} rules passed (requires all)',
        "rules.validation.ruleSet.somePassedOr": '{passed}/{total} rules passed (requires at least one)',
      };

      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          result = result.replace(new RegExp(`{${param}}`, 'g'), String(value));
        });
      }
      return result;
    },
  }),
}));

describe("useRulesEngine", () => {
  describe("validateRule", () => {
    describe("String Rules", () => {
      it("should validate equals rule correctly", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("equals") as StringRule;
        rule.value = "Hello World";
        rule.caseSensitive = true;

        const passingResult = rulesEngine.validateRule(rule, "Hello World");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text equals "Hello World"');

        const failingResult = rulesEngine.validateRule(rule, "hello world");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe(
          'Expected "Hello World", got "hello world"',
        );
      });

      it("should handle case insensitive equals rule", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("equals") as StringRule;
        rule.value = "Hello World";
        rule.caseSensitive = false;

        const result = rulesEngine.validateRule(rule, "hello world");
        expect(result.pass).toBe(true);
        expect(result.message).toBe('Text equals "Hello World"');
      });

      it("should validate contains rule correctly", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("contains") as StringRule;
        rule.value = "world";

        const passingResult = rulesEngine.validateRule(rule, "Hello world!");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text contains "world"');

        const failingResult = rulesEngine.validateRule(rule, "Hello universe!");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not contain "world"');
      });

      it("should validate startsWith rule correctly", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("startsWith") as StringRule;
        rule.value = "Hello";

        const passingResult = rulesEngine.validateRule(rule, "Hello world!");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text starts with "Hello"');

        const failingResult = rulesEngine.validateRule(rule, "Hi world!");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not start with "Hello"');
      });

      it("should validate endsWith rule correctly", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("endsWith") as StringRule;
        rule.value = "world!";

        const passingResult = rulesEngine.validateRule(rule, "Hello world!");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text ends with "world!"');

        const failingResult = rulesEngine.validateRule(rule, "Hello universe!");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not end with "world!"');
      });
    });

    describe("Regex Rules", () => {
      it("should validate regex rule correctly", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("regex") as RegexRule;
        rule.pattern = "\\d+"; // Matches numbers
        rule.flags = "g";

        const passingResult = rulesEngine.validateRule(rule, "Hello 123 world");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text matches pattern /\\d+/g');

        const failingResult = rulesEngine.validateRule(rule, "Hello world");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not match pattern /\\d+/g');
      });

      it("should handle invalid regex patterns", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("regex") as RegexRule;
        rule.pattern = "["; // Invalid regex

        const result = rulesEngine.validateRule(rule, "test");
        expect(result.pass).toBe(false);
        expect(result.message).toContain("Invalid regex pattern:");
      });
    });

    describe("Length Rules", () => {
      it("should validate length range correctly", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("length") as LengthRule;
        rule.min = 5;
        rule.max = 5; // Exact length

        const passingResult = rulesEngine.validateRule(rule, "Hello");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe("Length 5 is within range 5-5");

        const failingResult = rulesEngine.validateRule(rule, "Hi");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe("Length 2 is not within range 5-5");
      });

      it("should validate minimum length only", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("length") as LengthRule;
        rule.min = 3;
        rule.max = undefined; // Only minimum

        const passingResult = rulesEngine.validateRule(rule, "Hello");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe("Length 5 is at least 3");

        const failingResult = rulesEngine.validateRule(rule, "Hi");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe("Length 2 is less than minimum 3");
      });

      it("should validate length with maximum", () => {
        const rulesEngine = useRulesEngine();
        const rulesUtils = useRulesUtils();
        const rule = rulesUtils.createRule("length") as LengthRule;
        rule.min = 0;
        rule.max = 10; // With maximum

        const passingResult = rulesEngine.validateRule(rule, "Hello");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe("Length 5 is within range 0-10");

        const failingResult = rulesEngine.validateRule(
          rule,
          "This is a very long string",
        );
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe("Length 26 is not within range 0-10");
      });
    });
  });

  describe("validateRuleSet", () => {
    it("should validate a passing rule set", () => {
      const rulesEngine = useRulesEngine();
      const rulesUtils = useRulesUtils();
      const ruleSet = rulesUtils.createRuleSet();

      const rule1 = rulesUtils.createRule("equals") as StringRule;
      rule1.value = "Hello";
      rule1.caseSensitive = true;

      const rule2 = rulesUtils.createRule("length") as LengthRule;
      rule2.min = 5;
      rule2.max = 5;

      ruleSet.rules = [rule1, rule2];

      const result = rulesEngine.validateRuleSet(ruleSet, "Hello");
      expect(result.pass).toBe(true);
      expect(result.message).toBe("All 2 rules passed");
      expect(result.passedCount).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it("should validate a failing rule set", () => {
      const rulesEngine = useRulesEngine();
      const rulesUtils = useRulesUtils();
      const ruleSet = rulesUtils.createRuleSet();

      const rule1 = rulesUtils.createRule("equals") as StringRule;
      rule1.value = "Hello";
      rule1.caseSensitive = true;

      const rule2 = rulesUtils.createRule("length") as LengthRule;
      rule2.min = 10; // This will fail for "Hello"
      rule2.max = undefined;

      ruleSet.rules = [rule1, rule2];

      const result = rulesEngine.validateRuleSet(ruleSet, "Hello");
      expect(result.pass).toBe(false);
      expect(result.message).toBe("1/2 rules passed (requires all)");
      expect(result.passedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });

    it("should handle empty rule set", () => {
      const rulesEngine = useRulesEngine();
      const rulesUtils = useRulesUtils();
      const ruleSet = rulesUtils.createRuleSet();
      ruleSet.rules = [];

      const result = rulesEngine.validateRuleSet(ruleSet, "test");
      expect(result.pass).toBe(true);
      expect(result.message).toBe("All 0 rules passed");
      expect(result.passedCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("validateRuleSets", () => {
    it("should validate multiple rule sets", () => {
      const rulesEngine = useRulesEngine();
      const rulesUtils = useRulesUtils();

      const ruleSet1 = rulesUtils.createRuleSet();
      const rule1 = rulesUtils.createRule("equals") as StringRule;
      rule1.value = "Hello";
      ruleSet1.rules = [rule1];

      const ruleSet2 = rulesUtils.createRuleSet();
      const rule2 = rulesUtils.createRule("length") as LengthRule;
      rule2.min = 5;
      rule2.max = 5;
      ruleSet2.rules = [rule2];

      const results = rulesEngine.validateRuleSets([ruleSet1, ruleSet2], "Hello");

      expect(results).toHaveLength(2);
      expect(results[0]?.pass).toBe(true);
      expect(results[1]?.pass).toBe(true);
    });

    it("should handle empty rule sets array", () => {
      const rulesEngine = useRulesEngine();
      const results = rulesEngine.validateRuleSets([], "test");
      expect(results).toHaveLength(0);
    });
  });
});
