import type {
  Rule,
  RuleSet,
  RuleResult,
  RuleSetResult,
  StringRule,
  RegexRule,
  LengthRule,
} from "../types/rules";

// Translation messages - these could be moved to i18n in the future
const MESSAGES = {
  equals: {
    pass: (value: string): string => `Text equals "${value}"`,
    fail: (expected: string, actual: string): string => `Expected "${expected}", got "${actual}"`,
  },
  contains: {
    pass: (value: string): string => `Text contains "${value}"`,
    fail: (value: string): string => `Text does not contain "${value}"`,
  },
  startsWith: {
    pass: (value: string): string => `Text starts with "${value}"`,
    fail: (value: string): string => `Text does not start with "${value}"`,
  },
  endsWith: {
    pass: (value: string): string => `Text ends with "${value}"`,
    fail: (value: string): string => `Text does not end with "${value}"`,
  },
  regex: {
    pass: (pattern: string, flags: string): string =>
      `Text matches pattern /${pattern}/${flags}`,
    fail: (pattern: string, flags: string): string =>
      `Text does not match pattern /${pattern}/${flags}`,
    invalidPattern: (error: string): string => `Invalid regex pattern: ${error}`,
  },
  length: {
    withinRange: (length: number, min: number, max: number): string =>
      `Length ${length} is within range ${min}-${max}`,
    outsideRange: (length: number, min: number, max: number): string =>
      `Length ${length} is not within range ${min}-${max}`,
    atLeastMin: (length: number, min: number): string =>
      `Length ${length} is at least ${min}`,
    belowMin: (length: number, min: number): string =>
      `Length ${length} is less than minimum ${min}`,
    atMostMax: (length: number, max: number): string =>
      `Length ${length} is at most ${max}`,
    exceedsMax: (length: number, max: number): string =>
      `Length ${length} exceeds maximum ${max}`,
    lengthIs: (length: number): string => `Length is ${length}`,
  },
  ruleSet: {
    noRules: (): string => "No rules to validate",
    allPassed: (total: number): string => `All ${total} rules passed`,
    somePassedAnd: (passed: number, total: number): string =>
      `${passed}/${total} rules passed (requires all)`,
    somePassedOr: (passed: number, total: number): string =>
      `${passed}/${total} rules passed (requires at least one)`,
    nonePassedOr: (): string => "No rules passed (requires at least one)",
    overallAllPassed: (total: number): string => `All ${total} rule sets passed`,
    overallSomePassed: (passed: number, total: number): string =>
      `${passed}/${total} rule sets passed`,
    noRuleSets: (): string => "No rule sets to validate",
  },
  unknownRuleType: (): string => "Unknown rule type",
};

/**
 * Rule validation functions
 */
const validateEqualsRule = (rule: StringRule, input: string): RuleResult => {
  const comparison = rule.caseSensitive !== false ? input : input.toLowerCase();
  const target =
    rule.caseSensitive !== false ? rule.value : rule.value.toLowerCase();
  const pass = comparison === target;

  return {
    ruleId: rule.id,
    pass,
    message: pass
      ? MESSAGES.equals.pass(rule.value)
      : MESSAGES.equals.fail(rule.value, input),
    actualValue: input,
    expectedValue: rule.value,
  };
};

const validateContainsRule = (rule: StringRule, input: string): RuleResult => {
  const comparison = rule.caseSensitive !== false ? input : input.toLowerCase();
  const target =
    rule.caseSensitive !== false ? rule.value : rule.value.toLowerCase();
  const pass = comparison.includes(target);

  return {
    ruleId: rule.id,
    pass,
    message: pass
      ? MESSAGES.contains.pass(rule.value)
      : MESSAGES.contains.fail(rule.value),
    actualValue: input,
    expectedValue: rule.value,
  };
};

const validateStartsWithRule = (
  rule: StringRule,
  input: string,
): RuleResult => {
  const comparison = rule.caseSensitive !== false ? input : input.toLowerCase();
  const target =
    rule.caseSensitive !== false ? rule.value : rule.value.toLowerCase();
  const pass = comparison.startsWith(target);

  return {
    ruleId: rule.id,
    pass,
    message: pass
      ? MESSAGES.startsWith.pass(rule.value)
      : MESSAGES.startsWith.fail(rule.value),
    actualValue: input,
    expectedValue: rule.value,
  };
};

const validateEndsWithRule = (rule: StringRule, input: string): RuleResult => {
  const comparison = rule.caseSensitive !== false ? input : input.toLowerCase();
  const target =
    rule.caseSensitive !== false ? rule.value : rule.value.toLowerCase();
  const pass = comparison.endsWith(target);

  return {
    ruleId: rule.id,
    pass,
    message: pass
      ? MESSAGES.endsWith.pass(rule.value)
      : MESSAGES.endsWith.fail(rule.value),
    actualValue: input,
    expectedValue: rule.value,
  };
};

const validateRegexRule = (rule: RegexRule, input: string): RuleResult => {
  try {
    const regex = new RegExp(rule.pattern, rule.flags || "");
    const pass = regex.test(input);
    const flags = rule.flags || "";

    return {
      ruleId: rule.id,
      pass,
      message: pass
        ? MESSAGES.regex.pass(rule.pattern, flags)
        : MESSAGES.regex.fail(rule.pattern, flags),
      actualValue: input,
      expectedValue: `/${rule.pattern}/${flags}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      ruleId: rule.id,
      pass: false,
      message: MESSAGES.regex.invalidPattern(errorMessage),
      actualValue: input,
      expectedValue: rule.pattern,
    };
  }
};

const validateLengthRule = (rule: LengthRule, input: string): RuleResult => {
  const length = input.length;
  const { min, max } = rule;

  let pass = true;
  let message = "";

  if (min !== undefined && max !== undefined) {
    pass = length >= min && length <= max;
    message = pass
      ? MESSAGES.length.withinRange(length, min, max)
      : MESSAGES.length.outsideRange(length, min, max);
  } else if (min !== undefined) {
    pass = length >= min;
    message = pass
      ? MESSAGES.length.atLeastMin(length, min)
      : MESSAGES.length.belowMin(length, min);
  } else if (max !== undefined) {
    pass = length <= max;
    message = pass
      ? MESSAGES.length.atMostMax(length, max)
      : MESSAGES.length.exceedsMax(length, max);
  } else {
    message = MESSAGES.length.lengthIs(length);
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
};

/**
 * Validate any rule type
 */
const validateAnyRule = (rule: Rule, input: string): RuleResult => {
  switch (rule.type) {
    case "equals":
      return validateEqualsRule(rule, input);
    case "contains":
      return validateContainsRule(rule, input);
    case "startsWith":
      return validateStartsWithRule(rule, input);
    case "endsWith":
      return validateEndsWithRule(rule, input);
    case "regex":
      return validateRegexRule(rule, input);
    case "length":
      return validateLengthRule(rule, input);
    default:
      // This should never happen with proper TypeScript usage
      return {
        ruleId: "unknown",
        pass: false,
        message: MESSAGES.unknownRuleType(),
      };
  }
};

/**
 * Rule engine class for evaluating outputs against rules
 */
export class RuleEngine {
  /**
   * Validate a single rule against input text
   */
  static validateRule(rule: Rule, input: string): RuleResult {
    return validateAnyRule(rule, input);
  }

  /**
   * Validate a rule set against input text
   */
  static validateRuleSet(ruleSet: RuleSet, input: string): RuleSetResult {
    const results = ruleSet.rules.map((rule) => this.validateRule(rule, input));

    const passedCount = results.filter((result) => result.pass).length;
    const totalCount = results.length;

    let pass: boolean;
    let message: string;

    if (totalCount === 0) {
      pass = true;
      message = MESSAGES.ruleSet.noRules();
    } else if (ruleSet.aggregation === "AND") {
      pass = passedCount === totalCount;
      message = pass
        ? MESSAGES.ruleSet.allPassed(totalCount)
        : MESSAGES.ruleSet.somePassedAnd(passedCount, totalCount);
    } else {
      // OR
      pass = passedCount > 0;
      message = pass
        ? MESSAGES.ruleSet.somePassedOr(passedCount, totalCount)
        : MESSAGES.ruleSet.nonePassedOr();
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
  }

  /**
   * Validate multiple rule sets against input text
   */
  static validateRuleSets(ruleSets: RuleSet[], input: string): RuleSetResult[] {
    return ruleSets.map((ruleSet) => this.validateRuleSet(ruleSet, input));
  }

  /**
   * Get overall pass/fail status for multiple rule set results
   */
  static getOverallResult(results: RuleSetResult[]): {
    pass: boolean;
    message: string;
  } {
    const nonEmptyResults = results.filter((result) => result.totalCount > 0);

    if (nonEmptyResults.length === 0) {
      return {
        pass: true,
        message: MESSAGES.ruleSet.noRuleSets(),
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
          ? MESSAGES.ruleSet.overallAllPassed(totalRuleSets)
          : MESSAGES.ruleSet.overallSomePassed(passedRuleSets, totalRuleSets),
    };
  }
}
