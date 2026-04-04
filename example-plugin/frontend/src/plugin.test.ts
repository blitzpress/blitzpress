import { afterEach, describe, expect, test } from "bun:test";

import {
  getRuntimeSnapshot,
  hooks,
  registerPlugin,
  resetRuntimeForTests,
} from "@blitzpress/plugin-sdk";

import {
  examplePluginManifest,
  registerExamplePlugin,
} from "./plugin";

type AdminMenuItem = {
  id: string;
  label: string;
  path: string;
  description?: string;
};

afterEach(() => {
  resetRuntimeForTests();
});

describe("example plugin frontend", () => {
  test("registers its page and frontend menu filter", () => {
    registerPlugin(examplePluginManifest, registerExamplePlugin);

    const snapshot = getRuntimeSnapshot();
    expect(snapshot.plugins).toHaveLength(1);
    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.pages[0]).toMatchObject({
      id: "example-plugin.home",
      pluginId: "example-plugin",
      path: "/plugins/example-plugin",
      title: "Example Plugin",
    });

    const menuItems = hooks.applyFilters<AdminMenuItem[]>("admin.menu.items", [
      { id: "dashboard", label: "Dashboard", path: "/" },
    ]);

    expect(menuItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "example-plugin.home",
          path: "/plugins/example-plugin",
        }),
      ]),
    );
  });
});
