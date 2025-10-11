<template>
  <div class="rules-editor-compact">
    <!-- Top controls on single line -->
    <div class="rules-controls">
      <div class="aggregation-control">
        <label>Aggregation:</label>
        <select
          :value="ruleSet.aggregation"
          @change="updateAggregation"
          class="aggregation-select"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      </div>

      <div class="action-buttons">
        <base-button @click="addRule" variant="primary" size="sm">
          Add Rule
        </base-button>

        <base-button
          v-if="hasRules"
          @click="testRules"
          variant="outline"
          size="sm"
        >
          Test Rules
        </base-button>
      </div>
    </div>

    <!-- Rules list - compact single-line format -->
    <div v-if="hasRules" class="rules-list">
      <div
        v-for="(rule, index) in ruleSet.rules"
        :key="rule.id"
        class="rule-item"
      >
        <div class="rule-content">
          <!-- Rule type selector -->
          <select
            :value="rule.type"
            @change="updateRuleType(index, $event)"
            class="rule-type-select"
          >
            <option
              v-for="option in RULE_TYPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- Rule configuration inline -->
          <div class="rule-config">
            <!-- String rules -->
            <input
              v-if="
                rule.type === 'equals' ||
                rule.type === 'contains' ||
                rule.type === 'startsWith' ||
                rule.type === 'endsWith'
              "
              :value="rule.value"
              @input="updateRuleValue(index, $event)"
              placeholder="Enter value"
              class="rule-input"
            />

            <!-- Regex rules -->
            <div v-else-if="rule.type === 'regex'" class="regex-config">
              <input
                :value="rule.pattern"
                @input="updateRulePattern(index, $event)"
                placeholder="Enter pattern"
                class="rule-input"
              />
              <input
                :value="rule.flags || ''"
                @input="updateRuleFlags(index, $event)"
                placeholder="flags"
                class="flags-input"
              />
            </div>

            <!-- Length rules -->
            <div v-else-if="rule.type === 'length'" class="length-config">
              <input
                :value="rule.min || ''"
                @input="updateRuleMin(index, $event)"
                placeholder="min"
                type="number"
                class="length-input"
              />
              <span>-</span>
              <input
                :value="rule.max || ''"
                @input="updateRuleMax(index, $event)"
                placeholder="max"
                type="number"
                class="length-input"
              />
            </div>
          </div>
        </div>

        <!-- Remove button -->
        <base-button
          @click="removeRule(index)"
          variant="outline"
          size="sm"
          class="remove-button"
        >
          ×
        </base-button>
      </div>
    </div>

    <!-- Test Results -->
    <div v-if="testResult" class="test-results">
      <div
        :class="[
          'result-summary',
          testResult.passed ? 'result-pass' : 'result-fail',
        ]"
      >
        <span class="result-icon">
          {{ testResult.passed ? "✓" : "✗" }}
        </span>
        <span>
          {{ testResult.passed ? "Test Passed" : "Test Failed" }}
        </span>
        <span class="result-details">
          ({{ testResult.passedRules }}/{{ testResult.totalRules }} rules
          passed)
        </span>
      </div>

      <div v-if="testResult.details.length > 0" class="result-details-list">
        <div
          v-for="(detail, index) in testResult.details"
          :key="index"
          :class="[
            'result-detail',
            detail.passed ? 'detail-pass' : 'detail-fail',
          ]"
        >
          <span class="detail-icon">
            {{ detail.passed ? "✓" : "✗" }}
          </span>
          <span class="detail-text">{{ detail.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type {
  RuleSet,
  Rule,
  RuleType,
  StringRule,
  RegexRule,
  LengthRule,
} from "../../../features/rules/types";
import {
  createRuleSet,
  createRule,
  RULE_TYPE_OPTIONS,
} from "../../../features/rules/utils";
import { RuleEngine } from "../../../features/rules/engine";
import BaseButton from "../../../components/ui/BaseButton.vue";

interface Props {
  testData?: string;
}

const props = withDefaults(defineProps<Props>(), {
  testData: "",
});

// Use defineModel for two-way binding
const ruleSet = defineModel<RuleSet>("ruleSet", {
  default: () => createRuleSet(),
});

const testResult = ref<{
  passed: boolean;
  passedRules: number;
  totalRules: number;
  details: Array<{ passed: boolean; message: string }>;
} | null>(null);

// Computed properties
const hasRules = computed(() => ruleSet.value.rules.length > 0);

// Methods
function updateAggregation(event: Event): void {
  const target = event.target as HTMLSelectElement;
  ruleSet.value.aggregation = target.value as "AND" | "OR";
}

function addRule(): void {
  const newRule = createRule("equals");
  ruleSet.value.rules.push(newRule);
}

function removeRule(index: number): void {
  ruleSet.value.rules.splice(index, 1);
}

function updateRuleType(index: number, event: Event): void {
  const target = event.target as HTMLSelectElement;
  const newRule = createRule(target.value as RuleType);
  ruleSet.value.rules[index] = newRule;
}

function updateRuleValue(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const rule = ruleSet.value.rules[index] as StringRule;
  rule.value = target.value;
}

function updateRulePattern(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const rule = ruleSet.value.rules[index] as RegexRule;
  rule.pattern = target.value;
}

function updateRuleFlags(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const rule = ruleSet.value.rules[index] as RegexRule;
  rule.flags = target.value;
}

function updateRuleMin(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const rule = ruleSet.value.rules[index] as LengthRule;
  rule.min = parseInt(target.value) || undefined;
}

function updateRuleMax(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const rule = ruleSet.value.rules[index] as LengthRule;
  rule.max = parseInt(target.value) || undefined;
}

function testRules(): void {
  if (!props.testData) {
    testResult.value = {
      passed: false,
      passedRules: 0,
      totalRules: ruleSet.value.rules.length,
      details: [{ passed: false, message: "No test data provided" }],
    };
    return;
  }

  const result = RuleEngine.validateRuleSet(ruleSet.value, props.testData);
  const details: Array<{ passed: boolean; message: string }> = [];

  ruleSet.value.rules.forEach((rule: Rule, index: number) => {
    const ruleResult = RuleEngine.validateRule(rule, props.testData);
    const ruleTypeLabel =
      RULE_TYPE_OPTIONS.find((opt) => opt.value === rule.type)?.label ||
      rule.type;

    details.push({
      passed: ruleResult.pass,
      message: `Rule ${index + 1} (${ruleTypeLabel}): ${ruleResult.pass ? "Passed" : "Failed"}`,
    });
  });

  const passedCount = details.filter((d) => d.passed).length;

  testResult.value = {
    passed: result.pass,
    passedRules: passedCount,
    totalRules: ruleSet.value.rules.length,
    details,
  };
}
</script>

<style scoped>
.rules-editor-compact {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rules-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
}

.aggregation-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.aggregation-control label {
  font-weight: 500;
  color: #374151;
}

.aggregation-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
}

.rule-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.rule-type-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  min-width: 100px;
}

.rule-config {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-input {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.regex-config,
.length-config {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.flags-input,
.length-input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  width: 60px;
}

.remove-button {
  min-width: 2rem;
  font-size: 1.125rem;
  color: #9ca3af;
}

.remove-button:hover {
  color: #ef4444;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.result-pass {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.result-fail {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.result-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.result-details {
  font-size: 0.875rem;
  opacity: 0.75;
}

.result-details-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: 1rem;
}

.result-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-pass {
  color: #15803d;
}

.detail-fail {
  color: #dc2626;
}

.detail-icon {
  font-size: 0.75rem;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RulesEditorCompact",
});
</script>
