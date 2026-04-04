import { expect, test } from "bun:test";

import blitzpressPlugin, { externalImports } from "./index";

async function resolveConfig() {
  const plugin = blitzpressPlugin({ pluginId: "example-plugin" });
  const hook = plugin.config;

  if (typeof hook === "function") {
    return (await hook({}, { command: "build", mode: "production" })) ?? {};
  }

  return (await hook?.handler?.({}, { command: "build", mode: "production" })) ?? {};
}

test("configures externals and es module output", async () => {
  const config = await resolveConfig();
  const build = config.build as Exclude<typeof config.build, undefined>;
  const lib = typeof build === "object" && build !== null && "lib" in build ? build.lib : undefined;
  const rollupOptions = typeof build === "object" && build !== null && "rollupOptions" in build ? build.rollupOptions : undefined;

  expect(config).toBeDefined();
  expect(lib && typeof lib === "object" ? lib.formats : undefined).toEqual(["es"]);
  expect(rollupOptions?.external).toEqual(externalImports);
  expect(rollupOptions?.output).toMatchObject({
    format: "es",
    entryFileNames: "assets/index.js",
    chunkFileNames: "assets/chunks/[name].js",
  });
});

test("uses plugin id to set the asset base path", async () => {
  const config = await resolveConfig();
  const build = config.build as Exclude<typeof config.build, undefined>;

  expect(config?.base).toBe("/plugins/example-plugin/assets/");
  expect(typeof build === "object" && build !== null ? build.outDir : undefined).toBe("dist/frontend");
});
