import { describe, expect, test } from "bun:test";

import { groupCapabilities, parseCapabilitySlug, roleGroupLabels } from "./roleUtils";

describe("role capability helpers", () => {
  test("groups local capabilities by the first dot", () => {
    const groups = groupCapabilities([
      { slug: "plugins.download" },
      { slug: "plugins.activate" },
      { slug: "users.manage" },
    ]);

    expect(groups.map((group) => group.key)).toEqual(["plugins", "users"]);
    expect(groups[0]?.capabilities.map((capability) => capability.slug)).toEqual([
      "plugins.activate",
      "plugins.download",
    ]);
  });

  test("keeps provider-qualified plugin names in the group key", () => {
    expect(parseCapabilitySlug("vendor-corporation/ecommerce-plugin:products.edit")).toEqual({
      groupKey: "vendor-corporation/ecommerce-plugin:products",
      provider: "vendor-corporation/ecommerce-plugin",
      moduleName: "products",
      action: "edit",
    });
  });

  test("summarizes role group labels", () => {
    expect(roleGroupLabels([
      "vendor-corporation/ecommerce-plugin:products.edit",
      "plugins.activate",
      "plugins.settings",
    ])).toEqual(["Plugins", "Products"]);
  });
});
