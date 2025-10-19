<template>
  <div class="test-details-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <base-spinner />
      <p>{{ $t("common.loading") }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <base-notice variant="error">
        {{ error }}
      </base-notice>
      <base-button @click="loadTestCase">
        {{ $t("common.retry") }}
      </base-button>
    </div>

    <!-- Test Case not found -->
    <div v-else-if="!testCase" class="not-found-container">
      <base-notice variant="warning">
        {{ $t("tests.testCaseNotFound") }}
      </base-notice>
      <base-button @click="goBackToList">
        {{ $t("common.back") }}
      </base-button>
    </div>

    <!-- Test Case Detail View -->
    <test-case-detail-view
      v-else
      :test-case="testCase"
      @back="goBackToList"
      @quick-run="handleQuickRun"
      @open-in-editor="openTestCaseInEditor"
      @delete="confirmDeleteTestCase"
    />

    <!-- Delete Test Case Dialog -->
    <delete-test-case-dialog
      ref="deleteTestCaseDialogRef"
      v-model="showDeleteTestCaseDialog"
      :test-case="testCaseToDelete"
      @delete="handleDeleteTestCase"
    />

    <!-- Quick Run Dialog -->
    <quick-run-dialog
      :is-open="showRunQuick"
      :test-case="testCaseForQuickRun"
      @close="showRunQuick = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTestManagement } from "@/composables/useTestManagement";
import { testDB } from "@/services/testManagementDatabase";
import { BaseButton, BaseSpinner, BaseNotice } from "@/components/ui";
import {
  TestCaseDetailView,
  DeleteTestCaseDialog,
  QuickRunDialog,
} from "./components";
import type { TestCase } from "@/types/testManagement";

// Composables
const router = useRouter();
const route = useRoute();
const testManager = useTestManagement();

// State
const testCase = ref<TestCase | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showDeleteTestCaseDialog = ref(false);
const showRunQuick = ref(false);
const testCaseForQuickRun = ref<TestCase | null>(null);
const testCaseToDelete = ref<TestCase | null>(null);

// Component refs
const deleteTestCaseDialogRef =
  ref<InstanceType<typeof DeleteTestCaseDialog>>();

// Computed
const testId = computed(() => route.params.testId as string);

// Navigation functions
const goBackToList = (): void => {
  void router.push("/tests");
};

const openTestCaseInEditor = (targetTestCase?: TestCase): void => {
  const caseToOpen = targetTestCase || testCase.value;
  if (!caseToOpen) return;

  // Navigate to editor with test case ID for prefilling
  void router.push({
    path: "/editor",
    query: {
      testCaseId: caseToOpen.id,
    },
  });
};

const handleQuickRun = (targetTestCase: TestCase): void => {
  testCaseForQuickRun.value = targetTestCase;
  showRunQuick.value = true;
};

// Delete operations
const confirmDeleteTestCase = (targetTestCase?: TestCase): void => {
  const caseToDelete = targetTestCase || testCase.value;
  if (caseToDelete) {
    testCaseToDelete.value = caseToDelete;
    showDeleteTestCaseDialog.value = true;
  }
};

const handleDeleteTestCase = async (
  deletedTestCase: TestCase,
): Promise<void> => {
  try {
    deleteTestCaseDialogRef.value?.setLoading(true);
    await testManager.deleteTestCase(deletedTestCase.id);

    deleteTestCaseDialogRef.value?.closeDialog();
    testCaseToDelete.value = null;

    // Navigate back to list after successful deletion
    goBackToList();
  } catch (deleteError) {
    console.error("Failed to delete test case:", deleteError);
  } finally {
    deleteTestCaseDialogRef.value?.setLoading(false);
  }
};

// Data loading
const loadTestCase = async (): Promise<void> => {
  if (!testId.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // Initialize test manager if needed
    await testManager.initialize();

    // Load the specific test case
    const loadedTestCase = await testDB.getTestCase(testId.value);
    if (loadedTestCase) {
      testCase.value = loadedTestCase;
    } else {
      testCase.value = null;
      error.value = "Test case not found";
    }
  } catch (err) {
    console.error("Failed to load test case:", err);
    error.value =
      err instanceof Error ? err.message : "Failed to load test case";
    testCase.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Watch for route changes
watch(
  () => route.params.testId,
  () => {
    if (route.params.testId) {
      loadTestCase();
    }
  },
  { immediate: true },
);

// Initialize on mount
onMounted(async () => {
  await loadTestCase();
});
</script>

<style scoped>
/* Main layout */
.test-details-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
}

.loading-container p {
  color: #6b7280;
  font-size: 1rem;
}

/* Error and not found states */
.error-container,
.not-found-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}
</style>
