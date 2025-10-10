import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import ProvidersView from "../../../src/features/providers/ProvidersView.vue";
import { useProvidersStore } from "../../../src/store/providers";
import type { ProviderKeyStatus } from "../../../src/store/providers";
import i18n from "../../../src/locales";

// Mock the providers store
vi.mock("../../../src/store/providers", () => ({
  useProvidersStore: vi.fn(),
}));

const mockProvidersStore = {
  providerStatuses: [],
  supportedProviderTypes: ["openai", "claude", "mock"],
  isLoading: false,
  error: null,
  testingProvider: null,
  addKey: vi.fn(),
  removeKey: vi.fn(),
  testKey: vi.fn(),
  initialize: vi.fn(),
  clearError: vi.fn(),
  hasShownEncryptionNotice: vi.fn(() => false),
  markEncryptionNoticeShown: vi.fn(),
};

const mockProviders: ProviderKeyStatus[] = [
  {
    id: "openai-1",
    name: "OpenAI GPT-4",
    type: "openai",
    hasKey: true,
    isValid: true,
    isActive: true,
    lastTested: new Date(),
  },
  {
    id: "claude-1",
    name: "Claude 3.5",
    type: "claude",
    hasKey: false,
    isValid: null,
    isActive: true,
    lastTested: null,
  },
];

function createWrapper(storeOverrides = {}): ReturnType<typeof mount> {
  const pinia = createPinia();

  const mockStore = {
    ...mockProvidersStore,
    ...storeOverrides,
  };

  (useProvidersStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
    mockStore,
  );

  return mount(ProvidersView, {
    global: {
      plugins: [pinia, i18n],
    },
  });
}

describe("ProvidersView - Behavior-Driven Testing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProvidersStore.providerStatuses = [];
    mockProvidersStore.isLoading = false;
    mockProvidersStore.error = null;
    mockProvidersStore.testingProvider = null;
  });

  describe("Basic Component Rendering", () => {
    it("should render the main title", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("AI Providers");
    });

    it("should render add provider button", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("Add Provider");
    });

    it("should initialize providers store on mount", () => {
      createWrapper();
      expect(mockProvidersStore.initialize).toHaveBeenCalled();
    });
  });

  describe("Security Notice Behavior", () => {
    it("should show security notice when not acknowledged", () => {
      const wrapper = createWrapper({ hasShownEncryptionNotice: () => false });

      expect(wrapper.text()).toContain("Security Notice");
      expect(wrapper.text()).toContain(
        "Keys never leave your browser or device",
      );
      expect(wrapper.text()).toContain("I Understand");
    });

    it("should hide security notice when already acknowledged", () => {
      const wrapper = createWrapper({ hasShownEncryptionNotice: () => true });

      expect(wrapper.text()).not.toContain("Security Notice");
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no providers configured", () => {
      const wrapper = createWrapper({ providerStatuses: [] });

      expect(wrapper.text()).toContain("No providers configured");
      expect(wrapper.text()).toContain("Add one to get started");
    });

    it("should hide empty state when providers exist", () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders });

      expect(wrapper.text()).not.toContain("No providers configured");
    });
  });

  describe("Provider Display", () => {
    it("should display provider information when providers exist", () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders });

      expect(wrapper.text()).toContain("OpenAI GPT-4");
      expect(wrapper.text()).toContain("Claude 3.5");
    });
  });

  describe("Error Handling", () => {
    it("should handle error state gracefully", () => {
      const wrapper = createWrapper({
        error: "Failed to load providers",
        isLoading: false,
      });

      // Component should still render successfully even with errors
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain("AI Providers");
    });

    it("should display loading state", () => {
      const wrapper = createWrapper({ isLoading: true });

      // Component should render without crashing during loading
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Component Integration", () => {
    it("should render without crashing with all dependencies", () => {
      const wrapper = createWrapper({
        providerStatuses: mockProviders,
        hasShownEncryptionNotice: () => false,
        isLoading: false,
        error: null,
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain("AI Providers");
    });

    it("should handle various provider states", () => {
      const complexProviders: ProviderKeyStatus[] = [
        ...mockProviders,
        {
          id: "error-provider",
          name: "Error Provider",
          type: "mock",
          hasKey: true,
          isValid: false,
          isActive: true,
          lastTested: new Date(),
        },
      ];

      const wrapper = createWrapper({ providerStatuses: complexProviders });

      expect(wrapper.text()).toContain("Error Provider");
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Behavior-Driven Accessibility", () => {
    it("should provide accessible content structure", () => {
      const wrapper = createWrapper({ providerStatuses: mockProviders });

      // Component should have meaningful content that screen readers can interpret
      expect(wrapper.text()).toContain("AI Providers");
      expect(wrapper.text()).toContain("Add Provider");
    });

    it("should handle keyboard navigation gracefully", () => {
      const wrapper = createWrapper();

      // Component should render interactive elements
      const buttons = wrapper.findAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
