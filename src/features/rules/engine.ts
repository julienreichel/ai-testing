import type {
  Rule,
  RuleSet,
  RuleResult,
  RuleSetResult,
  StringRule,
  RegexRule,
  LengthRule,
} from "./types";

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
      ? `Text equals "${rule.value}"`
      : `Expected "${rule.value}", got "${input}"`,
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
      ? `Text contains "${rule.value}"`
      : `Text does not contain "${rule.value}"`,
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
      ? `Text starts with "${rule.value}"`
      : `Text does not start with "${rule.value}"`,
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
      ? `Text ends with "${rule.value}"`
      : `Text does not end with "${rule.value}"`,
    actualValue: input,
    expectedValue: rule.value,
  };
};

const validateRegexRule = (rule: RegexRule, input: string): RuleResult => {
  try {
    const regex = new RegExp(rule.pattern, rule.flags || "");
    const pass = regex.test(input);

    return {
      ruleId: rule.id,
      pass,
      message: pass
        ? `Text matches pattern /${rule.pattern}/${rule.flags || ""}`
        : `Text does not match pattern /${rule.pattern}/${rule.flags || ""}`,
      actualValue: input,
      expectedValue: `/${rule.pattern}/${rule.flags || ""}`,
    };
  } catch (error) {
    return {
      ruleId: rule.id,
      pass: false,
      message: `Invalid regex pattern: ${error instanceof Error ? error.message : "Unknown error"}`,
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
      ? `Length ${length} is within range ${min}-${max}`
      : `Length ${length} is not within range ${min}-${max}`;
  } else if (min !== undefined) {
    pass = length >= min;
    message = pass
      ? `Length ${length} is at least ${min}`
      : `Length ${length} is less than minimum ${min}`;
  } else if (max !== undefined) {
    pass = length <= max;
    message = pass
      ? `Length ${length} is at most ${max}`
      : `Length ${length} exceeds maximum ${max}`;
  } else {
    message = `Length is ${length}`;
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
        message: "Unknown rule type",
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
      message = "No rules to validate";
    } else if (ruleSet.aggregation === "AND") {
      pass = passedCount === totalCount;
      message = pass
        ? `All ${totalCount} rules passed`
        : `${passedCount}/${totalCount} rules passed (requires all)`;
    } else {
      // OR
      pass = passedCount > 0;
      message = pass
        ? `${passedCount}/${totalCount} rules passed (requires at least one)`
        : `No rules passed (requires at least one)`;
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
        message: "No rule sets to validate",
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
          ? `All ${totalRuleSets} rule sets passed`
          : `${passedRuleSets}/${totalRuleSets} rule sets passed`,
    };
  }
}
