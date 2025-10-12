import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import DashboardView from "../../../src/features/dashboard/DashboardView.vue";
import { createTestI18n } from "../../utils/i18n";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/dashboard", component: DashboardView }],
});

const i18n = createTestI18n();

describe("DashboardView", () => {
  it("should render dashboard title", () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [router, createPinia(), i18n],
      },
    });

    expect(wrapper.text()).toContain("Dashboard");
  });

  it("should display stats cards", () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [router, createPinia(), i18n],
      },
    });

    expect(wrapper.text()).toContain("Active Providers");
    expect(wrapper.text()).toContain("Total Tests");
    expect(wrapper.text()).toContain("Recent Runs");
  });
});
