<!--
  Test Export/Import Utility Component
  Provides easy access to project export/import functionality
-->
<template>
  <div class="test-export-import">
    <div class="action-buttons">
      <base-button
        variant="outline"
        :disabled="!canExport || isLoading"
        @click="showExportDialog = true"
      >
        {{ $t("testManagement.export") }}
      </base-button>

      <base-button
        variant="outline"
        :disabled="isLoading"
        @click="showImportDialog = true"
      >
        {{ $t("testManagement.import") }}
      </base-button>
    </div>

    <!-- Export Dialog -->
    <base-dialog
      v-model="showExportDialog"
      :title="$t('testManagement.exportProject')"
    >
      <div class="export-dialog">
        <div class="project-selection">
          <label>{{ $t("testManagement.selectProject") }}:</label>
          <select v-model="selectedProjectId" class="project-select">
            <option value="">{{ $t("testManagement.chooseProject") }}</option>
            <option
              v-for="project in projectTree"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>

        <div class="export-options">
          <label class="checkbox-label">
            <input v-model="includeRuns" type="checkbox" />
            {{ $t("testManagement.includeTestRuns") }}
          </label>
        </div>

        <div class="dialog-actions">
          <base-button
            variant="primary"
            :disabled="!selectedProjectId || isExporting"
            :loading="isExporting"
            @click="exportProject"
          >
            {{ $t("common.export") }}
          </base-button>
          <base-button variant="outline" @click="showExportDialog = false">
            {{ $t("common.cancel") }}
          </base-button>
        </div>
      </div>
    </base-dialog>

    <!-- Import Dialog -->
    <base-dialog
      v-model="showImportDialog"
      :title="$t('testManagement.importProject')"
    >
      <div class="import-dialog">
        <div class="file-input-section">
          <label>{{ $t("testManagement.selectFile") }}:</label>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="file-input"
            @change="handleFileSelect"
          />
        </div>

        <div v-if="importPreview" class="import-preview">
          <h4>{{ $t("testManagement.importPreview") }}</h4>
          <div class="preview-details">
            <p>
              <strong>{{ $t("testManagement.projectName") }}:</strong>
              {{ importPreview.project.name }}
            </p>
            <p>
              <strong>{{ $t("testManagement.description") }}:</strong>
              {{ importPreview.project.description || "N/A" }}
            </p>
            <p>
              <strong>{{ $t("testManagement.testCases") }}:</strong>
              {{ importPreview.testCases?.length || 0 }}
            </p>
            <p>
              <strong>{{ $t("testManagement.testRuns") }}:</strong>
              {{ importPreview.runs?.length || 0 }}
            </p>
          </div>
        </div>

        <div class="dialog-actions">
          <base-button
            variant="primary"
            :disabled="!importData || isImporting"
            :loading="isImporting"
            @click="importProject"
          >
            {{ $t("common.import") }}
          </base-button>
          <base-button variant="outline" @click="closeImportDialog">
            {{ $t("common.cancel") }}
          </base-button>
        </div>
      </div>
    </base-dialog>

    <!-- Status Messages -->
    <base-toast
      v-model="showStatusMessage"
      :type="statusType"
      :message="statusMessage"
      @close="clearStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useTestManagement } from "../composables/useTestManagement";
import { BaseButton, BaseDialog } from "./ui";
import BaseToast from "./ui/BaseToast.vue";
import type { ExportProject } from "../types/testManagement";

// Test Management composable
const testManager = useTestManagement();

// Dialog states
const showExportDialog = ref(false);
const showImportDialog = ref(false);

// Export state
const selectedProjectId = ref("");
const includeRuns = ref(false);
const isExporting = ref(false);

// Import state
const fileInput = ref<HTMLInputElement>();
const importData = ref<string>("");
const importPreview = ref<ExportProject | null>(null);
const isImporting = ref(false);

// Status state
const statusMessage = ref("");
const statusType = ref<"success" | "error" | "info">("info");

// Computed properties
const { projectTree, isLoading } = testManager;
const canExport = computed(() => projectTree.value.length > 0);
const showStatusMessage = computed(() => statusMessage.value !== "");

// Methods
const exportProject = async (): Promise<void> => {
  if (!selectedProjectId.value) return;

  try {
    isExporting.value = true;
    const exportData = await testManager.exportProject(
      selectedProjectId.value,
      includeRuns.value,
    );

    // Create download
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const project = projectTree.value.find(
      (p) => p.id === selectedProjectId.value,
    );
    const fileName = `${project?.name || "project"}-export.json`;

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStatus("Export completed successfully!", "success");
    showExportDialog.value = false;
    selectedProjectId.value = "";
  } catch (error) {
    console.error("Export failed:", error);
    showStatus("Export failed. Please try again.", "error");
  } finally {
    isExporting.value = false;
  }
};

const handleFileSelect = (event: Event): void => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e): void => {
    try {
      const jsonData = e.target?.result as string;
      importData.value = jsonData;
      importPreview.value = JSON.parse(jsonData) as ExportProject;
    } catch (error) {
      console.error("Failed to parse file:", error);
      showStatus(
        "Invalid JSON file. Please select a valid export file.",
        "error",
      );
      importData.value = "";
      importPreview.value = null;
    }
  };
  reader.readAsText(file);
};

const importProject = async (): Promise<void> => {
  if (!importData.value) return;

  try {
    isImporting.value = true;
    const result = await testManager.importProject(importData.value);

    const importedCount =
      result.imported.projects +
      result.imported.testCases +
      result.imported.runs;
    showStatus(`Import completed! Imported ${importedCount} items.`, "success");
    closeImportDialog();
  } catch (error) {
    console.error("Import failed:", error);
    showStatus("Import failed. Please check the file and try again.", "error");
  } finally {
    isImporting.value = false;
  }
};

const closeImportDialog = (): void => {
  showImportDialog.value = false;
  importData.value = "";
  importPreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const showStatus = (
  message: string,
  type: "success" | "error" | "info",
): void => {
  statusMessage.value = message;
  statusType.value = type;
};

const clearStatus = (): void => {
  statusMessage.value = "";
};
</script>

<style scoped>
.test-export-import {
  position: relative;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.export-dialog,
.import-dialog {
  min-width: 400px;
}

.project-selection {
  margin-bottom: 1rem;
}

.project-selection label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.project-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.export-options {
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.file-input-section {
  margin-bottom: 1rem;
}

.file-input-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.import-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.import-preview h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.preview-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
