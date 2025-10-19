import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../features/dashboard/DashboardView.vue"),
    meta: {
      title: "Dashboard",
    },
  },
  {
    path: "/providers",
    name: "Providers",
    component: () => import("../features/providers/ProvidersView.vue"),
    meta: {
      title: "AI Providers",
    },
  },
  {
    path: "/editor",
    name: "Editor",
    component: () => import("../features/editor/EditorView.vue"),
    meta: {
      title: "Test Editor",
    },
  },
  {
    path: "/tests",
    name: "Tests",
    component: () => import("../features/tests/TestsListView.vue"),
    meta: {
      title: "Test Cases",
    },
  },
  {
    path: "/tests/:testId",
    name: "TestDetails",
    component: () => import("../features/tests/TestDetailsView.vue"),
    meta: {
      title: "Test Case Details",
    },
  },
  {
    path: "/tests/:testId/run",
    name: "QuickRun",
    component: () => import("../features/tests/QuickRunView.vue"),
    meta: {
      title: "Quick Run",
    },
  },
  {
    path: "/tests/project/:projectId/run",
    name: "ProjectQuickRun",
    component: () => import("../features/tests/ProjectQuickRunView.vue"),
    meta: {
      title: "Project Quick Run",
    },
  },
  {
    path: "/runs",
    name: "Runs",
    component: () => import("../features/runs/RunsView.vue"),
    meta: {
      title: "Test Runs",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("components/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard for setting page titles
router.beforeEach((to) => {
  if (to.meta?.title && typeof to.meta.title === "string") {
    document.title = `${to.meta.title} - AI Testing Platform`;
  }
});

export default router;
