<template>
  <!-- Redirect component - this maintains backward compatibility -->
  <div></div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Redirect to the new list view on mount
onMounted(() => {
  void router.replace("/tests");
});
</script>
