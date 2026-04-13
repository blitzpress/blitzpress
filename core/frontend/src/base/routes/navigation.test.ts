import { describe, expect, test } from "bun:test";
import type { Component } from "solid-js";

import { getPageTitle, hasRouteParams, matchPluginPage, matchPathPattern } from "./navigation";
import type { RegisteredPage } from "../../plugin-runtime/types";

const DummyPage: Component = () => null;
const loadDummyPage = async () => ({ default: DummyPage });

function page(path: string, title = path): RegisteredPage {
  return {
    id: `test${path}`,
    pluginId: "test-plugin",
    path,
    title,
    component: loadDummyPage,
  };
}

describe("plugin route matching", () => {
  test("matches path params", () => {
    expect(matchPathPattern("/roles/:id", "/roles/administrator")).toEqual({
      id: "administrator",
    });
  });

  test("exact plugin pages win before parameterized pages", () => {
    const match = matchPluginPage("/roles/new", [
      page("/roles/:id", "Role"),
      page("/roles/new", "New Role"),
    ]);

    expect(match?.page.title).toBe("New Role");
    expect(match?.routeParams).toEqual({});
  });

  test("matches parameterized plugin pages", () => {
    const match = matchPluginPage("/roles/administrator", [page("/roles/:id", "Role")]);

    expect(match?.page.title).toBe("Role");
    expect(match?.routeParams).toEqual({ id: "administrator" });
  });

  test("detects parameterized paths for sidebar filtering", () => {
    expect(hasRouteParams("/roles/:id")).toBeTrue();
    expect(hasRouteParams("/roles")).toBeFalse();
  });

  test("uses parameterized plugin page titles", () => {
    expect(getPageTitle("/roles/administrator", [page("/roles/:id", "Role")], [])).toBe("Role");
  });
});
