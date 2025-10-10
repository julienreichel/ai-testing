import { describe, it, expect } from "vitest";
import { RuleEngine } from "../../../src/features/rules/engine";
import { createRule, createRuleSet } from "../../../src/features/rules/utils";
import type {
  StringRule,
  RegexRule,
  LengthRule,
  RuleSetResult,
} from "../../../src/features/rules/types";

describe("RuleEngine", () => {
  describe("validateRule", () => {
    describe("String Rules", () => {
      it("should validate equals rule correctly", () => {
        const rule = createRule("equals") as StringRule;
        rule.value = "Hello World";
        rule.caseSensitive = true;

        const passingResult = RuleEngine.validateRule(rule, "Hello World");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text equals "Hello World"');

        const failingResult = RuleEngine.validateRule(rule, "hello world");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe(
          'Expected "Hello World", got "hello world"',
        );
      });

      it("should handle case insensitive equals rule", () => {
        const rule = createRule("equals") as StringRule;
        rule.value = "Hello World";
        rule.caseSensitive = false;

        const result = RuleEngine.validateRule(rule, "hello world");
        expect(result.pass).toBe(true);
        expect(result.message).toBe('Text equals "Hello World"');
      });

      it("should validate contains rule correctly", () => {
        const rule = createRule("contains") as StringRule;
        rule.value = "world";

        const passingResult = RuleEngine.validateRule(rule, "Hello world!");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text contains "world"');

        const failingResult = RuleEngine.validateRule(rule, "Hello universe!");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not contain "world"');
      });

      it("should validate startsWith rule correctly", () => {
        const rule = createRule("startsWith") as StringRule;
        rule.value = "Hello";

        const passingResult = RuleEngine.validateRule(rule, "Hello world!");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text starts with "Hello"');

        const failingResult = RuleEngine.validateRule(rule, "Hi world!");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not start with "Hello"');
      });

      it("should validate endsWith rule correctly", () => {
        const rule = createRule("endsWith") as StringRule;
        rule.value = "world!";

        const passingResult = RuleEngine.validateRule(rule, "Hello world!");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text ends with "world!"');

        const failingResult = RuleEngine.validateRule(rule, "Hello universe!");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe('Text does not end with "world!"');
      });
    });

    describe("Regex Rules", () => {
      it("should validate regex rule correctly", () => {
        const rule = createRule("regex") as RegexRule;
        rule.pattern = "\\d+";
        rule.flags = "g";

        const passingResult = RuleEngine.validateRule(rule, "Hello 123 world");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe('Text matches pattern /\\d+/g');

        const failingResult = RuleEngine.validateRule(
          rule,
          "Hello world without numbers",
        );
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe(
          'Text does not match pattern /\\d+/g',
        );
      });

      it("should handle regex with flags", () => {
        const rule = createRule("regex") as RegexRule;
        rule.pattern = "hello";
        rule.flags = "i"; // Case insensitive

        const result = RuleEngine.validateRule(rule, "HELLO WORLD");
        expect(result.pass).toBe(true);
        expect(result.message).toBe('Text matches pattern /hello/i');
      });

      it("should handle invalid regex patterns", () => {
        const rule = createRule("regex") as RegexRule;
        rule.pattern = "[invalid";
        rule.flags = "g";

        const result = RuleEngine.validateRule(rule, "test");
        expect(result.pass).toBe(false);
        expect(result.message).toMatch(/Invalid regex pattern/);
      });
    });

    describe("Length Rules", () => {
      it("should validate length range correctly", () => {
        const rule = createRule("length") as LengthRule;
        rule.min = 5;
        rule.max = 10;

        const passingResult = RuleEngine.validateRule(rule, "Hello");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe("Length 5 is within range 5-10");

        const failingResult = RuleEngine.validateRule(
          rule,
          "This is a very long text",
        );
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe("Length 24 is not within range 5-10");
      });

      it("should validate minimum length only", () => {
        const rule = createRule("length") as LengthRule;
        rule.min = 5;
        rule.max = undefined;

        const passingResult = RuleEngine.validateRule(rule, "Hello World");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe("Length 11 is at least 5");

        const failingResult = RuleEngine.validateRule(rule, "Hi");
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe(
          "Length 2 is less than minimum 5",
        );
      });

      it("should validate maximum length only", () => {
        const rule = createRule("length") as LengthRule;
        rule.min = 0;
        rule.max = 5;

        const passingResult = RuleEngine.validateRule(rule, "Hello");
        expect(passingResult.pass).toBe(true);
        expect(passingResult.message).toBe("Length 5 is within range 0-5");

        const failingResult = RuleEngine.validateRule(
          rule,
          "Hello World",
        );
        expect(failingResult.pass).toBe(false);
        expect(failingResult.message).toBe("Length 11 is not within range 0-5");
      });
    });
  });

  describe("validateRuleSet", () => {
    it("should validate rule set with AND aggregation", () => {
      const ruleSet = createRuleSet();
      ruleSet.aggregation = "AND";

      const rule1 = createRule("contains") as StringRule;
      rule1.value = "Hello";

      const rule2 = createRule("contains") as StringRule;
      rule2.value = "World";

      ruleSet.rules = [rule1, rule2];

      const passingResult = RuleEngine.validateRuleSet(
        ruleSet,
        "Hello World",
      );
      expect(passingResult.pass).toBe(true);
      expect(passingResult.message).toBe("All 2 rules passed");
      expect(passingResult.passedCount).toBe(2);
      expect(passingResult.totalCount).toBe(2);

      const failingResult = RuleEngine.validateRuleSet(
        ruleSet,
        "Hello Universe",
      );
      expect(failingResult.pass).toBe(false);
      expect(failingResult.message).toBe("1/2 rules passed (requires all)");
      expect(failingResult.passedCount).toBe(1);
      expect(failingResult.totalCount).toBe(2);
    });

    it("should validate rule set with OR aggregation", () => {
      const ruleSet = createRuleSet();
      ruleSet.aggregation = "OR";

      const rule1 = createRule("contains") as StringRule;
      rule1.value = "Hello";

      const rule2 = createRule("contains") as StringRule;
      rule2.value = "Hi";

      ruleSet.rules = [rule1, rule2];

      const passingResult = RuleEngine.validateRuleSet(
        ruleSet,
        "Hello World",
      );
      expect(passingResult.pass).toBe(true);
      expect(passingResult.message).toBe("1/2 rules passed (requires at least one)");
      expect(passingResult.passedCount).toBe(1);
      expect(passingResult.totalCount).toBe(2);

      const failingResult = RuleEngine.validateRuleSet(
        ruleSet,
        "Good morning",
      );
      expect(failingResult.pass).toBe(false);
      expect(failingResult.message).toBe("No rules passed (requires at least one)");
      expect(failingResult.passedCount).toBe(0);
      expect(failingResult.totalCount).toBe(2);
    });

    it("should handle empty rule set", () => {
      const ruleSet = createRuleSet();
      ruleSet.rules = [];

      const result = RuleEngine.validateRuleSet(ruleSet, "Any text");
      expect(result.pass).toBe(true);
      expect(result.message).toBe("No rules to validate");
      expect(result.totalCount).toBe(0);
    });
  });

  describe("validateRuleSets", () => {
    it("should validate multiple rule sets", () => {
      const ruleSet1 = createRuleSet();
      const rule1 = createRule("contains") as StringRule;
      rule1.value = "Hello";
      ruleSet1.rules = [rule1];

      const ruleSet2 = createRuleSet();
      const rule2 = createRule("contains") as StringRule;
      rule2.value = "World";
      ruleSet2.rules = [rule2];

      const results = RuleEngine.validateRuleSets(
        [ruleSet1, ruleSet2],
        "Hello World",
      );

      expect(results).toHaveLength(2);
      expect(results[0]?.pass).toBe(true);
      expect(results[1]?.pass).toBe(true);
    });
  });

  describe("getOverallResult", () => {
    it("should return overall pass when all rule sets pass", () => {
      const results: RuleSetResult[] = [
        {
          ruleSetId: "set1",
          pass: true,
          message: "All rules passed",
          results: [],
          aggregation: "AND",
          passedCount: 1,
          totalCount: 1,
        },
        {
          ruleSetId: "set2",
          pass: true,
          message: "All rules passed",
          results: [],
          aggregation: "AND",
          passedCount: 1,
          totalCount: 1,
        },
      ];

      const overall = RuleEngine.getOverallResult(results);
      expect(overall.pass).toBe(true);
      expect(overall.message).toBe("All 2 rule sets passed");
    });

    it("should return overall fail when some rule sets fail", () => {
      const results: RuleSetResult[] = [
        {
          ruleSetId: "set1",
          pass: true,
          message: "All rules passed",
          results: [],
          aggregation: "AND",
          passedCount: 1,
          totalCount: 1,
        },
        {
          ruleSetId: "set2",
          pass: false,
          message: "Rule failed",
          results: [],
          aggregation: "AND",
          passedCount: 0,
          totalCount: 1,
        },
      ];

      const overall = RuleEngine.getOverallResult(results);
      expect(overall.pass).toBe(false);
      expect(overall.message).toBe("1/2 rule sets passed");
    });

    it("should handle empty results", () => {
      const overall = RuleEngine.getOverallResult([]);
      expect(overall.pass).toBe(true);
      expect(overall.message).toBe("No rule sets to validate");
    });

    it("should ignore rule sets with no enabled rules", () => {
      const results: RuleSetResult[] = [
        {
          ruleSetId: "set1",
          pass: true,
          message: "No rules to validate",
          results: [],
          aggregation: "AND",
          passedCount: 0,
          totalCount: 0,
        },
      ];

      const overall = RuleEngine.getOverallResult(results);
      expect(overall.pass).toBe(true);
      expect(overall.message).toBe("No rule sets to validate");
    });
  });
});