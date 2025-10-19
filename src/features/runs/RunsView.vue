<template>
  <base-page-layout
    :title="$t('runs.title')"
    :description="$t('runs.description')"
  >
    <!-- Batch Runs Content -->
    <batch-run-history
      :limit="50"
      @batch-run-selected="onBatchRunSelected"
    />
  </base-page-layout>
</template>

<script setup lang="ts">
import type { BatchRunSession } from "@/services/testManagementDatabase";
import { BasePageLayout } from "@/components/ui";
import BatchRunHistory from "./components/BatchRunHistory.vue";

// Methods
const onBatchRunSelected = (batchRun: BatchRunSession): void => {
  console.log("Selected batch run:", batchRun);
  // Could navigate to detailed view or emit to parent
};
</script>

<style scoped>
/* Any custom styles for RunsView content */
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RunsView",
});
</script>
