import { describe, expect, mock, test } from "bun:test";

import { loadPlugins } from "./loader";

describe("plugin loader", () => {
  test("reports manifest validation failures for frontend plugins with missing assets", async () => {
    const fetchMock = async () =>
      new Response(
        JSON.stringify({
          plugins: [
            {
              id: "missing-entry",
              name: "Missing Entry",
              version: "1.0.0",
              has_frontend: true,
              frontend_style: "/plugins/missing-entry/assets/index.css",
            },
            {
              id: "missing-style",
              name: "Missing Style",
              version: "1.0.0",
              has_frontend: true,
              frontend_entry: "/plugins/missing-style/assets/index.js",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    const importer = mock(async (_specifier: string) => ({}));
    const appendChild = mock((_node: Node) => undefined);
    const documentRef = {
      head: {
        querySelector: () => null,
        appendChild,
      },
      createElement: () => ({ rel: "", href: "" }),
    } as unknown as Document;

    const summary = await loadPlugins({
      fetch: fetchMock,
      importer,
      document: documentRef,
    });

    expect(summary.loaded).toEqual([]);
    expect(summary.failed).toEqual([
      {
        pluginId: "missing-entry",
        error: "plugin manifest is missing frontend_entry",
      },
      {
        pluginId: "missing-style",
        error: "plugin manifest is missing frontend_style",
      },
    ]);
    expect(importer).not.toHaveBeenCalled();
    expect(appendChild).not.toHaveBeenCalled();
  });

  test("loads a valid frontend plugin and injects its stylesheet", async () => {
    const fetchMock = async () =>
      new Response(
        JSON.stringify({
          plugins: [
            {
              id: "example-plugin",
              name: "Example Plugin",
              version: "1.0.0",
              has_frontend: true,
              frontend_entry: "/plugins/example-plugin/assets/index.js",
              frontend_style: "/plugins/example-plugin/assets/index.css",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    const importer = mock(async (_specifier: string) => ({}));
    const link = { rel: "", href: "" };
    const appendChild = mock((_node: Node) => undefined);
    const documentRef = {
      head: {
        querySelector: () => null,
        appendChild,
      },
      createElement: () => link,
    } as unknown as Document;

    const summary = await loadPlugins({
      fetch: fetchMock,
      importer,
      document: documentRef,
    });

    expect(summary.loaded).toEqual(["example-plugin"]);
    expect(summary.failed).toEqual([]);
    expect(importer).toHaveBeenCalledWith("/plugins/example-plugin/assets/index.js");
    expect(link.rel).toBe("stylesheet");
    expect(link.href).toBe("/plugins/example-plugin/assets/index.css");
    expect(appendChild).toHaveBeenCalledTimes(1);
  });
});
