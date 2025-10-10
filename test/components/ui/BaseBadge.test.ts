import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseBadge from "../../../src/components/ui/BaseBadge.vue";
import i18n from "../../../src/locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseBadge, {
    global: {
      plugins: [i18n],
    },
    ...options,
  });
};

describe("BaseBadge - User Behavior", () => {
  describe("Basic Badge Display", () => {
    it("should display badge content to users", () => {
      const wrapper = createWrapper({
        slots: {
          default: "New",
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toBe("New");
      expect(wrapper.classes()).toContain("badge");
    });

    it("should apply default styling for users", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Default Badge",
        },
      });

      expect(wrapper.classes()).toContain("badge");
      expect(wrapper.classes()).toContain("badge-primary");
      expect(wrapper.classes()).toContain("badge-md");
    });
  });

  describe("Badge Variants for Different Contexts", () => {
    it("should show success badge for positive states", () => {
      const wrapper = createWrapper({
        props: { variant: "success" },
        slots: { default: "Success" },
      });

      expect(wrapper.classes()).toContain("badge-success");
      expect(wrapper.text()).toBe("Success");
    });

    it("should show warning badge for caution states", () => {
      const wrapper = createWrapper({
        props: { variant: "warning" },
        slots: { default: "Warning" },
      });

      expect(wrapper.classes()).toContain("badge-warning");
      expect(wrapper.text()).toBe("Warning");
    });

    it("should show danger badge for error states", () => {
      const wrapper = createWrapper({
        props: { variant: "danger" },
        slots: { default: "Error" },
      });

      expect(wrapper.classes()).toContain("badge-danger");
      expect(wrapper.text()).toBe("Error");
    });

    it("should show info badge for informational content", () => {
      const wrapper = createWrapper({
        props: { variant: "info" },
        slots: { default: "Info" },
      });

      expect(wrapper.classes()).toContain("badge-info");
    });

    it("should show light badge for subtle emphasis", () => {
      const wrapper = createWrapper({
        props: { variant: "light" },
        slots: { default: "Light" },
      });

      expect(wrapper.classes()).toContain("badge-light");
    });

    it("should show dark badge for strong emphasis", () => {
      const wrapper = createWrapper({
        props: { variant: "dark" },
        slots: { default: "Dark" },
      });

      expect(wrapper.classes()).toContain("badge-dark");
    });
  });

  describe("Badge Sizes for Different Interfaces", () => {
    it("should display small badges for compact spaces", () => {
      const wrapper = createWrapper({
        props: { size: "sm" },
        slots: { default: "Small" },
      });

      expect(wrapper.classes()).toContain("badge-sm");
    });

    it("should display large badges for prominent display", () => {
      const wrapper = createWrapper({
        props: { size: "lg" },
        slots: { default: "Large" },
      });

      expect(wrapper.classes()).toContain("badge-lg");
    });
  });

  describe("Badge Styling Options", () => {
    it("should show outlined badge when specified", () => {
      const wrapper = createWrapper({
        props: { outlined: true },
        slots: { default: "Outlined" },
      });

      expect(wrapper.classes()).toContain("badge-outlined");
    });

    it("should show filled badge by default", () => {
      const wrapper = createWrapper({
        props: { outlined: false },
        slots: { default: "Filled" },
      });

      expect(wrapper.classes()).not.toContain("badge-outlined");
    });
  });

  describe("Badge Icons", () => {
    it("should display icon alongside text", () => {
      const wrapper = createWrapper({
        props: { icon: "⭐" },
        slots: { default: "Featured" },
      });

      expect(wrapper.text()).toContain("⭐");
      expect(wrapper.text()).toContain("Featured");
      expect(wrapper.find(".badge-icon").exists()).toBe(true);
    });

    it("should work with icon only", () => {
      const wrapper = createWrapper({
        props: { icon: "✓" },
        slots: { default: "" },
      });

      expect(wrapper.text()).toContain("✓");
      expect(wrapper.find(".badge-icon").exists()).toBe(true);
    });

    it("should work without icon", () => {
      const wrapper = createWrapper({
        slots: { default: "No Icon" },
      });

      expect(wrapper.find(".badge-icon").exists()).toBe(false);
      expect(wrapper.text()).toBe("No Icon");
    });
  });

  describe("User Experience Scenarios", () => {
    it("should work well as status indicators", () => {
      const activeStatus = createWrapper({
        props: { variant: "success", size: "sm" },
        slots: { default: "Active" },
      });

      const inactiveStatus = createWrapper({
        props: { variant: "danger", size: "sm" },
        slots: { default: "Inactive" },
      });

      expect(activeStatus.classes()).toContain("badge-success");
      expect(activeStatus.classes()).toContain("badge-sm");
      expect(inactiveStatus.classes()).toContain("badge-danger");
    });

    it("should work well as notification indicators", () => {
      const wrapper = createWrapper({
        props: {
          variant: "danger",
          size: "sm",
          icon: "!",
        },
        slots: { default: "3" },
      });

      expect(wrapper.text()).toContain("!");
      expect(wrapper.text()).toContain("3");
      expect(wrapper.classes()).toContain("badge-danger");
    });

    it("should work well as category tags", () => {
      const wrapper = createWrapper({
        props: {
          variant: "info",
          outlined: true,
        },
        slots: { default: "JavaScript" },
      });

      expect(wrapper.text()).toBe("JavaScript");
      expect(wrapper.classes()).toContain("badge-info");
      expect(wrapper.classes()).toContain("badge-outlined");
    });

    it("should support dynamic content updates", async () => {
      const wrapper = createWrapper({
        props: { variant: "primary" },
        slots: { default: "Count: 0" },
      });

      expect(wrapper.text()).toBe("Count: 0");

      // Simulate dynamic content change
      await wrapper.setProps({ variant: "success" });
      expect(wrapper.classes()).toContain("badge-success");
    });
  });

  describe("Accessibility Features", () => {
    it("should be readable by screen readers", () => {
      const wrapper = createWrapper({
        slots: { default: "Important Notice" },
      });

      expect(wrapper.text()).toBe("Important Notice");
      // Badge should be inline and readable
      expect(wrapper.element.tagName).toBe("SPAN");
    });

    it("should work well with complex content", () => {
      const wrapper = createWrapper({
        props: { variant: "warning" },
        slots: {
          default: "<span>Complex <strong>Content</strong></span>",
        },
      });

      expect(wrapper.html()).toContain("Complex");
      expect(wrapper.html()).toContain("Content");
    });
  });

  describe("Visual Design Combinations", () => {
    it("should combine all props effectively", () => {
      const wrapper = createWrapper({
        props: {
          variant: "success",
          size: "lg",
          icon: "✅",
          outlined: true,
        },
        slots: { default: "Completed" },
      });

      expect(wrapper.classes()).toContain("badge-success");
      expect(wrapper.classes()).toContain("badge-lg");
      expect(wrapper.classes()).toContain("badge-outlined");
      expect(wrapper.text()).toContain("✅");
      expect(wrapper.text()).toContain("Completed");
    });

    it("should handle minimal configuration", () => {
      const wrapper = createWrapper({
        slots: { default: "Simple" },
      });

      expect(wrapper.text()).toBe("Simple");
      expect(wrapper.classes()).toContain("badge");
      expect(wrapper.classes()).toContain("badge-primary");
      expect(wrapper.classes()).toContain("badge-md");
    });
  });

  describe("Performance and Integration", () => {
    it("should render efficiently with minimal DOM", () => {
      const wrapper = createWrapper({
        slots: { default: "Efficient" },
      });

      // Should have clean, minimal structure
      expect(wrapper.element.tagName).toBe("SPAN");
      expect(wrapper.classes().length).toBeGreaterThan(0);
    });

    it("should work well in lists and collections", () => {
      const badges = ["New", "Popular", "Sale"].map((text) =>
        createWrapper({
          props: { variant: "primary" },
          slots: { default: text },
        }),
      );

      badges.forEach((badge) => {
        expect(badge.exists()).toBe(true);
        expect(badge.classes()).toContain("badge-primary");
      });
    });
  });
});
