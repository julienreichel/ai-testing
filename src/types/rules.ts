/**
 * Core rule engine types and interfaces
 */

export type RuleType =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "regex"
  | "length";

export type RuleAggregation = "AND" | "OR";

export interface BaseRule {
  id: string;
  type: RuleType;
}

export interface StringRule extends BaseRule {
  type: "equals" | "contains" | "startsWith" | "endsWith";
  value: string;
  caseSensitive?: boolean;
  respectPunctuation?: boolean;
}

export interface RegexRule extends BaseRule {
  type: "regex";
  pattern: string;
  flags?: string;
  caseSensitive?: boolean;
  respectPunctuation?: boolean;
}

export interface LengthRule extends BaseRule {
  type: "length";
  min?: number;
  max?: number;
}

export type Rule = StringRule | RegexRule | LengthRule;

export interface RuleSet {
  id: string;
  rules: Rule[];
  aggregation: RuleAggregation;
}

export interface RuleResult {
  ruleId: string;
  pass: boolean;
  message: string;
  actualValue?: string | number;
  expectedValue?: string | number;
}

export interface RuleSetResult {
  ruleSetId: string;
  pass: boolean;
  message: string;
  results: RuleResult[];
  aggregation: RuleAggregation;
  passedCount: number;
  totalCount: number;
}

/**
 * Rule validation function type
 */
export type RuleValidator = (rule: Rule, input: string) => RuleResult;
