<!--
  Test Management Sidebar Navigation
  Displays project hierarchy with test cases and run counts
-->
<template>
  <div class="test-management-sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <h3>{{ $t('testManagement.title') }}</h3>
      <button
        class="btn-create-project"
        @click="showCreateProject = true"
        :disabled="isLoading"
      >
        {{ $t('testManagement.createProject') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      {{ $t('common.loading') }}
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="clearError" class="btn-clear-error">
        {{ $t('common.dismiss') }}
      </button>
    </div>

    <!-- Project Tree -->
    <div v-if="!isLoading && !error" class="project-tree">
      <div
        v-for="project in projectTree"
        :key="project.id"
        class="project-node"
        :class="{ active: currentProject?.id === project.id }"
      >
        <!-- Project Header -->
        <div
          class="project-header"
          @click="selectProject(project.id)"
        >
          <span class="project-name">{{ project.name }}</span>
          <span class="project-stats">
            ({{ project.children?.length || 0 }} {{ $t('testManagement.testCases') }})
          </span>
        </div>

        <!-- Test Cases (when project is selected) -->
        <div
          v-if="currentProject?.id === project.id && project.children?.length"
          class="test-cases"
        >
          <div
            v-for="testCase in project.children"
            :key="testCase.id"
            class="test-case-node"
            :class="{ active: currentTestCase?.id === testCase.id }"
            @click="selectTestCase(testCase.id)"
          >
            <span class="test-case-name">{{ testCase.name }}</span>
            <span class="test-case-stats">
              ({{ testCase.metadata?.runCount || 0 }} {{ $t('testManagement.runs') }})
            </span>
          </div>
        </div>

        <!-- Add Test Case Button -->
        <div
          v-if="currentProject?.id === project.id"
          class="add-test-case"
        >
          <button
            class="btn-add-test-case"
            @click="showCreateTestCase = true"
          >
            + {{ $t('testManagement.addTestCase') }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="projectTree.length === 0" class="empty-state">
        <p>{{ $t('testManagement.noProjects') }}</p>
        <p>{{ $t('testManagement.createFirstProject') }}</p>
      </div>
    </div>

    <!-- Import/Export Actions -->
    <div class="sidebar-actions">
      <button
        class="btn-import"
        @click="showImportDialog = true"
        :disabled="isLoading"
      >
        {{ $t('testManagement.import') }}
      </button>
      <button
        v-if="currentProject"
        class="btn-export"
        @click="exportCurrentProject"
        :disabled="isLoading"
      >
        {{ $t('testManagement.export') }}
      </button>
    </div>
  </div>

  <!-- Create Project Modal (placeholder) -->
  <div v-if="showCreateProject" class="modal-overlay" @click="showCreateProject = false">
    <div class="modal-content" @click.stop>
      <h4>{{ $t('testManagement.createProject') }}</h4>
      <!-- Project creation form would go here -->
      <button @click="showCreateProject = false">{{ $t('common.close') }}</button>
    </div>
  </div>

  <!-- Create Test Case Modal (placeholder) -->
  <div v-if="showCreateTestCase" class="modal-overlay" @click="showCreateTestCase = false">
    <div class="modal-content" @click.stop>
      <h4>{{ $t('testManagement.createTestCase') }}</h4>
      <!-- Test case creation form would go here -->
      <button @click="showCreateTestCase = false">{{ $t('common.close') }}</button>
    </div>
  </div>

  <!-- Import Dialog (placeholder) -->
  <div v-if="showImportDialog" class="modal-overlay" @click="showImportDialog = false">
    <div class="modal-content" @click.stop>
      <h4>{{ $t('testManagement.importProject') }}</h4>
      <!-- Import form would go here -->
      <button @click="showImportDialog = false">{{ $t('common.close') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTestManagement } from '../useTestManagement';

// Test Management composable
const testManager = useTestManagement();

// Local modal states
const showCreateProject = ref(false);
const showCreateTestCase = ref(false);
const showImportDialog = ref(false);

// Destructure composable state and methods
const {
  currentProject,
  currentTestCase,
  projectTree,
  isLoading,
  error,
  clearError,
  selectProject,
  selectTestCase,
} = testManager;

// Export current project
const exportCurrentProject = async (): Promise<void> => {
  if (!currentProject.value) return;

  try {
    const exportData = await testManager.exportProject(currentProject.value.id, true);

    // Create download link
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.value.name}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export project:', err);
  }
};
</script>

<style scoped>
.test-management-sidebar {
  width: 300px;
  min-height: 100vh;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.btn-create-project {
  width: 100%;
  padding: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-create-project:hover:not(:disabled) {
  background: #0056b3;
}

.btn-create-project:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state, .error-state {
  padding: 1rem;
  text-align: center;
}

.error-state {
  color: #dc3545;
}

.btn-clear-error {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.project-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.project-node.active {
  background: #e3f2fd;
}

.project-header {
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-header:hover {
  background: #f0f0f0;
}

.project-name {
  font-weight: 500;
  color: #333;
}

.project-stats, .test-case-stats {
  font-size: 0.8rem;
  color: #666;
}

.test-cases {
  margin-left: 1rem;
  border-left: 2px solid #e0e0e0;
  padding-left: 0.5rem;
}

.test-case-node {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-case-node:hover {
  background: #f0f0f0;
}

.test-case-node.active {
  background: #fff3cd;
}

.test-case-name {
  font-size: 0.9rem;
  color: #444;
}

.add-test-case {
  margin-left: 1rem;
  margin-top: 0.5rem;
}

.btn-add-test-case {
  width: 100%;
  padding: 0.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-add-test-case:hover {
  background: #1e7e34;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.sidebar-actions {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.5rem;
}

.btn-import, .btn-export {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  background: white;
}

.btn-import:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-export {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-export:hover:not(:disabled) {
  background: #545b62;
}

.btn-import:disabled, .btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h4 {
  margin: 0 0 1rem 0;
  color: #333;
}
</style>
