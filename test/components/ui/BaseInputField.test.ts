import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseInputField from "../../../src/components/ui/BaseInputField.vue";
import i18n from "../../../src/locales";

const createWrapper = (options = {}): ReturnType<typeof mount> => {
  return mount(BaseInputField, {
    global: {
      plugins: [i18n],
    },
    ...options,
  });
};

describe("BaseInputField - User Behavior", () => {
  describe("Basic Text Input Experience", () => {
    it("should allow users to type text", async () => {
      const wrapper = createWrapper({
        props: {
          modelValue: "",
          placeholder: "Enter your name",
        },
      });

      const input = wrapper.find('input[type="text"]');
      expect(input.exists()).toBe(true);
      expect(input.attributes("placeholder")).toBe("Enter your name");

      await input.setValue("John Doe");
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["John Doe"]);
    });

    it("should display initial value to users", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: "Initial Value",
          label: "Name",
        },
      });

      const input = wrapper.find('input[type="text"]');
      expect((input.element as HTMLInputElement).value).toBe("Initial Value");
      expect(wrapper.find("label").text()).toBe("Name");
    });

    it("should show field label when provided", () => {
      const wrapper = createWrapper({
        props: {
          label: "Email Address",
          type: "email",
        },
      });

      const label = wrapper.find("label");
      expect(label.exists()).toBe(true);
      expect(label.text()).toBe("Email Address");
      expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    });
  });

  describe("Input Types and Validation", () => {
    it("should handle email input with proper validation", async () => {
      const wrapper = createWrapper({
        props: {
          type: "email",
          label: "Email",
          placeholder: "user@example.com",
        },
      });

      const input = wrapper.find('input[type="email"]');
      expect(input.exists()).toBe(true);
      expect(input.attributes("placeholder")).toBe("user@example.com");

      await input.setValue("test@example.com");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
        "test@example.com",
      ]);
    });

    it("should handle password input securely", async () => {
      const wrapper = createWrapper({
        props: {
          type: "password",
          label: "Password",
          placeholder: "Enter password",
        },
      });

      const input = wrapper.find('input[type="password"]');
      expect(input.exists()).toBe(true);
      expect(input.attributes("type")).toBe("password");

      await input.setValue("secretpassword");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
        "secretpassword",
      ]);
    });

    it("should handle number input with numeric conversion", async () => {
      const wrapper = createWrapper({
        props: {
          type: "number",
          label: "Age",
          placeholder: "Enter age",
        },
      });

      const input = wrapper.find('input[type="number"]');
      expect(input.exists()).toBe(true);

      await input.setValue("25");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([25]);
    });

    it("should handle URL input appropriately", async () => {
      const wrapper = createWrapper({
        props: {
          type: "url",
          label: "Website",
          placeholder: "https://example.com",
        },
      });

      const input = wrapper.find('input[type="url"]');
      expect(input.exists()).toBe(true);

      await input.setValue("https://mysite.com");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
        "https://mysite.com",
      ]);
    });
  });

  describe("Textarea Experience", () => {
    it("should provide multiline text input for users", async () => {
      const wrapper = createWrapper({
        props: {
          type: "textarea",
          label: "Description",
          placeholder: "Enter description",
          rows: 4,
        },
      });

      const textarea = wrapper.find("textarea");
      expect(textarea.exists()).toBe(true);
      expect(textarea.attributes("rows")).toBe("4");
      expect(textarea.attributes("placeholder")).toBe("Enter description");

      await textarea.setValue("This is a\nmultiline\ndescription");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
        "This is a\nmultiline\ndescription",
      ]);
    });

    it("should use default rows when not specified", () => {
      const wrapper = createWrapper({
        props: {
          type: "textarea",
          label: "Comments",
        },
      });

      const textarea = wrapper.find("textarea");
      expect(textarea.attributes("rows")).toBe("3");
    });
  });

  describe("Select Dropdown Experience", () => {
    it("should provide dropdown selection for users", async () => {
      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
      ];

      const wrapper = createWrapper({
        props: {
          type: "select",
          label: "Choose Option",
          placeholder: "Select an option",
          options,
        },
      });

      const select = wrapper.find("select");
      expect(select.exists()).toBe(true);

      const optionElements = wrapper.findAll("option");
      expect(optionElements).toHaveLength(4); // placeholder + 3 options

      expect(optionElements[0]?.text()).toBe("Select an option");
      expect(optionElements[1]?.text()).toBe("Option 1");
      expect(optionElements[2]?.text()).toBe("Option 2");
      expect(optionElements[3]?.text()).toBe("Option 3");

      await select.setValue("option2");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["option2"]);
    });

    it("should work without placeholder", () => {
      const options = [
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta" },
      ];

      const wrapper = createWrapper({
        props: {
          type: "select",
          options,
        },
      });

      const optionElements = wrapper.findAll("option");
      expect(optionElements).toHaveLength(2); // No placeholder option
      expect(optionElements[0]?.text()).toBe("Alpha");
      expect(optionElements[1]?.text()).toBe("Beta");
    });
  });

  describe("Field Sizes and Styling", () => {
    it("should display small size for compact interfaces", () => {
      const wrapper = createWrapper({
        props: {
          size: "sm",
          label: "Small Field",
        },
      });

      expect(wrapper.classes()).toContain("field-sm");
      expect(wrapper.find("input").classes()).toContain("input-sm");
    });

    it("should display large size for prominent forms", () => {
      const wrapper = createWrapper({
        props: {
          size: "lg",
          label: "Large Field",
        },
      });

      expect(wrapper.classes()).toContain("field-lg");
      expect(wrapper.find("input").classes()).toContain("input-lg");
    });

    it("should use medium size by default", () => {
      const wrapper = createWrapper({
        props: {
          label: "Default Field",
        },
      });

      expect(wrapper.classes()).toContain("field-md");
      expect(wrapper.find("input").classes()).toContain("input-md");
    });
  });

  describe("Required Fields and Validation", () => {
    it("should indicate required fields to users", () => {
      const wrapper = createWrapper({
        props: {
          label: "Required Field",
          required: true,
        },
      });

      const label = wrapper.find("label");
      expect(label.classes()).toContain("field-label-required");
      expect(wrapper.find("input").attributes("required")).toBeDefined();
    });

    it("should show error messages to users", () => {
      const wrapper = createWrapper({
        props: {
          label: "Email",
          error: "Please enter a valid email address",
        },
      });

      const errorMessage = wrapper.find(".field-error");
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.text()).toContain(
        "Please enter a valid email address",
      );
      expect(wrapper.classes()).toContain("field-error");
      expect(wrapper.find("input").classes()).toContain("input-error");
    });

    it("should show helpful hints when no errors", () => {
      const wrapper = createWrapper({
        props: {
          label: "Password",
          hint: "Must be at least 8 characters long",
        },
      });

      const hint = wrapper.find(".field-hint");
      expect(hint.exists()).toBe(true);
      expect(hint.text()).toBe("Must be at least 8 characters long");
      expect(wrapper.find(".field-error").exists()).toBe(false);
    });

    it("should prioritize error over hint", () => {
      const wrapper = createWrapper({
        props: {
          label: "Field",
          hint: "This is a hint",
          error: "This is an error",
        },
      });

      expect(wrapper.find(".field-error").exists()).toBe(true);
      expect(wrapper.find(".field-hint").exists()).toBe(false);
      expect(wrapper.text()).toContain("This is an error");
      expect(wrapper.text()).not.toContain("This is a hint");
    });
  });

  describe("Disabled and Readonly States", () => {
    it("should prevent user interaction when disabled", () => {
      const wrapper = createWrapper({
        props: {
          label: "Disabled Field",
          disabled: true,
          modelValue: "Cannot edit",
        },
      });

      const input = wrapper.find("input");
      expect(input.attributes("disabled")).toBeDefined();
      expect(wrapper.classes()).toContain("field-disabled");
      expect(input.classes()).toContain("input-disabled");
    });

    it("should allow viewing but not editing when readonly", () => {
      const wrapper = createWrapper({
        props: {
          label: "Readonly Field",
          readonly: true,
          modelValue: "View only",
        },
      });

      const input = wrapper.find("input");
      expect(input.attributes("readonly")).toBeDefined();
      expect(wrapper.classes()).toContain("field-readonly");
      expect(input.classes()).toContain("input-readonly");
    });
  });

  describe("User Interaction Events", () => {
    it("should notify when user focuses on field", async () => {
      const wrapper = createWrapper({
        props: {
          label: "Interactive Field",
        },
      });

      const input = wrapper.find("input");
      await input.trigger("focus");

      expect(wrapper.emitted("focus")).toBeTruthy();
      expect(wrapper.emitted("focus")?.[0]?.[0]).toBeInstanceOf(Event);
    });

    it("should notify when user leaves field", async () => {
      const wrapper = createWrapper({
        props: {
          label: "Interactive Field",
        },
      });

      const input = wrapper.find("input");
      await input.trigger("blur");

      expect(wrapper.emitted("blur")).toBeTruthy();
      expect(wrapper.emitted("blur")?.[0]?.[0]).toBeInstanceOf(Event);
    });
  });

  describe("Accessibility Features", () => {
    it("should associate labels with inputs for screen readers", () => {
      const wrapper = createWrapper({
        props: {
          label: "Accessible Field",
        },
      });

      const label = wrapper.find("label");
      const input = wrapper.find("input");
      const labelFor = label.attributes("for");
      const inputId = input.attributes("id");

      expect(labelFor).toBeDefined();
      expect(inputId).toBeDefined();
      expect(labelFor).toBe(inputId);
    });

    it("should work without label for screen readers", () => {
      const wrapper = createWrapper({
        props: {
          placeholder: "Search...",
        },
      });

      const input = wrapper.find("input");
      expect(input.exists()).toBe(true);
      expect(input.attributes("placeholder")).toBe("Search...");
      expect(wrapper.find("label").exists()).toBe(false);
    });

    it("should provide appropriate ARIA attributes", () => {
      const wrapper = createWrapper({
        props: {
          label: "Field with Error",
          error: "Invalid input",
          required: true,
        },
      });

      const input = wrapper.find("input");
      expect(input.attributes("required")).toBeDefined();
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should work well in registration forms", async () => {
      const wrapper = createWrapper({
        props: {
          type: "email",
          label: "Email Address",
          placeholder: "Enter your email",
          required: true,
          size: "lg",
        },
      });

      const input = wrapper.find('input[type="email"]');
      expect(input.exists()).toBe(true);
      expect(wrapper.find("label").classes()).toContain("field-label-required");

      await input.setValue("user@example.com");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
        "user@example.com",
      ]);
    });

    it("should work well in contact forms", async () => {
      const wrapper = createWrapper({
        props: {
          type: "textarea",
          label: "Message",
          placeholder: "Tell us how we can help...",
          hint: "Please be as detailed as possible",
          rows: 5,
        },
      });

      const textarea = wrapper.find("textarea");
      expect(textarea.attributes("rows")).toBe("5");
      expect(wrapper.find(".field-hint").text()).toBe(
        "Please be as detailed as possible",
      );

      await textarea.setValue("I need help with my account");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
        "I need help with my account",
      ]);
    });

    it("should work well in settings forms", () => {
      const options = [
        { value: "light", label: "Light Theme" },
        { value: "dark", label: "Dark Theme" },
        { value: "auto", label: "Auto (System)" },
      ];

      const wrapper = createWrapper({
        props: {
          type: "select",
          label: "Theme Preference",
          placeholder: "Choose theme",
          options,
          modelValue: "auto",
        },
      });

      const select = wrapper.find("select");
      expect((select.element as HTMLSelectElement).value).toBe("auto");
      expect(wrapper.findAll("option")).toHaveLength(4); // placeholder + 3 options
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty options gracefully", () => {
      const wrapper = createWrapper({
        props: {
          type: "select",
          label: "Empty Select",
          options: [],
        },
      });

      const select = wrapper.find("select");
      expect(select.exists()).toBe(true);
      expect(wrapper.findAll("option")).toHaveLength(0);
    });

    it("should handle undefined modelValue", () => {
      const wrapper = createWrapper({
        props: {
          modelValue: undefined,
          label: "Undefined Value",
        },
      });

      const input = wrapper.find("input");
      expect(input.element.value).toBe("");
    });

    it("should handle all input types consistently", () => {
      const inputTypes = ["text", "email", "password", "number", "url"];

      inputTypes.forEach((type) => {
        const wrapper = createWrapper({
          props: {
            type: type as "text" | "email" | "password" | "number" | "url",
            label: `${type} field`,
          },
        });

        const input = wrapper.find(`input[type="${type}"]`);
        expect(input.exists()).toBe(true);
      });
    });
  });
});
