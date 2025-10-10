<template>
  <nav class="app-nav">
    <div class="nav-brand">
      <h2>AI Testing Platform</h2>
    </div>
    <ul class="nav-links">
      <li v-for="item in navigationItems" :key="item.path">
        <router-link
          :to="item.path"
          class="nav-link"
          active-class="active"
        >
          {{ item.name }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { NavigationItem } from '../types'

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Providers', path: '/providers' },
  { name: 'Editor', path: '/editor' },
  { name: 'Tests', path: '/tests' },
  { name: 'Runs', path: '/runs' },
]
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppNav',
});
</script>

<style scoped>
.app-nav {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h2 {
  margin: 0;
  padding-right: 64px;
  color: white;
}

.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
}

.nav-link {
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background: #34495e;
}

.nav-link.active {
  background: #3498db;
  color: white;
}
</style>
