import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseEmptyState from "components/ui/BaseEmptyState.vue";
import i18n from "@locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseEmptyState, {
    global: {
      plugins: [i18n],
    },
    ...options,
  });
};

describe("BaseEmptyState - User Behavior", () => {
  describe("Basic Empty State Display", () => {
    it("should show empty state message to users", () => {
      const wrapper = createWrapper({
        props: {
          title: "No Items Found",
          description: "There are currently no items to display.",
        },
      });

      expect(wrapper.text()).toContain("No Items Found");
      expect(wrapper.text()).toContain(
        "There are currently no items to display.",
      );
    });

    it("should display default icon when no custom icon provided", () => {
      const wrapper = createWrapper({
        props: {
          title: "Empty State",
          showIcon: true,
        },
      });

      expect(wrapper.find(".empty-state-icon").exists()).toBe(true);
      expect(wrapper.find(".empty-state-emoji").exists()).toBe(true);
    });

    it("should hide icon when showIcon is false", () => {
      const wrapper = createWrapper({
        props: {
          title: "No Icon State",
          showIcon: false,
        },
      });

      expect(wrapper.find(".empty-state-icon").exists()).toBe(false);
    });
  });

  describe("Content Variations", () => {
    it("should display only title when description not provided", () => {
      const wrapper = createWrapper({
        props: {
          title: "Just a Title",
        },
      });

      expect(wrapper.find(".empty-state-title").text()).toBe("Just a Title");
      expect(wrapper.find(".empty-state-description").exists()).toBe(false);
    });

    it("should display both title and description", () => {
      const wrapper = createWrapper({
        props: {
          title: "Complete Empty State",
          description: "This explains what users should do next.",
        },
      });

      expect(wrapper.find(".empty-state-title").text()).toBe(
        "Complete Empty State",
      );
      expect(wrapper.find(".empty-state-description").text()).toBe(
        "This explains what users should do next.",
      );
    });

    it("should support custom content through slots", () => {
      const wrapper = createWrapper({
        props: {
          title: "Custom Content",
        },
        slots: {
          content: '<div class="custom-message">Custom help text</div>',
        },
      });

      expect(wrapper.find(".custom-message").text()).toBe("Custom help text");
    });
  });

  describe("Action Button Behavior", () => {
    it("should show action button when actionLabel provided", () => {
      const wrapper = createWrapper({
        props: {
          title: "No Data",
          actionLabel: "Add New Item",
        },
      });

      const actionButton = wrapper.find(".empty-state-button");
      expect(actionButton.exists()).toBe(true);
      expect(actionButton.text()).toBe("Add New Item");
    });

    it("should emit action event when user clicks button", async () => {
      const wrapper = createWrapper({
        props: {
          title: "Empty List",
          actionLabel: "Create First Item",
        },
      });

      const actionButton = wrapper.find(".empty-state-button");
      await actionButton.trigger("click");

      expect(wrapper.emitted("action")).toBeTruthy();
    });

    it("should support custom action through slot", () => {
      const wrapper = createWrapper({
        props: {
          title: "Custom Actions",
        },
        slots: {
          action:
            '<button class="custom-action">Custom Button</button><a href="#" class="custom-link">Or browse examples</a>',
        },
      });

      expect(wrapper.find(".custom-action").text()).toBe("Custom Button");
      expect(wrapper.find(".custom-link").text()).toBe("Or browse examples");
    });

    it("should hide actions section when no action provided", () => {
      const wrapper = createWrapper({
        props: {
          title: "No Actions",
          description: "Just informational",
        },
      });

      expect(wrapper.find(".empty-state-actions").exists()).toBe(false);
    });
  });

  describe("Visual Variants", () => {
    it("should apply default styling for standard empty states", () => {
      const wrapper = createWrapper({
        props: {
          title: "Default Style",
          variant: "default",
        },
      });

      expect(wrapper.classes()).toContain("empty-state-default");
    });

    it("should apply subtle styling for less prominent empty states", () => {
      const wrapper = createWrapper({
        props: {
          title: "Subtle Style",
          variant: "subtle",
        },
      });

      expect(wrapper.classes()).toContain("empty-state-subtle");
    });

    it("should apply bordered styling for defined boundaries", () => {
      const wrapper = createWrapper({
        props: {
          title: "Bordered Style",
          variant: "bordered",
        },
      });

      expect(wrapper.classes()).toContain("empty-state-bordered");
    });
  });

  describe("Size Variations", () => {
    it("should display small size for compact spaces", () => {
      const wrapper = createWrapper({
        props: {
          title: "Small Empty State",
          size: "sm",
        },
      });

      expect(wrapper.classes()).toContain("empty-state-sm");
    });

    it("should display large size for prominent empty states", () => {
      const wrapper = createWrapper({
        props: {
          title: "Large Empty State",
          size: "lg",
        },
      });

      expect(wrapper.classes()).toContain("empty-state-lg");
    });
  });

  describe("Custom Icon Support", () => {
    it("should display custom icon when provided through slot", () => {
      const wrapper = createWrapper({
        props: {
          title: "Custom Icon State",
          showIcon: true,
        },
        slots: {
          icon: '<svg class="custom-icon"><circle r="10"></circle></svg>',
        },
      });

      expect(wrapper.find(".custom-icon").exists()).toBe(true);
      expect(wrapper.find(".empty-state-emoji").exists()).toBe(false);
    });

    it("should use custom icon prop when provided", () => {
      const wrapper = createWrapper({
        props: {
          title: "Emoji Icon",
          icon: "🎯",
          showIcon: true,
        },
      });

      expect(wrapper.text()).toContain("🎯");
    });
  });

  describe("User Experience Scenarios", () => {
    it("should provide clear call-to-action for first-time users", () => {
      const wrapper = createWrapper({
        props: {
          title: "Welcome to Your Dashboard",
          description: "Get started by adding your first project.",
          actionLabel: "Create Project",
          showIcon: true,
        },
      });

      expect(wrapper.text()).toContain("Welcome to Your Dashboard");
      expect(wrapper.text()).toContain(
        "Get started by adding your first project.",
      );
      expect(wrapper.find(".empty-state-button").text()).toBe("Create Project");
      expect(wrapper.find(".empty-state-icon").exists()).toBe(true);
    });

    it("should handle search results empty state", () => {
      const wrapper = createWrapper({
        props: {
          title: "No Results Found",
          description: "Try adjusting your search terms or filters.",
          variant: "subtle",
        },
      });

      expect(wrapper.text()).toContain("No Results Found");
      expect(wrapper.text()).toContain("Try adjusting your search terms");
      expect(wrapper.classes()).toContain("empty-state-subtle");
    });

    it("should support error recovery scenarios", () => {
      const wrapper = createWrapper({
        props: {
          title: "Unable to Load Data",
          description: "Something went wrong while loading your content.",
          actionLabel: "Try Again",
        },
      });

      expect(wrapper.text()).toContain("Unable to Load Data");
      expect(wrapper.find(".empty-state-button").text()).toBe("Try Again");
    });

    it("should handle multiple action scenarios", () => {
      const wrapper = createWrapper({
        props: {
          title: "No Projects Yet",
          description: "Create your first project or import an existing one.",
        },
        slots: {
          action: `
            <button class="primary-action">Create New</button>
            <button class="secondary-action">Import Existing</button>
          `,
        },
      });

      expect(wrapper.find(".primary-action").text()).toBe("Create New");
      expect(wrapper.find(".secondary-action").text()).toBe("Import Existing");
    });
  });

  describe("Accessibility Features", () => {
    it("should provide semantic structure for screen readers", () => {
      const wrapper = createWrapper({
        props: {
          title: "Accessible Empty State",
          description: "Screen reader friendly description.",
          actionLabel: "Accessible Action",
        },
      });

      expect(wrapper.find("h3").text()).toBe("Accessible Empty State");
      expect(wrapper.find("p").text()).toBe(
        "Screen reader friendly description.",
      );
    });

    it("should maintain focus management for interactive elements", () => {
      const wrapper = createWrapper({
        props: {
          title: "Focus Test",
          actionLabel: "Focusable Button",
        },
      });

      const button = wrapper.find("button");
      expect(button.exists()).toBe(true);
      // Button should be focusable by default
    });
  });
});
