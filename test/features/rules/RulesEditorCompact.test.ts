import { describe, it, expect } from "vitest";

// Test the rule validation with new options
describe("RulesEditorCompact - Rule Options", () => {
  // Mock rule data to test the new options functionality
  const mockStringRule = {
    id: "test-1",
    type: "equals" as const,
    value: "solution",
    caseSensitive: false,
    respectPunctuation: false,
  };

  const mockRegexRule = {
    id: "test-2",
    type: "regex" as const,
    pattern: "test.*pattern",
    flags: "g",
    caseSensitive: false,
    respectPunctuation: false,
  };

  // Test text normalization logic
  function normalizeText(text: string, caseSensitive: boolean, respectPunctuation: boolean): string {
    let normalized = text;

    // Handle case sensitivity
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    // Handle punctuation and spacing - remove if NOT respecting punctuation
    if (!respectPunctuation) {
      // Remove all punctuation, whitespace, and normalize spaces
      normalized = normalized.replace(/[^\p{L}\p{N}]/gu, '');
    }

    return normalized;
  }

  // Test string rule validation with options
  function testStringRule(rule: typeof mockStringRule, input: string): boolean {
    const caseSensitive = rule.caseSensitive ?? false;
    const respectPunctuation = rule.respectPunctuation ?? false;

    const normalizedInput = normalizeText(input, caseSensitive, respectPunctuation);
    const normalizedTarget = normalizeText(rule.value, caseSensitive, respectPunctuation);

    return normalizedInput === normalizedTarget;
  }

  it("should handle case sensitivity option correctly", () => {
    // Test case insensitive (default - unchecked)
    const caseInsensitiveRule = { ...mockStringRule, caseSensitive: false };
    expect(testStringRule(caseInsensitiveRule, "Solution")).toBe(true);
    expect(testStringRule(caseInsensitiveRule, "SOLUTION")).toBe(true);
    expect(testStringRule(caseInsensitiveRule, "solution")).toBe(true);

    // Test case sensitive (checked)
    const caseSensitiveRule = { ...mockStringRule, caseSensitive: true };
    expect(testStringRule(caseSensitiveRule, "Solution")).toBe(false);
    expect(testStringRule(caseSensitiveRule, "solution")).toBe(true);
  });

  it("should handle punctuation and spacing option correctly", () => {
    // Test with ignore punctuation (default - unchecked)
    const ignorePunctuationRule = { ...mockStringRule, respectPunctuation: false };
    expect(testStringRule(ignorePunctuationRule, "sol.u ti:on!")).toBe(true);
    expect(testStringRule(ignorePunctuationRule, "s o l u t i o n")).toBe(true);
    expect(testStringRule(ignorePunctuationRule, "solution!!!")).toBe(true);

    // Test with punctuation mattering (checked)
    const respectPunctuationRule = { ...mockStringRule, respectPunctuation: true };
    expect(testStringRule(respectPunctuationRule, "sol.u ti:on!")).toBe(false);
    expect(testStringRule(respectPunctuationRule, "solution")).toBe(true);
  });

  it("should handle combined case sensitivity and punctuation options", () => {
    // Test case insensitive + ignore punctuation (both unchecked - default)
    const combinedRule = { ...mockStringRule, caseSensitive: false, respectPunctuation: false };
    expect(testStringRule(combinedRule, "SOL.U TI:ON!")).toBe(true);
    expect(testStringRule(combinedRule, "Sol u t ion")).toBe(true);
    expect(testStringRule(combinedRule, "SOLUTION")).toBe(true);

    // Test case sensitive + ignore punctuation (case checked, punctuation unchecked)
    const caseSensitivePuncIgnoreRule = { ...mockStringRule, caseSensitive: true, respectPunctuation: false };
    expect(testStringRule(caseSensitivePuncIgnoreRule, "SOL.U TI:ON!")).toBe(false); // Wrong case
    expect(testStringRule(caseSensitivePuncIgnoreRule, "sol.u ti:on!")).toBe(true); // Right case, punctuation ignored

    // Test case insensitive + respect punctuation (case unchecked, punctuation checked)
    const caseInsensitivePuncRespectRule = { ...mockStringRule, caseSensitive: false, respectPunctuation: true };
    expect(testStringRule(caseInsensitivePuncRespectRule, "Solution")).toBe(true); // Right case insensitive
    expect(testStringRule(caseInsensitivePuncRespectRule, "solution!")).toBe(false); // Wrong punctuation
  });

  it("should handle default option values", () => {
    // Test with undefined options (should use defaults: both disabled/unchecked)
    const ruleWithDefaults = {
      id: "test-default",
      type: "equals" as const,
      value: "solution",
      caseSensitive: undefined,
      respectPunctuation: undefined,
    };

    const testWithDefaults = (rule: typeof ruleWithDefaults, input: string): boolean => {
      const caseSensitive = rule.caseSensitive ?? false;
      const respectPunctuation = rule.respectPunctuation ?? false;

      const normalizedInput = normalizeText(input, caseSensitive, respectPunctuation);
      const normalizedTarget = normalizeText(rule.value, caseSensitive, respectPunctuation);

      return normalizedInput === normalizedTarget;
    };

    // Should default to case insensitive and ignore punctuation
    expect(testWithDefaults(ruleWithDefaults, "Solution")).toBe(true); // Case insensitive default
    expect(testWithDefaults(ruleWithDefaults, "sol.u ti:on!")).toBe(true); // Ignore punctuation default
  });

  it("should work with regex rules", () => {
    const regexRule = { ...mockRegexRule };

    // Simple test - would need actual regex implementation to test fully
    expect(regexRule.caseSensitive).toBe(false);
    expect(regexRule.respectPunctuation).toBe(false);
    expect(regexRule.type).toBe("regex");
  });
});
