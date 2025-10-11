import type {
  Rule,
  RuleSet,
  RuleType,
  StringRule,
  RegexRule,
  LengthRule,
} from "../types/rules";

/**
 * Generate unique ID for rules and rule sets
 */
export function generateId(): string {
  const BASE_36 = 36;
  const RANDOM_SUFFIX_LENGTH = 2;
  return (
    Date.now().toString(BASE_36) +
    Math.random().toString(BASE_36).substr(RANDOM_SUFFIX_LENGTH)
  );
}

/**
 * Create a new rule with default values
 */
export function createRule(type: RuleType): Rule {
  const baseRule = {
    id: generateId(),
    type,
  };

  switch (type) {
    case "equals":
    case "contains":
    case "startsWith":
    case "endsWith":
      return {
        ...baseRule,
        type,
        value: "",
        caseSensitive: true,
      } as StringRule;

    case "regex":
      return {
        ...baseRule,
        type: "regex",
        pattern: "",
        flags: "g",
      } as RegexRule;

    case "length":
      return {
        ...baseRule,
        type: "length",
        min: 0,
        max: undefined,
      } as LengthRule;

    default:
      throw new Error(`Unsupported rule type: ${String(type)}`);
  }
}

/**
 * Create a new rule set
 */
export function createRuleSet(): RuleSet {
  return {
    id: generateId(),
    rules: [],
    aggregation: "AND",
  };
}

/**
 * Clone a rule (deep copy)
 */
export function cloneRule(rule: Rule): Rule {
  return structuredClone(rule);
}

/**
 * Clone a rule set (deep copy)
 */
export function cloneRuleSet(ruleSet: RuleSet): RuleSet {
  return structuredClone(ruleSet);
}

/**
 * Move rule within a rule set
 */
export function moveRule(
  rules: Rule[],
  fromIndex: number,
  toIndex: number,
): Rule[] {
  const newRules = [...rules];
  const [movedRule] = newRules.splice(fromIndex, 1);
  if (movedRule) {
    newRules.splice(toIndex, 0, movedRule);
  }
  return newRules;
}

/**
 * Rule type options for UI
 */
export const RULE_TYPE_OPTIONS = [
  { value: "equals", label: "Equals", description: "Text must match exactly" },
  {
    value: "contains",
    label: "Contains",
    description: "Text must contain the specified value",
  },
  {
    value: "startsWith",
    label: "Starts With",
    description: "Text must start with the specified value",
  },
  {
    value: "endsWith",
    label: "Ends With",
    description: "Text must end with the specified value",
  },
  {
    value: "regex",
    label: "Regex",
    description: "Text must match the regular expression pattern",
  },
  {
    value: "length",
    label: "Length",
    description: "Text length must be within specified range",
  },
] as const;

/**
 * Rule type descriptions for backward compatibility
 */
export const RULE_TYPE_DESCRIPTIONS: Record<RuleType, string> = {
  equals: "Text must match exactly",
  contains: "Text must contain the specified value",
  startsWith: "Text must start with the specified value",
  endsWith: "Text must end with the specified value",
  regex: "Text must match the regular expression pattern",
  length: "Text length must be within specified range",
};

/**
 * Simple rule validation for backward compatibility
 */
export function validateRuleConfig(_rule: Rule): {
  valid: boolean;
  errors: string[];
} {
  // For our simplified rules, we'll just return valid for any rule
  // This maintains backward compatibility without complex validation
  return {
    valid: true,
    errors: [],
  };
}
