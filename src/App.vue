<template>
  <div id="app">
    <app-nav />
    <div class="app-body">
      <!-- Test Management Sidebar -->
      <aside class="test-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <!-- TODO: Enable sidebar when component is ready -->
        <div v-if="!sidebarCollapsed" class="sidebar-placeholder">
          <h3>{{ $t('testManagement.title') }}</h3>
          <p>Test Management Sidebar coming soon...</p>
        </div>
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :title="sidebarCollapsed ? $t('testManagement.showSidebar') : $t('testManagement.hideSidebar')"
        >
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppNav from "./components/AppNav.vue";

// Sidebar state
const sidebarCollapsed = ref(false);

// Methods
const toggleSidebar = (): void => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.test-sidebar {
  width: 300px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  position: relative;
  transition: width 0.3s ease;
}

.test-sidebar.collapsed {
  width: 40px;
}

.sidebar-placeholder {
  padding: 1rem;
}

.sidebar-placeholder h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.sidebar-placeholder p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  right: -15px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.sidebar-toggle:hover {
  background: #f8f9fa;
}

.main-content {
  flex: 1;
  background: #13375b;
  overflow: auto;
}

body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
