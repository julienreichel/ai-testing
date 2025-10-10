import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import BaseToast from "../../../src/components/ui/BaseToast.vue";
import i18n from "../../../src/locales";

// Mock timers for auto-hide testing
vi.useFakeTimers();

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseToast, {
    global: {
      plugins: [i18n],
      // Stub Teleport to make testing simpler
      stubs: {
        Teleport: {
          template: '<div class="teleport-stub"><slot /></div>',
        },
      },
    },
    ...options,
  });
};

describe("BaseToast - User Behavior", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    // Clear any existing toast elements
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = "";
  });

  describe("Basic Toast Display", () => {
    it("should display toast notification to users", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "This is a toast notification",
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain("This is a toast notification");
      expect(wrapper.find(".toast").exists()).toBe(true);
    });

    it("should show toast with title and message", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          title: "Success",
          message: "Operation completed successfully",
        },
      });

      expect(wrapper.find(".toast-title").text()).toBe("Success");
      expect(wrapper.find(".toast-message").text()).toBe(
        "Operation completed successfully",
      );
    });

    it("should work with slot content", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
        },
        slots: {
          default: "Custom slot content",
        },
      });

      expect(wrapper.text()).toContain("Custom slot content");
    });
  });

  describe("Toast Types for Different Contexts", () => {
    it("should show success toast for positive actions", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "success",
          message: "Successfully saved",
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-success");
      expect(wrapper.find(".toast-icon").text()).toBe("✅");
    });

    it("should show error toast for problems", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "error",
          message: "An error occurred",
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-error");
      expect(wrapper.find(".toast-icon").text()).toBe("❌");
    });

    it("should show warning toast for cautions", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "warning",
          message: "Please be careful",
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-warning");
      expect(wrapper.find(".toast-icon").text()).toBe("⚠️");
    });

    it("should show info toast for information", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "info",
          message: "Here's some information",
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-info");
      expect(wrapper.find(".toast-icon").text()).toBe("ℹ️");
    });
  });

  describe("Toast Positioning", () => {
    it("should position toast at top-right by default", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Top right position",
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-top-right");
    });

    it("should position toast at different corners", () => {
      const positions = [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "top-center",
        "bottom-center",
      ];

      positions.forEach((position) => {
        const wrapper = createWrapper({
          props: {
            modelValue: true,
            position: position as
              | "top-left"
              | "top-right"
              | "bottom-left"
              | "bottom-right"
              | "top-center"
              | "bottom-center",
            message: `Toast at ${position}`,
          },
        });

        expect(wrapper.find(".toast").classes()).toContain(`toast-${position}`);
      });
    });
  });

  describe("Auto-hide Behavior", () => {
    it("should auto-hide after specified duration by default", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Auto-hide toast",
          duration: 2000,
        },
      });

      expect(wrapper.emitted("update:modelValue")).toBeFalsy();

      // Fast-forward time
      vi.advanceTimersByTime(2000);

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("should not auto-hide when disabled", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "No auto-hide",
          autoHide: false,
          duration: 1000,
        },
      });

      vi.advanceTimersByTime(1000);

      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
      expect(wrapper.emitted("close")).toBeFalsy();
    });

    it("should use default duration when not specified", () => {
      const DEFAULT_DURATION = 4000;

      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Default duration",
        },
      });

      vi.advanceTimersByTime(DEFAULT_DURATION);

      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });
  });

  describe("Manual Dismissal", () => {
    it("should show close button when closable", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Closable toast",
          closable: true,
        },
      });

      const closeButton = wrapper.find(".toast-close");
      expect(closeButton.exists()).toBe(true);
      expect(closeButton.attributes("aria-label")).toBe("Close notification");
    });

    it("should hide close button when not closable", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Non-closable toast",
          closable: false,
        },
      });

      expect(wrapper.find(".toast-close").exists()).toBe(false);
    });

    it("should close when user clicks close button", async () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Click to close",
          closable: true,
        },
      });

      const closeButton = wrapper.find(".toast-close");
      await closeButton.trigger("click");

      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("should close when user clicks toast body if enabled", async () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Click anywhere to close",
          clickToClose: true,
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-clickable");

      await wrapper.find(".toast").trigger("click");

      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("should not close on body click when disabled", async () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Cannot click to close",
          clickToClose: false,
        },
      });

      expect(wrapper.classes()).not.toContain("toast-clickable");

      await wrapper.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });
  });

  describe("Toast Icons", () => {
    it("should show icons by default", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "success",
          message: "With icon",
        },
      });

      expect(wrapper.find(".toast-icon").exists()).toBe(true);
      expect(wrapper.find(".toast-icon").text()).toBe("✅");
    });

    it("should hide icons when disabled", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "success",
          message: "Without icon",
          showIcon: false,
        },
      });

      expect(wrapper.find(".toast-icon").exists()).toBe(false);
    });
  });

  describe("Toast Visibility Control", () => {
    it("should show toast when modelValue is true", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Visible toast",
        },
      });

      expect(wrapper.find(".toast").exists()).toBe(true);
    });

    it("should hide toast when modelValue is false", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: false,
          message: "Hidden toast",
        },
      });

      expect(wrapper.find(".toast").exists()).toBe(false);
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should work well for success notifications", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "success",
          title: "Save Successful",
          message: "Your changes have been saved",
          position: "top-right",
          duration: 3000,
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-success");
      expect(wrapper.find(".toast").classes()).toContain("toast-top-right");
      expect(wrapper.find(".toast-title").text()).toBe("Save Successful");
      expect(wrapper.find(".toast-icon").text()).toBe("✅");

      vi.advanceTimersByTime(3000);
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("should work well for error notifications", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "error",
          title: "Validation Error",
          message: "Please check your input",
          persistent: true,
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-error");
      expect(wrapper.find(".toast-close").exists()).toBe(true);
      expect(wrapper.find(".toast-title").text()).toBe("Validation Error");
      expect(wrapper.find(".toast-icon").text()).toBe("❌");

      expect(wrapper.emitted("close")).toBeFalsy();
    });

    it("should work well for informational updates", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          type: "info",
          title: "New Feature Available",
          message: "Check out our new dashboard feature",
          position: "bottom-center",
          clickToClose: true,
        },
      });

      expect(wrapper.find(".toast").classes()).toContain("toast-info");
      expect(wrapper.find(".toast").classes()).toContain("toast-bottom-center");
      expect(wrapper.find(".toast").classes()).toContain("toast-clickable");
    });
  });

  describe("Accessibility Features", () => {
    it("should provide proper ARIA label for close button", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Accessible toast",
          closable: true,
        },
      });

      const closeButton = wrapper.find(".toast-close");
      expect(closeButton.attributes("aria-label")).toBe("Close notification");
    });

    it("should be readable by screen readers", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          title: "Important Notice",
          message: "Please read this important information",
        },
      });

      expect(wrapper.text()).toContain("Important Notice");
      expect(wrapper.text()).toContain(
        "Please read this important information",
      );
    });

    it("should support keyboard interaction for close button", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Keyboard accessible",
          closable: true,
        },
      });

      const closeButton = wrapper.find(".toast-close");
      expect(closeButton.element.tagName).toBe("BUTTON");
    });
  });

  describe("Timer Management", () => {
    it("should clear timer when manually closed", async () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Manual close test",
          duration: 5000,
          closable: true,
        },
      });

      // Manually close before auto-hide
      const closeButton = wrapper.find(".toast-close");
      await closeButton.trigger("click");

      expect(wrapper.emitted("close")).toBeTruthy();

      // Timer should be cleared, no additional events
      const initialCloseCount = wrapper.emitted("close")?.length || 0;
      vi.advanceTimersByTime(5000);

      expect(wrapper.emitted("close")?.length).toBe(initialCloseCount);
    });

    it("should handle component unmounting cleanly", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Unmount test",
          duration: 10000,
        },
      });

      // Unmount before timer completes
      wrapper.unmount();

      // Should not throw errors or emit events after unmount
      vi.advanceTimersByTime(10000);
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero duration gracefully", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Zero duration",
          duration: 0,
          autoHide: true,
        },
      });

      // Should not auto-hide with zero duration
      vi.advanceTimersByTime(1000);
      expect(wrapper.emitted("close")).toBeFalsy();
    });

    it("should handle negative duration gracefully", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Negative duration",
          duration: -1000,
          autoHide: true,
        },
      });

      // Should not auto-hide with negative duration
      vi.advanceTimersByTime(1000);
      expect(wrapper.emitted("close")).toBeFalsy();
    });

    it("should work without title", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Message only",
        },
      });

      expect(wrapper.find(".toast-title").exists()).toBe(false);
      expect(wrapper.find(".toast-message").text()).toBe("Message only");
    });

    it("should work without message prop when using slot", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
        },
        slots: {
          default: "Slot content only",
        },
      });

      expect(wrapper.text()).toContain("Slot content only");
    });
  });

  describe("Performance and Integration", () => {
    it("should render efficiently with minimal DOM structure", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: true,
          message: "Performance test",
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".toast").exists()).toBe(true);
      expect(wrapper.find(".toast-content").exists()).toBe(true);
    });

    it("should handle multiple toasts without conflicts", () => {
      const toast1 = createWrapper({
        props: {
          modelValue: true,
          message: "First toast",
          position: "top-right",
        },
      });

      const toast2 = createWrapper({
        props: {
          modelValue: true,
          message: "Second toast",
          position: "top-left",
        },
      });

      expect(toast1.find(".toast").classes()).toContain("toast-top-right");
      expect(toast2.find(".toast").classes()).toContain("toast-top-left");
      expect(toast1.text()).toContain("First toast");
      expect(toast2.text()).toContain("Second toast");
    });
  });
});
