<template>
  <base-page-layout
    :title="testCase?.name || $t('tests.testDetails')"
    :description="testCase?.description"
    :breadcrumb-items="breadcrumbItems"
    :is-loading="isLoading"
    :error="error"
    :not-found="!testCase && !isLoading && !error"
    :not-found-message="$t('tests.testCaseNotFound')"
    :on-retry="loadTestCase"
    :on-back="goBackToList"
  >
    <template #headerActions>
      <base-button
          variant="outline"
          @click="goBackToList"
          class="breadcrumb-link"
        >
          {{ $t("common.backToTests") }}
      </base-button>
      <base-button variant="primary" @click="handleQuickRunAction" v-if="testCase">
        {{ $t("testManagement.quickRun") }}
      </base-button>
      <base-button variant="outline" @click="openTestCaseInEditorAction" v-if="testCase">
        {{ $t("testManagement.openInEditor") }}
      </base-button>
      <base-button variant="danger" @click="confirmDeleteTestCaseAction" v-if="testCase">
        {{ $t("common.delete") }}
      </base-button>

    </template>

    <!-- Test Case Detail Content -->
    <test-case-details
      v-if="testCase"
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
  </base-page-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useTestManagement } from "@/composables/useTestManagement";
import { testDB } from "@/services/testManagementDatabase";
import { BaseButton, BasePageLayout } from "@/components/ui";
import {
  TestCaseDetails,
  DeleteTestCaseDialog,
} from "./components";
import type { TestCase } from "@/types/testManagement";

// Composables
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const testManager = useTestManagement();

// State
const testCase = ref<TestCase | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showDeleteTestCaseDialog = ref(false);
const testCaseToDelete = ref<TestCase | null>(null);

// Component refs
const deleteTestCaseDialogRef =
  ref<InstanceType<typeof DeleteTestCaseDialog>>();

// Computed
const testId = computed(() => route.params.testId as string);

const breadcrumbItems = computed(() => [
  {
    label: t("tests.title"),
    action: goBackToList,
  },
  {
    label: testCase.value?.name || t("tests.testDetails"),
  },
]);

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
  // Navigate to the Quick Run page
  void router.push(`/tests/${targetTestCase.id}/run`);
};

// Wrapper functions for header actions
const handleQuickRunAction = (): void => {
  if (testCase.value) {
    handleQuickRun(testCase.value);
  }
};

const openTestCaseInEditorAction = (): void => {
  if (testCase.value) {
    openTestCaseInEditor(testCase.value);
  }
};

const confirmDeleteTestCaseAction = (): void => {
  if (testCase.value) {
    confirmDeleteTestCase(testCase.value);
  }
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
  async () => {
    if (route.params.testId) {
      await loadTestCase();
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
/* Any custom styles for TestDetailsView content */
</style>
