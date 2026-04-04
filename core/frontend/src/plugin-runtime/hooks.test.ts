import { describe, expect, test } from "bun:test";

import { createHookEngine } from "./hooks";

describe("frontend hook engine", () => {
  test("runs actions by priority and registration order", () => {
    const hookEngine = createHookEngine();
    const calls: string[] = [];

    hookEngine.addAction("core.ready", () => calls.push("default"));
    hookEngine.addAction("core.ready", () => calls.push("first"), { priority: 1 });
    hookEngine.addAction("core.ready", () => calls.push("second-a"), { priority: 5 });
    hookEngine.addAction("core.ready", () => calls.push("second-b"), { priority: 5 });

    hookEngine.doAction("core.ready");

    expect(calls).toEqual(["first", "second-a", "second-b", "default"]);
  });

  test("chains filter values and supports removal", () => {
    const hookEngine = createHookEngine();

    hookEngine.addFilter("admin.menu.items", (items: string[]) => [...items, "plugins"]);
    const removable = hookEngine.addFilter(
      "admin.menu.items",
      (items: string[]) => items.map((item) => item.toUpperCase()),
      { priority: 1 },
    );

    expect(hookEngine.removeFilter("admin.menu.items", removable)).toBeTrue();
    expect(hookEngine.removeFilter("admin.menu.items", removable)).toBeFalse();

    const items = hookEngine.applyFilters("admin.menu.items", ["dashboard"]);
    expect(items).toEqual(["dashboard", "plugins"]);
  });
});
