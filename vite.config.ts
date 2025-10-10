/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === "production" ? "/ai-testing/" : "/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/components": resolve(__dirname, "src/components"),
      "@/features": resolve(__dirname, "src/features"),
      "@/store": resolve(__dirname, "src/store"),
      "@/router": resolve(__dirname, "src/router"),
      "@/utils": resolve(__dirname, "src/utils"),
      "@/types": resolve(__dirname, "src/types"),
      "@/composables": resolve(__dirname, "src/composables"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
