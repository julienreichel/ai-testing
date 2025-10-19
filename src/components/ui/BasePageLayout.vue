<template>
  <div class="page-layout">
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
      <base-button v-if="onRetry" @click="onRetry">
        {{ $t("common.retry") }}
      </base-button>
    </div>

    <!-- Not found state -->
    <div v-else-if="notFound" class="not-found-container">
      <base-notice variant="warning">
        {{ notFoundMessage || $t("common.notFound") }}
      </base-notice>
      <base-button v-if="onBack" @click="onBack">
        {{ $t("common.back") }}
      </base-button>
    </div>

    <!-- Main content -->
    <div v-else class="page-content">
      <!-- Page Header -->
      <base-page-header
        v-if="title"
        :title="title"
        :description="description"
        :breadcrumb-items="breadcrumbItems"
      >
        <template v-if="$slots.headerActions" #actions>
          <slot name="headerActions" />
        </template>
      </base-page-header>

      <!-- Main content area -->
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue';
import BaseNotice from './BaseNotice.vue';
import BaseButton from './BaseButton.vue';
import BasePageHeader from './BasePageHeader.vue';

interface BreadcrumbItem {
  label: string;
  to?: string;
  action?: () => void;
}

interface PageLayoutProps {
  title?: string;
  description?: string;
  breadcrumbItems?: BreadcrumbItem[];
  isLoading?: boolean;
  error?: string | null;
  notFound?: boolean;
  notFoundMessage?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

defineProps<PageLayoutProps>();
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Loading and error states */
.loading-container,
.error-container,
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  min-height: 50vh;
  justify-content: center;
}

.loading-container p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* Page content */
.page-content {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.main-content {
  padding: 1rem;
  background: white;
  color: #111827;
  text-align: left;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    padding: 0 1.5rem 1.5rem;
  }

  .loading-container,
  .error-container,
  .not-found-container {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0 1rem 1rem;
  }

  .loading-container,
  .error-container,
  .not-found-container {
    padding: 1.5rem 1rem;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BasePageLayout",
});
</script>
