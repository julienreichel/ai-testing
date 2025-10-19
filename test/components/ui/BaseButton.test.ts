import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseButton from "components/ui/BaseButton.vue";
import i18n from "@locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseButton, {
    global: {
      plugins: [i18n],
    },
    ...options,
  });
};

describe("BaseButton - User Behavior", () => {
  describe("Basic Functionality", () => {
    it("should display button text to users", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Click Me",
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.isVisible()).toBe(true);
      expect(wrapper.text()).toBe("Click Me");
    });

    it("should respond to user clicks", async () => {
      const wrapper = createWrapper({
        slots: {
          default: "Submit",
        },
      });

      await wrapper.trigger("click");

      expect(wrapper.emitted("click")).toBeTruthy();
    });
  });

  describe("Visual Variants", () => {
    it("should show primary button styling to users", () => {
      const wrapper = createWrapper({
        props: { variant: "primary" },
        slots: { default: "Primary" },
      });

      expect(wrapper.classes()).toContain("btn-primary");
      expect(wrapper.html()).toMatch(/btn.*primary/);
    });

    it("should show danger button styling for destructive actions", () => {
      const wrapper = createWrapper({
        props: { variant: "danger" },
        slots: { default: "Delete" },
      });

      expect(wrapper.classes()).toContain("btn-danger");
      expect(wrapper.html()).toMatch(/btn.*danger/);
    });

    it("should show outline variant styling", () => {
      const wrapper = createWrapper({
        props: { variant: "outline" },
        slots: { default: "Cancel" },
      });

      expect(wrapper.classes()).toContain("btn-outline");
    });

    it("should show success variant styling", () => {
      const wrapper = createWrapper({
        props: { variant: "success" },
        slots: { default: "Save" },
      });

      expect(wrapper.classes()).toContain("btn-success");
    });
  });

  describe("Size Variations", () => {
    it("should display small buttons for compact interfaces", () => {
      const wrapper = createWrapper({
        props: { size: "sm" },
        slots: { default: "Small" },
      });

      expect(wrapper.classes()).toContain("btn-sm");
    });

    it("should display large buttons for prominent actions", () => {
      const wrapper = createWrapper({
        props: { size: "lg" },
        slots: { default: "Large Action" },
      });

      expect(wrapper.classes()).toContain("btn-lg");
    });
  });

  describe("Loading State Behavior", () => {
    it("should show loading state to users during async operations", () => {
      const wrapper = createWrapper({
        props: {
          loading: true,
          loadingText: "Saving...",
        },
        slots: { default: "Save" },
      });

      // User sees loading text instead of original content
      expect(wrapper.text()).toContain("Saving...");
      expect(wrapper.classes()).toContain("btn-loading");
    });

    it("should prevent user clicks during loading state", async () => {
      const wrapper = createWrapper({
        props: { loading: true },
        slots: { default: "Submit" },
      });

      await wrapper.trigger("click");

      // No click event should be emitted when loading
      expect(wrapper.emitted("click")).toBeFalsy();
      expect(wrapper.attributes("disabled")).toBeDefined();
    });

    it("should show spinner during loading for visual feedback", () => {
      const wrapper = createWrapper({
        props: { loading: true },
        slots: { default: "Processing" },
      });

      // Should contain spinner component or visual indicator
      expect(wrapper.html()).toMatch(/base-spinner|spinner/i);
    });
  });

  describe("Disabled State Behavior", () => {
    it("should prevent user interaction when disabled", async () => {
      const wrapper = createWrapper({
        props: { disabled: true },
        slots: { default: "Disabled" },
      });

      await wrapper.trigger("click");

      expect(wrapper.emitted("click")).toBeFalsy();
      expect(wrapper.attributes("disabled")).toBeDefined();
    });

    it("should show disabled appearance to users", () => {
      const wrapper = createWrapper({
        props: { disabled: true },
        slots: { default: "Cannot Click" },
      });

      expect(wrapper.attributes("disabled")).toBeDefined();
      expect(wrapper.text()).toBe("Cannot Click");
    });
  });

  describe("Button Types", () => {
    it("should support submit type for forms", () => {
      const wrapper = createWrapper({
        props: { type: "submit" },
        slots: { default: "Submit Form" },
      });

      expect(wrapper.attributes("type")).toBe("submit");
    });

    it("should support reset type for forms", () => {
      const wrapper = createWrapper({
        props: { type: "reset" },
        slots: { default: "Reset Form" },
      });

      expect(wrapper.attributes("type")).toBe("reset");
    });
  });

  describe("Accessibility Features", () => {
    it("should be keyboard accessible", () => {
      const wrapper = createWrapper({
        slots: { default: "Accessible Button" },
      });

      // Button should be focusable and have proper role
      const button = wrapper.find("button");
      expect(button.exists()).toBe(true);
    });

    it("should provide clear button text for screen readers", () => {
      const wrapper = createWrapper({
        slots: { default: "Clear Action Description" },
      });

      expect(wrapper.text()).toBe("Clear Action Description");
    });
  });

  describe("User Experience Scenarios", () => {
    it("should handle rapid clicking gracefully", async () => {
      const wrapper = createWrapper({
        slots: { default: "Click Me" },
      });

      // Simulate rapid clicks
      await wrapper.trigger("click");
      await wrapper.trigger("click");
      await wrapper.trigger("click");

      // Should emit multiple click events
      expect(wrapper.emitted("click")).toHaveLength(3);
    });

    it("should work with complex slot content", () => {
      const wrapper = createWrapper({
        slots: {
          default: "<span>Save <strong>Now</strong></span>",
        },
      });

      expect(wrapper.html()).toContain("Save");
      expect(wrapper.html()).toContain("Now");
    });
  });
});
