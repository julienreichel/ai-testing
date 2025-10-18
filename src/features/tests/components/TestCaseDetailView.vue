<template>
  <div class="test-case-detail">
    <div class="detail-header">
      <div class="breadcrumb">
        <base-button
          variant="outline"
          @click="handleBack"
          class="breadcrumb-link"
        >
          ← {{ $t("common.backToTests") }}
        </base-button>
      </div>
    </div>

    <base-card variant="outlined" padding="lg" class="test-case-detail-card">
      <template #header>
        <div class="detail-title">
          <h2>{{ testCase.name }}</h2>
          <div class="detail-actions">
            <base-button variant="outline" @click="handleOpenInEditor">
              {{ $t("testManagement.openInEditor") }}
            </base-button>
            <base-button variant="danger" @click="handleDelete">
              {{ $t("common.delete") }}
            </base-button>
          </div>
        </div>
        <p v-if="testCase.description">
          {{ testCase.description }}
        </p>
      </template>

      <div class="test-case-content">
        <base-card variant="default" padding="md" class="content-section">
          <template #header>
            <h3>{{ $t("testManagement.prompt") }}</h3>
          </template>
          <div class="prompt-display">{{ testCase.prompt }}</div>
        </base-card>

        <base-card
          v-if="testCase.rules?.length"
          variant="default"
          padding="md"
          class="content-section"
        >
          <template #header>
            <h3>{{ $t("testManagement.validationRules") }}</h3>
          </template>
          <div class="rules-display">
            <div
              v-for="(ruleSet, index) in testCase.rules"
              :key="index"
              class="rule-set"
            >
              <h4>{{ $t("testManagement.ruleSet", { number: index + 1 }) }}</h4>
              <div class="rules-list">
                <div
                  v-for="rule in ruleSet.rules"
                  :key="rule.id"
                  class="rule-item"
                >
                  <span class="rule-type">{{ rule.type }}</span>
                  <span class="rule-details">
                    {{ formatRuleDetails(rule) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </base-card>
      </div>
    </base-card>
  </div>
</template>

<script setup lang="ts">
import { BaseButton, BaseCard } from "../../../components/ui";
import type { Rule } from "../../../types/rules";
import type { TestCase } from "../../../types/testManagement";

interface Props {
  testCase: TestCase;
}

interface Emits {
  (e: "back"): void;
  (e: "openInEditor", testCase: TestCase): void;
  (e: "delete", testCase: TestCase): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Helper function for formatting rule details
const formatRuleDetails = (rule: Rule): string => {
  switch (rule.type) {
    case "equals":
    case "contains":
    case "startsWith":
    case "endsWith":
      return `${rule.type} "${rule.value}"`;
    case "regex":
      return `matches /${rule.pattern}/${rule.flags || ""}`;
    case "length": {
      const min = rule.min ? `≥ ${rule.min}` : "";
      const max = rule.max ? `≤ ${rule.max}` : "";
      return `length ${min} ${max}`.trim();
    }
    default:
      return JSON.stringify(rule);
  }
};

// Event handlers
const handleBack = (): void => {
  emit("back");
};

const handleOpenInEditor = (): void => {
  emit("openInEditor", props.testCase);
};

const handleDelete = (): void => {
  emit("delete", props.testCase);
};
</script>

<style scoped>
/* Test case detail view */
.test-case-detail {
  margin-bottom: 2rem;
}

.detail-header {
  margin-bottom: 1.5rem;
}

.breadcrumb-link {
  margin-bottom: 1rem;
}

.detail-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.detail-title h2 {
  margin: 0;
  color: #111827;
  font-size: 1.75rem;
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.test-case-content {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 1.5rem;
}

/* Test case detail content */
.content-section {
  margin-bottom: 1.5rem;
}

.content-section h3 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.prompt-display {
  width: 100%;
  text-align: left;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.875rem;
  color: #374151;
  white-space: pre-wrap;
  line-height: 1.5;
}

.rules-display {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rule-set {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
}

.rule-set h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.875rem;
}

.rule-type {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.rule-details {
  color: #374151;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}
</style>