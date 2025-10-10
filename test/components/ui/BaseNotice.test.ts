import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseNotice from "../../../src/components/ui/BaseNotice.vue";
import i18n from "../../../src/locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseNotice, {
    global: {
      plugins: [i18n],
    },
    ...options,
  });
};

describe("BaseNotice - User Behavior", () => {
  describe("Basic Notice Display", () => {
    it("should display notice content to users", () => {
      const wrapper = createWrapper({
        slots: {
          default: "This is an important notice",
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain("This is an important notice");
      expect(wrapper.classes()).toContain("notice");
      expect(wrapper.classes()).toContain("notice-info");
    });

    it("should show notice with title", () => {
      const wrapper = createWrapper({
        props: {
          title: "Important Update",
        },
        slots: {
          default: "Please read this carefully",
        },
      });

      expect(wrapper.find(".notice-title").text()).toBe("Important Update");
      expect(wrapper.text()).toContain("Please read this carefully");
    });

    it("should work without title", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Notice without title",
        },
      });

      expect(wrapper.find(".notice-title").exists()).toBe(false);
      expect(wrapper.text()).toContain("Notice without title");
    });
  });

  describe("Notice Types for Different Contexts", () => {
    it("should show info notice for general information", () => {
      const wrapper = createWrapper({
        props: {
          type: "info",
          title: "Information",
        },
        slots: {
          default: "Here's some helpful information",
        },
      });

      expect(wrapper.classes()).toContain("notice-info");
      expect(wrapper.find(".notice-icon").text()).toBe("ℹ️");
    });

    it("should show success notice for positive feedback", () => {
      const wrapper = createWrapper({
        props: {
          type: "success",
          title: "Success",
        },
        slots: {
          default: "Operation completed successfully",
        },
      });

      expect(wrapper.classes()).toContain("notice-success");
      expect(wrapper.find(".notice-icon").text()).toBe("✅");
    });

    it("should show warning notice for caution", () => {
      const wrapper = createWrapper({
        props: {
          type: "warning",
          title: "Warning",
        },
        slots: {
          default: "Please proceed with caution",
        },
      });

      expect(wrapper.classes()).toContain("notice-warning");
      expect(wrapper.find(".notice-icon").text()).toBe("⚠️");
    });

    it("should show error notice for problems", () => {
      const wrapper = createWrapper({
        props: {
          type: "error",
          title: "Error",
        },
        slots: {
          default: "Something went wrong",
        },
      });

      expect(wrapper.classes()).toContain("notice-error");
      expect(wrapper.find(".notice-icon").text()).toBe("❌");
    });
  });

  describe("Notice Icons", () => {
    it("should show icons by default", () => {
      const wrapper = createWrapper({
        props: {
          type: "info",
        },
        slots: {
          default: "Info with icon",
        },
      });

      expect(wrapper.find(".notice-icon").exists()).toBe(true);
      expect(wrapper.find(".notice-icon").text()).toBe("ℹ️");
    });

    it("should hide icons when disabled", () => {
      const wrapper = createWrapper({
        props: {
          type: "info",
          showIcon: false,
        },
        slots: {
          default: "Info without icon",
        },
      });

      expect(wrapper.find(".notice-icon").exists()).toBe(false);
    });

    it("should show correct icon for each type", () => {
      const iconTests = [
        { type: "info", expectedIcon: "ℹ️" },
        { type: "success", expectedIcon: "✅" },
        { type: "warning", expectedIcon: "⚠️" },
        { type: "error", expectedIcon: "❌" },
      ];

      iconTests.forEach(({ type, expectedIcon }) => {
        const wrapper = createWrapper({
          props: {
            type: type as "info" | "success" | "warning" | "error",
          },
          slots: {
            default: `${type} message`,
          },
        });

        expect(wrapper.find(".notice-icon").text()).toBe(expectedIcon);
      });
    });
  });

  describe("Dismissible Notice Behavior", () => {
    it("should show dismiss button when dismissible", () => {
      const wrapper = createWrapper({
        props: {
          dismissible: true,
        },
        slots: {
          default: "Dismissible notice",
        },
      });

      const dismissButton = wrapper.find(".notice-dismiss");
      expect(dismissButton.exists()).toBe(true);
      expect(dismissButton.attributes("aria-label")).toBe("Dismiss notice");
    });

    it("should hide dismiss button by default", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Non-dismissible notice",
        },
      });

      expect(wrapper.find(".notice-dismiss").exists()).toBe(false);
    });

    it("should dismiss notice when user clicks dismiss button", async () => {
      const wrapper = createWrapper({
        props: {
          dismissible: true,
          modelValue: true,
        },
        slots: {
          default: "Click to dismiss",
        },
      });

      const dismissButton = wrapper.find(".notice-dismiss");
      await dismissButton.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
      expect(wrapper.emitted("dismiss")).toBeTruthy();
    });
  });

  describe("Notice Visibility Control", () => {
    it("should show notice when modelValue is true", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
        },
        slots: {
          default: "Visible notice",
        },
      });

      expect(wrapper.find(".notice").exists()).toBe(true);
    });

    it("should hide notice when modelValue is false", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: false,
        },
        slots: {
          default: "Hidden notice",
        },
      });

      expect(wrapper.find(".notice").exists()).toBe(false);
    });

    it("should be visible by default", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Default visibility",
        },
      });

      expect(wrapper.find(".notice").exists()).toBe(true);
    });
  });

  describe("Action Slots", () => {
    it("should display action buttons when provided", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Notice with actions",
          actions: '<button class="action-btn">Take Action</button>',
        },
      });

      expect(wrapper.find(".notice-actions").exists()).toBe(true);
      expect(wrapper.find(".action-btn").exists()).toBe(true);
      expect(wrapper.find(".action-btn").text()).toBe("Take Action");
    });

    it("should hide actions section when no actions provided", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Notice without actions",
        },
      });

      expect(wrapper.find(".notice-actions").exists()).toBe(false);
    });

    it("should support multiple action buttons", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Notice with multiple actions",
          actions: `
            <button class="primary-action">Confirm</button>
            <button class="secondary-action">Cancel</button>
          `,
        },
      });

      expect(wrapper.find(".notice-actions").exists()).toBe(true);
      expect(wrapper.find(".primary-action").text()).toBe("Confirm");
      expect(wrapper.find(".secondary-action").text()).toBe("Cancel");
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should work well for success messages", () => {
      const wrapper = createWrapper({
        props: {
          type: "success",
          title: "Profile Updated",
          dismissible: true,
        },
        slots: {
          default: "Your profile has been successfully updated.",
        },
      });

      expect(wrapper.classes()).toContain("notice-success");
      expect(wrapper.find(".notice-title").text()).toBe("Profile Updated");
      expect(wrapper.find(".notice-dismiss").exists()).toBe(true);
      expect(wrapper.find(".notice-icon").text()).toBe("✅");
    });

    it("should work well for error messages with actions", () => {
      const wrapper = createWrapper({
        props: {
          type: "error",
          title: "Connection Failed",
        },
        slots: {
          default: "Unable to connect to the server. Please try again.",
          actions: '<button class="retry-btn">Retry</button>',
        },
      });

      expect(wrapper.classes()).toContain("notice-error");
      expect(wrapper.find(".notice-title").text()).toBe("Connection Failed");
      expect(wrapper.find(".retry-btn").exists()).toBe(true);
      expect(wrapper.find(".notice-icon").text()).toBe("❌");
    });

    it("should work well for informational announcements", () => {
      const wrapper = createWrapper({
        props: {
          type: "info",
          title: "System Maintenance",
          showIcon: true,
        },
        slots: {
          default: "Scheduled maintenance will occur tonight from 2-4 AM EST.",
        },
      });

      expect(wrapper.classes()).toContain("notice-info");
      expect(wrapper.find(".notice-title").text()).toBe("System Maintenance");
      expect(wrapper.find(".notice-icon").text()).toBe("ℹ️");
    });

    it("should work well for warning notifications", () => {
      const wrapper = createWrapper({
        props: {
          type: "warning",
          title: "Storage Almost Full",
          dismissible: true,
        },
        slots: {
          default: "You are using 95% of your storage space.",
          actions: '<button class="upgrade-btn">Upgrade Plan</button>',
        },
      });

      expect(wrapper.classes()).toContain("notice-warning");
      expect(wrapper.find(".notice-title").text()).toBe("Storage Almost Full");
      expect(wrapper.find(".upgrade-btn").exists()).toBe(true);
      expect(wrapper.find(".notice-dismiss").exists()).toBe(true);
    });
  });

  describe("Complex Content Support", () => {
    it("should handle HTML content in slots", () => {
      const wrapper = createWrapper({
        slots: {
          default: `
            <p>This notice contains <strong>formatted text</strong>.</p>
            <ul>
              <li>First item</li>
              <li>Second item</li>
            </ul>
          `,
        },
      });

      expect(wrapper.html()).toContain("<strong>formatted text</strong>");
      expect(wrapper.html()).toContain("<ul>");
      expect(wrapper.html()).toContain("<li>First item</li>");
    });

    it("should handle long content gracefully", () => {
      const longContent = "This is a very long notice content that should wrap properly and maintain good readability even when it extends beyond a single line of text.";

      const wrapper = createWrapper({
        slots: {
          default: longContent,
        },
      });

      expect(wrapper.text()).toContain(longContent);
      expect(wrapper.find(".notice-body").exists()).toBe(true);
    });
  });

  describe("Accessibility Features", () => {
    it("should provide proper ARIA label for dismiss button", () => {
      const wrapper = createWrapper({
        props: {
          dismissible: true,
        },
        slots: {
          default: "Accessible notice",
        },
      });

      const dismissButton = wrapper.find(".notice-dismiss");
      expect(dismissButton.attributes("aria-label")).toBe("Dismiss notice");
    });

    it("should be readable by screen readers", () => {
      const wrapper = createWrapper({
        props: {
          title: "Screen Reader Test",
        },
        slots: {
          default: "This content should be accessible to screen readers",
        },
      });

      expect(wrapper.find(".notice-title").text()).toBe("Screen Reader Test");
      expect(wrapper.text()).toContain("This content should be accessible to screen readers");
    });

    it("should support keyboard navigation for dismiss button", () => {
      const wrapper = createWrapper({
        props: {
          dismissible: true,
        },
        slots: {
          default: "Keyboard accessible",
        },
      });

      const dismissButton = wrapper.find(".notice-dismiss");
      expect(dismissButton.element.tagName).toBe("BUTTON");
    });
  });

  describe("Visual Design Combinations", () => {
    it("should combine all features effectively", () => {
      const wrapper = createWrapper({
        props: {
          type: "warning",
          title: "Complete Configuration",
          dismissible: true,
          showIcon: true,
          modelValue: true,
        },
        slots: {
          default: "Please complete your profile setup.",
          actions: '<button class="complete-btn">Complete Now</button>',
        },
      });

      expect(wrapper.classes()).toContain("notice-warning");
      expect(wrapper.find(".notice-title").text()).toBe("Complete Configuration");
      expect(wrapper.find(".notice-icon").text()).toBe("⚠️");
      expect(wrapper.find(".notice-dismiss").exists()).toBe(true);
      expect(wrapper.find(".complete-btn").exists()).toBe(true);
    });

    it("should work with minimal configuration", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Simple notice",
        },
      });

      expect(wrapper.classes()).toContain("notice");
      expect(wrapper.classes()).toContain("notice-info");
      expect(wrapper.find(".notice-icon").text()).toBe("ℹ️");
      expect(wrapper.text()).toContain("Simple notice");
    });
  });

  describe("Performance and Integration", () => {
    it("should render efficiently", () => {
      const wrapper = createWrapper({
        slots: {
          default: "Performance test",
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".notice").exists()).toBe(true);
      expect(wrapper.find(".notice-content").exists()).toBe(true);
    });

    it("should handle dynamic type changes", async () => {
      const wrapper = createWrapper({
        props: {
          type: "info",
        },
        slots: {
          default: "Dynamic notice",
        },
      });

      expect(wrapper.classes()).toContain("notice-info");
      expect(wrapper.find(".notice-icon").text()).toBe("ℹ️");

      await wrapper.setProps({ type: "success" });
      expect(wrapper.classes()).toContain("notice-success");
      expect(wrapper.find(".notice-icon").text()).toBe("✅");
    });

    it("should handle show/hide transitions smoothly", async () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
        },
        slots: {
          default: "Toggle visibility",
        },
      });

      expect(wrapper.find(".notice").exists()).toBe(true);

      await wrapper.setProps({ modelValue: false });
      expect(wrapper.find(".notice").exists()).toBe(false);

      await wrapper.setProps({ modelValue: true });
      expect(wrapper.find(".notice").exists()).toBe(true);
    });
  });
});
