/**
 * Rules Engine Composable
 * Proper Vue composable with i18n support for rule validation
 */

import { useI18n } from "vue-i18n";
import type {
  Rule,
  RuleSet,
  RuleResult,
  RuleSetResult,
  StringRule,
  RegexRule,
  LengthRule,
} from "../types/rules";

interface RulesEngineComposable {
  validateRule: (rule: Rule, input: string) => RuleResult;
  validateRuleSet: (ruleSet: RuleSet, input: string) => RuleSetResult;
  validateRuleSets: (ruleSets: RuleSet[], input: string) => RuleSetResult[];
  getOverallResult: (results: RuleSetResult[]) => {
    pass: boolean;
    message: string;
  };
}

/**
 * Helper function to normalize text based on rule options
 */
function normalizeText(
  text: string,
  caseSensitive: boolean,
  respectPunctuation: boolean,
): string {
  let normalized = text;

  // Handle case sensitivity
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  // Handle punctuation and spacing - remove if NOT respecting punctuation
  if (!respectPunctuation) {
    // Remove all punctuation, whitespace, and normalize spaces
    normalized = normalized.replace(/[^\p{L}\p{N}]/gu, "");
  }

  return normalized;
}

/**
 * String rule validation helper
 */
function createStringRuleValidator(
  t: (key: string, params?: Record<string, unknown>) => string,
): {
  equals: (rule: StringRule, input: string) => RuleResult;
  contains: (rule: StringRule, input: string) => RuleResult;
  startsWith: (rule: StringRule, input: string) => RuleResult;
  endsWith: (rule: StringRule, input: string) => RuleResult;
} {
  return {
    equals: (rule: StringRule, input: string): RuleResult => {
      const caseSensitive = rule.caseSensitive ?? false;
      const respectPunctuation = rule.respectPunctuation ?? false;

      const normalizedInput = normalizeText(
        input,
        caseSensitive,
        respectPunctuation,
      );
      const normalizedTarget = normalizeText(
        rule.value,
        caseSensitive,
        respectPunctuation,
      );
      const pass = normalizedInput === normalizedTarget;

      return {
        ruleId: rule.id,
        pass,
        message: pass
          ? t("rules.validation.equals.pass", { value: rule.value })
          : t("rules.validation.equals.fail", {
              expected: rule.value,
              actual: input,
            }),
        actualValue: input,
        expectedValue: rule.value,
      };
    },
    contains: (rule: StringRule, input: string): RuleResult => {
      const caseSensitive = rule.caseSensitive ?? false;
      const respectPunctuation = rule.respectPunctuation ?? false;

      const normalizedInput = normalizeText(
        input,
        caseSensitive,
        respectPunctuation,
      );
      const normalizedTarget = normalizeText(
        rule.value,
        caseSensitive,
        respectPunctuation,
      );
      const pass = normalizedInput.includes(normalizedTarget);

      return {
        ruleId: rule.id,
        pass,
        message: pass
          ? t("rules.validation.contains.pass", { value: rule.value })
          : t("rules.validation.contains.fail", { value: rule.value }),
        actualValue: input,
        expectedValue: rule.value,
      };
    },
    startsWith: (rule: StringRule, input: string): RuleResult => {
      const caseSensitive = rule.caseSensitive ?? false;
      const respectPunctuation = rule.respectPunctuation ?? false;

      const normalizedInput = normalizeText(
        input,
        caseSensitive,
        respectPunctuation,
      );
      const normalizedTarget = normalizeText(
        rule.value,
        caseSensitive,
        respectPunctuation,
      );
      const pass = normalizedInput.startsWith(normalizedTarget);

      return {
        ruleId: rule.id,
        pass,
        message: pass
          ? t("rules.validation.startsWith.pass", { value: rule.value })
          : t("rules.validation.startsWith.fail", { value: rule.value }),
        actualValue: input,
        expectedValue: rule.value,
      };
    },
    endsWith: (rule: StringRule, input: string): RuleResult => {
      const caseSensitive = rule.caseSensitive ?? false;
      const respectPunctuation = rule.respectPunctuation ?? false;

      const normalizedInput = normalizeText(
        input,
        caseSensitive,
        respectPunctuation,
      );
      const normalizedTarget = normalizeText(
        rule.value,
        caseSensitive,
        respectPunctuation,
      );
      const pass = normalizedInput.endsWith(normalizedTarget);

      return {
        ruleId: rule.id,
        pass,
        message: pass
          ? t("rules.validation.endsWith.pass", { value: rule.value })
          : t("rules.validation.endsWith.fail", { value: rule.value }),
        actualValue: input,
        expectedValue: rule.value,
      };
    },
  };
}

/**
 * Regex rule validation helper
 */
function validateRegexRule(
  rule: RegexRule,
  input: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): RuleResult {
  try {
    const caseSensitive = rule.caseSensitive ?? false;
    const respectPunctuation = rule.respectPunctuation ?? false;

    const normalizedInput = normalizeText(
      input,
      caseSensitive,
      respectPunctuation,
    );

    // Build flags dynamically based on options
    let flags = rule.flags || "";
    if (!caseSensitive && !flags.includes("i")) {
      flags += "i";
    }

    const regex = new RegExp(rule.pattern, flags);
    const pass = regex.test(normalizedInput);

    return {
      ruleId: rule.id,
      pass,
      message: pass
        ? t("rules.validation.regex.pass", { pattern: rule.pattern, flags })
        : t("rules.validation.regex.fail", { pattern: rule.pattern, flags }),
      actualValue: input,
      expectedValue: `/${rule.pattern}/${flags}`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      ruleId: rule.id,
      pass: false,
      message: t("rules.validation.regex.invalidPattern", {
        error: errorMessage,
      }),
      actualValue: input,
      expectedValue: rule.pattern,
    };
  }
}

/**
 * Length rule validation helper
 */
function validateLengthRule(
  rule: LengthRule,
  input: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): RuleResult {
  const length = input.length;
  const { min, max } = rule;

  let pass = true;
  let message = "";

  if (min !== undefined && max !== undefined) {
    pass = length >= min && length <= max;
    message = pass
      ? t("rules.validation.length.withinRange", { length, min, max })
      : t("rules.validation.length.outsideRange", { length, min, max });
  } else if (min !== undefined) {
    pass = length >= min;
    message = pass
      ? t("rules.validation.length.atLeastMin", { length, min })
      : t("rules.validation.length.belowMin", { length, min });
  } else if (max !== undefined) {
    pass = length <= max;
    message = pass
      ? t("rules.validation.length.atMostMax", { length, max })
      : t("rules.validation.length.exceedsMax", { length, max });
  } else {
    message = t("rules.validation.length.lengthIs", { length });
  }

  return {
    ruleId: rule.id,
    pass,
    message,
    actualValue: length,
    expectedValue:
      min !== undefined && max !== undefined
        ? `${min}-${max}`
        : min !== undefined
          ? `>=${min}`
          : max !== undefined
            ? `<=${max}`
            : "any",
  };
}

// eslint-disable-next-line max-lines-per-function
export function useRulesEngine(): RulesEngineComposable {
  const { t } = useI18n();
  const stringValidator = createStringRuleValidator(t);

  const validateRule = (rule: Rule, input: string): RuleResult => {
    switch (rule.type) {
      case "equals":
        return stringValidator.equals(rule, input);
      case "contains":
        return stringValidator.contains(rule, input);
      case "startsWith":
        return stringValidator.startsWith(rule, input);
      case "endsWith":
        return stringValidator.endsWith(rule, input);
      case "regex":
        return validateRegexRule(rule, input, t);
      case "length":
        return validateLengthRule(rule, input, t);
      default:
        return {
          ruleId: "unknown",
          pass: false,
          message: t("rules.validation.unknownRuleType"),
        };
    }
  };

  const validateRuleSet = (ruleSet: RuleSet, input: string): RuleSetResult => {
    const results = ruleSet.rules.map((rule) => validateRule(rule, input));
    const passedCount = results.filter((result) => result.pass).length;
    const totalCount = results.length;

    let pass: boolean;
    let message: string;

    if (totalCount === 0) {
      pass = true;
      message = t("rules.validation.ruleSet.noRules");
    } else if (ruleSet.aggregation === "AND") {
      pass = passedCount === totalCount;
      message = pass
        ? t("rules.validation.ruleSet.allPassed", { total: totalCount })
        : t("rules.validation.ruleSet.somePassedAnd", {
            passed: passedCount,
            total: totalCount,
          });
    } else {
      pass = passedCount > 0;
      message = pass
        ? t("rules.validation.ruleSet.somePassedOr", {
            passed: passedCount,
            total: totalCount,
          })
        : t("rules.validation.ruleSet.nonePassedOr");
    }

    return {
      ruleSetId: ruleSet.id,
      pass,
      message,
      results,
      aggregation: ruleSet.aggregation,
      passedCount,
      totalCount,
    };
  };

  const validateRuleSets = (
    ruleSets: RuleSet[],
    input: string,
  ): RuleSetResult[] => {
    return ruleSets.map((ruleSet) => validateRuleSet(ruleSet, input));
  };

  const getOverallResult = (
    results: RuleSetResult[],
  ): { pass: boolean; message: string } => {
    const nonEmptyResults = results.filter((result) => result.totalCount > 0);

    if (nonEmptyResults.length === 0) {
      return {
        pass: true,
        message: t("rules.validation.ruleSet.noRuleSets"),
      };
    }

    const passedRuleSets = nonEmptyResults.filter(
      (result) => result.pass,
    ).length;
    const totalRuleSets = nonEmptyResults.length;

    return {
      pass: passedRuleSets === totalRuleSets,
      message:
        passedRuleSets === totalRuleSets
          ? t("rules.validation.ruleSet.overallAllPassed", {
              total: totalRuleSets,
            })
          : t("rules.validation.ruleSet.overallSomePassed", {
              passed: passedRuleSets,
              total: totalRuleSets,
            }),
    };
  };

  return {
    validateRule,
    validateRuleSet,
    validateRuleSets,
    getOverallResult,
  };
}
