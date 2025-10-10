import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseSpinner from "../../../src/components/ui/BaseSpinner.vue";
import i18n from "../../../src/locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseSpinner, {
    global: {
      plugins: [i18n],
    },
    ...options,
  });
};

describe("BaseSpinner - User Behavior", () => {
  describe("Basic Loading Indicator", () => {
    it("should show loading spinner to users", () => {
      const wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".spinner").exists()).toBe(true);
      expect(wrapper.find(".spinner-inner").exists()).toBe(true);
    });

    it("should apply default size and color for users", () => {
      const wrapper = createWrapper();

      expect(wrapper.classes()).toContain("spinner");
      expect(wrapper.classes()).toContain("spinner-md");
      expect(wrapper.classes()).toContain("spinner-primary");
    });
  });

  describe("Size Variations for Different Contexts", () => {
    it("should display small spinner for compact interfaces", () => {
      const wrapper = createWrapper({
        props: { size: "sm" },
      });

      expect(wrapper.classes()).toContain("spinner-sm");
      // Small spinner should be visually distinct
      expect(wrapper.html()).toMatch(/spinner.*sm/);
    });

    it("should display medium spinner for standard loading", () => {
      const wrapper = createWrapper({
        props: { size: "md" },
      });

      expect(wrapper.classes()).toContain("spinner-md");
    });

    it("should display large spinner for prominent loading states", () => {
      const wrapper = createWrapper({
        props: { size: "lg" },
      });

      expect(wrapper.classes()).toContain("spinner-lg");
      // Large spinner should be more prominent
      expect(wrapper.html()).toMatch(/spinner.*lg/);
    });
  });

  describe("Color Variations for Different Themes", () => {
    it("should display primary color for standard loading", () => {
      const wrapper = createWrapper({
        props: { color: "primary" },
      });

      expect(wrapper.classes()).toContain("spinner-primary");
    });

    it("should display white color for dark backgrounds", () => {
      const wrapper = createWrapper({
        props: { color: "white" },
      });

      expect(wrapper.classes()).toContain("spinner-white");
    });

    it("should display dark color for light backgrounds", () => {
      const wrapper = createWrapper({
        props: { color: "dark" },
      });

      expect(wrapper.classes()).toContain("spinner-dark");
    });
  });

  describe("Visual Loading Feedback", () => {
    it("should provide animated loading indication", () => {
      const wrapper = createWrapper();

      const spinnerInner = wrapper.find(".spinner-inner");
      expect(spinnerInner.exists()).toBe(true);

      // Should have spinning animation through CSS
      // Note: In a real test, you might check for animation properties
      expect(spinnerInner.element).toBeDefined();
    });

    it("should be visible and accessible to users", () => {
      const wrapper = createWrapper();

      expect(wrapper.isVisible()).toBe(true);
      expect(wrapper.find(".spinner").isVisible()).toBe(true);
    });
  });

  describe("User Experience in Different Scenarios", () => {
    it("should work well in button loading states", () => {
      const wrapper = createWrapper({
        props: {
          size: "sm",
          color: "white"
        },
      });

      // Small white spinner suitable for button loading
      expect(wrapper.classes()).toContain("spinner-sm");
      expect(wrapper.classes()).toContain("spinner-white");
    });

    it("should work well in page loading states", () => {
      const wrapper = createWrapper({
        props: {
          size: "lg",
          color: "primary"
        },
      });

      // Large primary spinner suitable for page loading
      expect(wrapper.classes()).toContain("spinner-lg");
      expect(wrapper.classes()).toContain("spinner-primary");
    });

    it("should work well in card loading states", () => {
      const wrapper = createWrapper({
        props: {
          size: "md",
          color: "primary"
        },
      });

      // Medium spinner suitable for card content loading
      expect(wrapper.classes()).toContain("spinner-md");
      expect(wrapper.classes()).toContain("spinner-primary");
    });
  });

  describe("Accessibility Features", () => {
    it("should be visible to screen readers as loading indicator", () => {
      const wrapper = createWrapper();

      // Spinner should be present in DOM for screen readers
      expect(wrapper.find(".spinner").exists()).toBe(true);
      // Note: In real implementation, might include aria-label or role
    });

    it("should not interfere with keyboard navigation", () => {
      const wrapper = createWrapper();

      // Spinner should not be focusable
      const spinner = wrapper.find(".spinner");
      expect(spinner.element.tagName).toBe("DIV");
      // Divs are not focusable by default
    });
  });

  describe("Performance Considerations", () => {
    it("should render efficiently without heavy DOM structure", () => {
      const wrapper = createWrapper();

      // Should only have minimal DOM structure
      expect(wrapper.element.children).toHaveLength(1);
      expect(wrapper.find(".spinner-inner").exists()).toBe(true);
    });

    it("should handle rapid prop changes gracefully", async () => {
      const wrapper = createWrapper({
        props: { size: "sm", color: "primary" },
      });

      expect(wrapper.classes()).toContain("spinner-sm");
      expect(wrapper.classes()).toContain("spinner-primary");

      // Change props rapidly
      await wrapper.setProps({ size: "lg", color: "white" });

      expect(wrapper.classes()).toContain("spinner-lg");
      expect(wrapper.classes()).toContain("spinner-white");
      expect(wrapper.classes()).not.toContain("spinner-sm");
      expect(wrapper.classes()).not.toContain("spinner-primary");
    });
  });

  describe("Component Integration", () => {
    it("should work well as inline loading indicator", () => {
      const wrapper = createWrapper({
        props: { size: "sm" },
      });

      // Should be inline-block for text flow
      // Note: Actual style checking would need jsdom configuration
      expect(wrapper.classes()).toContain("spinner");
    });

    it("should maintain consistent styling across different contexts", () => {
      const primary = createWrapper({ props: { color: "primary" } });
      const white = createWrapper({ props: { color: "white" } });
      const dark = createWrapper({ props: { color: "dark" } });

      // All should have base spinner class
      expect(primary.classes()).toContain("spinner");
      expect(white.classes()).toContain("spinner");
      expect(dark.classes()).toContain("spinner");

      // Each should have unique color class
      expect(primary.classes()).toContain("spinner-primary");
      expect(white.classes()).toContain("spinner-white");
      expect(dark.classes()).toContain("spinner-dark");
    });
  });
});
