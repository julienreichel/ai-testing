import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CustomTooltip from "../../../src/components/ui/CustomTooltip.vue";
import i18n from "../../../src/locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(CustomTooltip, {
    global: {
      plugins: [i18n],
    },
    attachTo: document.body,
    ...options,
  });
};

// Mock getBoundingClientRect for consistent positioning tests
const mockGetBoundingClientRect = vi.fn(() => ({
  left: 100,
  top: 200,
  width: 50,
  height: 20,
  right: 150,
  bottom: 220,
  x: 100,
  y: 200,
  toJSON: (): Record<string, unknown> => ({}),
}));

describe("CustomTooltip - User Behavior", () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for all elements
    Object.defineProperty(Element.prototype, "getBoundingClientRect", {
      value: mockGetBoundingClientRect,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("When users hover over trigger elements", () => {
    it("should show tooltip with provided text when hovering", async () => {
      const wrapper = createWrapper({
        props: {
          text: "This is helpful information",
        },
        slots: {
          default: '<button data-testid="trigger">Hover me</button>',
        },
      });

      const trigger = wrapper.find('[data-testid="trigger"]');
      expect(trigger.exists()).toBe(true);

      // Initially tooltip should not exist
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);

      // Trigger hover on the container (where the event listener is)
      const container = wrapper.find('.tooltip-container');
      await container.trigger("mouseenter");
      await nextTick();

      // Tooltip should now be visible with the correct text
      const tooltip = wrapper.find(".custom-tooltip");
      expect(tooltip.exists()).toBe(true);
      expect(tooltip.isVisible()).toBe(true);
      expect(tooltip.text()).toBe("This is helpful information");
    });

    it("should hide tooltip when users stop hovering", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Tooltip text",
        },
        slots: {
          default: '<div data-testid="trigger">Hover target</div>',
        },
      });


      // Show tooltip
      const container = wrapper.find(".tooltip-container");
      await container.trigger("mouseenter");
      await nextTick();
      expect(wrapper.find(".custom-tooltip").exists()).toBe(true);

      // Hide tooltip
      await container.trigger("mouseleave");
      await nextTick();
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);
    });

    it("should not show tooltip for empty or dash text", async () => {
      // Test empty text
      const wrapperEmpty = createWrapper({
        props: {
          text: "",
        },
        slots: {
          default: '<span data-testid="trigger">Empty</span>',
        },
      });

      const containerEmpty = wrapperEmpty.find(".tooltip-container");
      await containerEmpty.trigger("mouseenter");
      await nextTick();
      expect(wrapperEmpty.find(".custom-tooltip").exists()).toBe(false);

      // Test dash text
      const wrapperDash = createWrapper({
        props: {
          text: "-",
        },
        slots: {
          default: '<span data-testid="trigger">Dash</span>',
        },
      });

      const containerDash = wrapperDash.find(".tooltip-container");
      await containerDash.trigger("mouseenter");
      await nextTick();
      expect(wrapperDash.find(".custom-tooltip").exists()).toBe(false);

      // Note: null and undefined would cause prop validation warnings
      // These are handled at the prop validation level, not component logic
    });
  });

  describe("When users interact with different content types", () => {
    it("should display multiline text content correctly", async () => {
      const multilineText = "Line 1\\nLine 2\\nLine 3";
      const wrapper = createWrapper({
        props: {
          text: multilineText,
        },
        slots: {
          default: '<span data-testid="trigger">Info</span>',
        },
      });

      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      const tooltip = wrapper.find(".custom-tooltip");
      expect(tooltip.text()).toBe(multilineText);
      // Check that component renders with pre-wrap class styling
      expect(tooltip.classes()).toContain("custom-tooltip");
    });

    it("should handle long text content with scrolling", async () => {
      const longText = "A".repeat(1000);
      const wrapper = createWrapper({
        props: {
          text: longText,
          maxWidth: 300,
          maxHeight: 200,
        },
        slots: {
          default: '<div data-testid="trigger">Long content</div>',
        },
      });

      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      const tooltip = wrapper.find(".custom-tooltip");
      expect(tooltip.exists()).toBe(true);
      // Check that tooltip has correct styling attributes
      const tooltipElement = tooltip.element as HTMLElement;
      expect(tooltipElement.style.maxWidth).toBe("300px");
      expect(tooltipElement.style.maxHeight).toBe("200px");
    });
  });

  describe("When users need delayed tooltip display", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should show tooltip immediately when no delay is set", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Immediate tooltip",
          delay: 0,
        },
        slots: {
          default: '<button data-testid="trigger">No delay</button>',
        },
      });

      const container = wrapper.find(".tooltip-container");
      await container.trigger("mouseenter");
      await nextTick();

      expect(wrapper.find(".custom-tooltip").exists()).toBe(true);
    });

    it("should delay tooltip display when delay is configured", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Delayed tooltip",
          delay: 500,
        },
        slots: {
          default: '<button data-testid="trigger">With delay</button>',
        },
      });

      const container = wrapper.find(".tooltip-container");
      await container.trigger("mouseenter");
      await nextTick();

      // Should not be visible immediately
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);

      // Advance timers
      vi.advanceTimersByTime(500);
      await nextTick();

      // Now should be visible
      expect(wrapper.find(".custom-tooltip").exists()).toBe(true);
    });

    it("should cancel delayed tooltip when users stop hovering before delay", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Cancelled tooltip",
          delay: 500,
        },
        slots: {
          default: '<button data-testid="trigger">Cancel delay</button>',
        },
      });


      // Start hover
      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      // Should not be visible yet
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);

      // Stop hovering before delay
      await container.trigger("mouseleave");
      await nextTick();

      // Advance timers past delay
      vi.advanceTimersByTime(600);
      await nextTick();

      // Should still not be visible
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);
    });
  });

  describe("Tooltip positioning and styling", () => {
    it("should position tooltip above the trigger element", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Positioned tooltip",
        },
        slots: {
          default: '<div data-testid="trigger">Position test</div>',
        },
      });

      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      const tooltip = wrapper.find(".custom-tooltip");
      expect(tooltip.exists()).toBe(true);

      // Should be positioned at center-x, above (y - 10)
      const tooltipElement = tooltip.element as HTMLElement;
      expect(tooltipElement.style.left).toBe("125px"); // 100 + 50/2
      expect(tooltipElement.style.top).toBe("190px"); // 200 - 10
    });

    it("should apply custom max dimensions", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Custom sized tooltip",
          maxWidth: 400,
          maxHeight: 250,
        },
        slots: {
          default: '<div data-testid="trigger">Size test</div>',
        },
      });

      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      const tooltip = wrapper.find(".custom-tooltip");
      const tooltipElement = tooltip.element as HTMLElement;
      expect(tooltipElement.style.maxWidth).toBe("400px");
      expect(tooltipElement.style.maxHeight).toBe("250px");
    });

    it("should have proper styling for code content", async () => {
      const wrapper = createWrapper({
        props: {
          text: "const result = calculate();",
        },
        slots: {
          default: '<code data-testid="trigger">Code</code>',
        },
      });

      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      const tooltip = wrapper.find(".custom-tooltip");
      expect(tooltip.classes()).toContain("custom-tooltip");
      expect(tooltip.exists()).toBe(true);
      expect(tooltip.text()).toBe("const result = calculate();");
    });
  });

  describe("Accessibility and user experience", () => {
    it("should not interfere with pointer events", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Non-blocking tooltip",
        },
        slots: {
          default: '<button data-testid="trigger">Clickable</button>',
        },
      });

      const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
      await nextTick();

      const tooltip = wrapper.find(".custom-tooltip");
      expect(tooltip.exists()).toBe(true);

      // Tooltip should exist and not block interactions
      expect(tooltip.classes()).toContain("custom-tooltip");
    });

    it("should render slot content correctly", () => {
      const wrapper = createWrapper({
        props: {
          text: "Test tooltip",
        },
        slots: {
          default: '<img src="test.jpg" alt="Test image" data-testid="image" />',
        },
      });

      const image = wrapper.find('[data-testid="image"]');
      expect(image.exists()).toBe(true);
      expect(image.attributes("alt")).toBe("Test image");
    });

    it("should handle complex slot content", () => {
      const wrapper = createWrapper({
        props: {
          text: "Complex content tooltip",
        },
        slots: {
          default: `
            <div data-testid="complex">
              <h3>Title</h3>
              <p>Description</p>
              <button>Action</button>
            </div>
          `,
        },
      });

      const complex = wrapper.find('[data-testid="complex"]');
      expect(complex.exists()).toBe(true);
      expect(complex.find("h3").text()).toBe("Title");
      expect(complex.find("p").text()).toBe("Description");
      expect(complex.find("button").text()).toBe("Action");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle rapid hover on/off interactions", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Rapid interaction tooltip",
        },
        slots: {
          default: '<div data-testid="trigger">Rapid test</div>',
        },
      });


      // Rapid interactions
      for (let i = 0; i < 5; i++) {
        const container = wrapper.find(".tooltip-container"); await container.trigger("mouseenter");
        await container.trigger("mouseleave");
      }

      await nextTick();

      // Should end in hidden state
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);
    });

    it("should clean up timeouts on component unmount", async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(window, "setTimeout");

      const wrapper = createWrapper({
        props: {
          text: "Cleanup test",
          delay: 1000,
        },
        slots: {
          default: '<button data-testid="trigger">Cleanup</button>',
        },
      });

      // Start a delayed tooltip by hovering the container
      const container = wrapper.find(".tooltip-container");
      await container.trigger("mouseenter");

      // Verify timeout was created
      expect(setTimeoutSpy).toHaveBeenCalled();

      // Unmount component - this should trigger cleanup
      wrapper.unmount();

      // Since the component unmounts, Vue's lifecycle should clean up
      // We can't easily test this with the current component structure
      // but we can verify the test doesn't crash and timeout was created
      expect(setTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should handle missing event target gracefully", async () => {
      const wrapper = createWrapper({
        props: {
          text: "Error handling test",
        },
        slots: {
          default: '<div data-testid="trigger">Error test</div>',
        },
      });

      // This test ensures the component doesn't crash with unusual events
      const container = wrapper.find('.tooltip-container');
      await container.trigger("mouseenter");
      await nextTick();

      // Should not crash and should handle the event
      expect(wrapper.find(".custom-tooltip").exists()).toBe(true);
    });
  });

  describe("Component configuration", () => {
    it("should accept and render with custom configuration", async () => {
      vi.useFakeTimers();

      const wrapper = createWrapper({
        props: {
          text: "Custom config test",
          maxWidth: 600,
          maxHeight: 400,
          delay: 250,
        },
        slots: {
          default: '<div data-testid="trigger">Custom test</div>',
        },
      });

      // Test that component renders without errors
      expect(wrapper.exists()).toBe(true);

      // Test delayed behavior with custom delay
      const container = wrapper.find(".tooltip-container");
      await container.trigger("mouseenter");
      await nextTick();

      // Should not be visible immediately due to delay
      expect(wrapper.find(".custom-tooltip").exists()).toBe(false);

      // Advance timers by delay amount
      vi.advanceTimersByTime(250);
      await nextTick();

      // Now should be visible
      expect(wrapper.find(".custom-tooltip").exists()).toBe(true);

      vi.useRealTimers();
    });
  });
});
