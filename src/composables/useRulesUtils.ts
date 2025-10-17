import { useI18n } from "vue-i18n";
import type {
  Rule,
  RuleSet,
  RuleType,
  StringRule,
  RegexRule,
  LengthRule,
} from "../types/rules";

/**
 * Rule type option interface for UI components
 */
export interface RuleTypeOption {
  value: RuleType;
  label: string;
  description: string;
}

/**
 * Rules utils composable interface
 */
export interface RulesUtilsComposable {
  // Rule type utilities with i18n
  getRuleTypeOptions: () => RuleTypeOption[];
  getRuleTypeDescriptions: () => Record<RuleType, string>;
  getRuleTypeLabel: (type: RuleType) => string;
  getRuleTypeDescription: (type: RuleType) => string;

  // Pure utility functions
  generateId: () => string;
  createRule: (type: RuleType) => Rule;
  createRuleSet: () => RuleSet;
  cloneRule: (rule: Rule) => Rule;
  cloneRuleSet: (ruleSet: RuleSet) => RuleSet;
  moveRule: (rules: Rule[], fromIndex: number, toIndex: number) => Rule[];
  validateRuleConfig: (rule: Rule) => boolean;
}

/**
 * Generate unique ID for rules and rule sets
 */
function createUniqueId(): string {
  const BASE_36 = 36;
  const RANDOM_SUFFIX_LENGTH = 2;
  return (
    Date.now().toString(BASE_36) +
    Math.random().toString(BASE_36).substr(RANDOM_SUFFIX_LENGTH)
  );
}

/**
 * Create a new rule with default values based on type
 */
function createRuleByType(type: RuleType, generateId: () => string): Rule {
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
        caseSensitive: false,
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
 * Rules utilities composable with i18n support
 *
 * This composable provides internationalized rule type information
 * and utility functions for rule management.
 */
export function useRulesUtils(): RulesUtilsComposable {
  const { t } = useI18n();

  const RULE_TYPES: RuleType[] = [
    "equals",
    "contains",
    "startsWith",
    "endsWith",
    "regex",
    "length",
  ];

  // I18n-related functions
  const getRuleTypeOptions = (): RuleTypeOption[] => {
    return RULE_TYPES.map((type) => ({
      value: type,
      label: t(`rules.types.${type}.label`),
      description: t(`rules.types.${type}.description`),
    }));
  };

  const getRuleTypeDescriptions = (): Record<RuleType, string> => {
    const descriptions: Record<RuleType, string> = {} as Record<
      RuleType,
      string
    >;
    RULE_TYPES.forEach((type) => {
      descriptions[type] = t(`rules.types.${type}.description`);
    });
    return descriptions;
  };

  const getRuleTypeLabel = (type: RuleType): string => {
    return t(`rules.types.${type}.label`);
  };

  const getRuleTypeDescription = (type: RuleType): string => {
    return t(`rules.types.${type}.description`);
  }; // Pure utility functions using helper functions
  const generateId = (): string => createUniqueId();

  const createRule = (type: RuleType): Rule =>
    createRuleByType(type, generateId);

  /**
   * Create a new rule set
   */
  const createRuleSet = (): RuleSet => {
    return {
      id: generateId(),
      rules: [],
      aggregation: "AND",
    };
  };

  /**
   * Clone a rule (deep copy with new ID)
   */
  const cloneRule = (rule: Rule): Rule => {
    const cloned = structuredClone(rule);
    cloned.id = generateId();
    return cloned;
  };

  /**
   * Clone a rule set (deep copy with new IDs)
   */
  const cloneRuleSet = (ruleSet: RuleSet): RuleSet => {
    const cloned = structuredClone(ruleSet);
    cloned.id = generateId();
    cloned.rules = cloned.rules.map((rule) => cloneRule(rule));
    return cloned;
  };

  /**
   * Move rule within a rule set
   */
  const moveRule = (
    rules: Rule[],
    fromIndex: number,
    toIndex: number,
  ): Rule[] => {
    const newRules = [...rules];
    const [movedRule] = newRules.splice(fromIndex, 1);
    if (movedRule) {
      newRules.splice(toIndex, 0, movedRule);
    }
    return newRules;
  };

  /**
   * Simple rule validation for backward compatibility
   */
  const validateRuleConfig = (_rule: Rule): boolean => {
    // For our simplified rules, we'll just return valid for any rule
    // This maintains backward compatibility without complex validation
    return true;
  };

  return {
    // Rule type utilities with i18n
    getRuleTypeOptions,
    getRuleTypeDescriptions,
    getRuleTypeLabel,
    getRuleTypeDescription,

    // Pure utility functions
    generateId,
    createRule,
    createRuleSet,
    cloneRule,
    cloneRuleSet,
    moveRule,
    validateRuleConfig,
  };
}
