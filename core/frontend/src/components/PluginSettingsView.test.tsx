import { afterEach, describe, expect, test } from "bun:test";
import { createComponent } from "solid-js";
import { renderToStringAsync } from "solid-js/web";

import { resetRuntimeForTests } from "../modules/plugin-sdk";
import type { SettingsSchema } from "../plugin-runtime/types";
import PluginSettingsView, { fetchPluginSettings, savePluginSettings } from "./PluginSettingsView";

afterEach(() => {
  resetRuntimeForTests();
});

const baseSchema: SettingsSchema = {
  sections: [
    {
      id: "general",
      title: "General",
      fields: [
        {
          id: "greeting",
          type: "string",
          label: "Greeting",
          default: "Hello",
        },
      ],
    },
  ],
};

describe("PluginSettingsView", () => {
  test("fetchPluginSettings returns schema and values", async () => {
    const payload = {
      schema: baseSchema,
      values: {
        greeting: "Welcome",
      },
    };

    const response = await fetchPluginSettings("example-plugin", async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response).toEqual(payload);
  });

  test("savePluginSettings submits wrapped values and surfaces validation errors", async () => {
    let requestInit: RequestInit | undefined;

    await expect(
      savePluginSettings(
        "example-plugin",
        { mode: "invalid" },
        async (_input, init) => {
          requestInit = init;
          return new Response(
            JSON.stringify({
              error: "settings validation failed",
              fields: {
                mode: "must be one of the allowed options",
              },
            }),
            {
              status: 400,
              statusText: "Bad Request",
              headers: { "Content-Type": "application/json" },
            },
          );
        },
      ),
    ).rejects.toThrow(
      "settings validation failed (mode: must be one of the allowed options)",
    );

    expect(requestInit?.method).toBe("PUT");
    expect(requestInit?.headers).toEqual({ "Content-Type": "application/json" });
    expect(requestInit?.body).toBe(JSON.stringify({ values: { mode: "invalid" } }));
  });

  test("renders the settings page shell while loading plugin settings", async () => {
    const html = await renderToStringAsync(() =>
      createComponent(PluginSettingsView, {
        pluginId: "example-plugin",
        pluginName: "Example Plugin",
        fetch: async () =>
          new Response(
            JSON.stringify({
              schema: baseSchema,
              values: {
                greeting: "Welcome",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
      }),
    );

    expect(html).toContain("Plugin settings");
    expect(html).toContain("Example Plugin");
    expect(html).toContain("Loading plugin settings…");
  });
});
