import { afterEach, describe, expect, test } from "bun:test";
import { createComponent, type Component } from "solid-js";
import { renderToString } from "solid-js/web";

import { registerPlugin, resetRuntimeForTests } from "../modules/plugin-sdk";
import type { FieldComponentProps, SettingsComponentProps, SettingsSchema } from "../plugin-runtime/types";
import SettingsForm, { CustomSettingsOverride } from "./SettingsForm";

afterEach(() => {
  resetRuntimeForTests();
});

const baseSchema: SettingsSchema = {
  sections: [
    {
      id: "general",
      title: "General settings",
      fields: [
        {
          id: "title",
          type: "string",
          label: "Site title",
          default: "BlitzPress",
        },
        {
          id: "description",
          type: "text",
          label: "Description",
        },
        {
          id: "itemsPerPage",
          type: "number",
          label: "Items per page",
          min: 1,
          max: 20,
        },
        {
          id: "enabled",
          type: "boolean",
          label: "Enabled",
        },
        {
          id: "mode",
          type: "select",
          label: "Mode",
          options: [
            { value: "basic", label: "Basic" },
            { value: "advanced", label: "Advanced" },
          ],
        },
        {
          id: "accent",
          type: "color",
          label: "Accent",
        },
        {
          id: "homepage",
          type: "url",
          label: "Homepage",
        },
        {
          id: "supportEmail",
          type: "email",
          label: "Support email",
        },
      ],
    },
  ],
};

describe("SettingsForm", () => {
  test("renders built-in settings field types", () => {
    const html = renderToString(() =>
      createComponent(SettingsForm, {
        pluginId: "example-plugin",
        schema: baseSchema,
        values: {
          description: "Configurable plugin settings",
          itemsPerPage: 12,
          enabled: true,
          mode: "advanced",
          accent: "#ff00aa",
          homepage: "https://example.com",
          supportEmail: "support@example.com",
        },
        onSave: async () => {},
      }),
    );

    expect(html).toContain("Site title");
    expect(html).toContain("Description");
    expect(html).toContain('textarea');
    expect(html).toContain('type="number"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
    expect(html).toContain("<select");
    expect(html).toContain('type="color"');
    expect(html).toContain('type="url"');
    expect(html).toContain('type="email"');
    expect(html).toContain("Save settings");
  });

  test("renders registered custom field components inside the generated form", () => {
    let receivedProps: FieldComponentProps<string> | undefined;
    const CustomField: Component<FieldComponentProps<string>> = (props) => {
      receivedProps = props;
      return `custom-field:${props.value}`;
    };

    registerPlugin(
      {
        id: "example-plugin",
        name: "Example Plugin",
      },
      (registrar) => {
        registrar.settings.addFieldComponent("example-plugin.custom-field", CustomField);
      },
    );

    const html = renderToString(() =>
      createComponent(SettingsForm, {
        pluginId: "example-plugin",
        schema: {
          sections: [
            {
              id: "appearance",
              title: "Appearance",
              fields: [
                {
                  id: "theme",
                  type: "custom",
                  label: "Theme picker",
                  component: "example-plugin.custom-field",
                },
              ],
            },
          ],
        },
        values: { theme: "midnight" },
        onSave: async () => {},
      }),
    );

    expect(html).toContain("custom-field:midnight");
    expect(receivedProps?.value).toBe("midnight");
    expect(typeof receivedProps?.onChange).toBe("function");
  });

  test("renders the custom settings loading state when a plugin registers an override component", () => {
    const CustomSettingsComponent: Component<SettingsComponentProps> = () => null;
    registerPlugin(
      {
        id: "example-plugin",
        name: "Example Plugin",
      },
      (registrar) => {
        registrar.settings.setCustomComponent(async () => ({ default: CustomSettingsComponent }));
      },
    );

    const html = renderToString(() =>
      createComponent(SettingsForm, {
        pluginId: "example-plugin",
        schema: baseSchema,
        values: {},
        onSave: async () => {},
      }),
    );

    expect(html).toContain("Loading custom settings component…");
    expect(html).not.toContain("Save settings");
  });

  test("renders the custom settings override component with the expected props", () => {
    let receivedProps: SettingsComponentProps | undefined;
    const CustomSettingsComponent: Component<SettingsComponentProps> = (props) => {
      receivedProps = props;
      return `custom-settings:${String(props.values.title)}`;
    };

    const onSave = async () => {};
    const html = renderToString(() =>
      createComponent(CustomSettingsOverride, {
        component: CustomSettingsComponent,
        values: { title: "Configured" },
        onSave,
      }),
    );

    expect(html).toContain("custom-settings:Configured");
    expect(receivedProps?.values).toEqual({ title: "Configured" });
    expect(receivedProps?.onSave).toBe(onSave);
  });

});
