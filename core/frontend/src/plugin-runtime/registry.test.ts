import { afterEach, describe, expect, test } from "bun:test";
import type { Component } from "solid-js";
import type { FieldComponentProps, SettingsComponentProps } from "./types";

import {
  getRuntimeSnapshot,
  registerPlugin,
  resetRuntimeForTests,
  runtimeState,
} from "../modules/plugin-sdk";

afterEach(() => {
  resetRuntimeForTests();
});

describe("frontend plugin registry", () => {
  test("registers plugin pages, widgets, and settings components", () => {
    const DummyComponent: Component = () => null;
    const DummySettingsComponent: Component<SettingsComponentProps> = () => null;
    const DummyFieldComponent: Component<FieldComponentProps> = () => null;

    registerPlugin(
      {
        id: "example-plugin",
        name: "Example Plugin",
        version: "1.0.0",
      },
      (registrar) => {
        registrar.pages.add({
          id: "example-plugin.home",
          path: "/plugins/example-plugin",
          title: "Example Plugin",
          component: async () => ({ default: DummyComponent }),
        });

        registrar.widgets.add({
          id: "example-plugin.summary",
          title: "Example Summary",
          component: async () => ({ default: DummyComponent }),
        });

        registrar.settings.setCustomComponent(async () => ({ default: DummySettingsComponent }));
        registrar.settings.addFieldComponent("example-plugin.color", DummyFieldComponent);
      },
    );

    const snapshot = getRuntimeSnapshot();

    expect(snapshot.plugins).toHaveLength(1);
    expect(snapshot.plugins[0]).toEqual({
      manifest: {
        id: "example-plugin",
        name: "Example Plugin",
        version: "1.0.0",
      },
      pageIds: ["example-plugin.home"],
      widgetIds: ["example-plugin.summary"],
    });
    expect(snapshot.pages[0]?.pluginId).toBe("example-plugin");
    expect(snapshot.widgets[0]?.pluginId).toBe("example-plugin");
    expect(typeof snapshot.settingsComponents["example-plugin"]).toBe("function");
    expect(typeof snapshot.fieldComponents["example-plugin.color"]).toBe("function");
    expect(runtimeState.pages).toHaveLength(1);
  });

  test("rejects duplicate plugin registrations", () => {
    registerPlugin(
      {
        id: "example-plugin",
        name: "Example Plugin",
      },
      () => {},
    );

    expect(() =>
      registerPlugin(
        {
          id: "example-plugin",
          name: "Example Plugin",
        },
        () => {},
      ),
    ).toThrow("plugin 'example-plugin' is already registered");
  });
});
