import type { FrontendRegistrar, PluginManifest } from "@blitzpress/plugin-sdk";

type AdminMenuItem = {
  id: string;
  label: string;
  path: string;
  description?: string;
};

export const examplePluginManifest: PluginManifest = {
  id: "example-plugin",
  name: "Example Plugin",
  version: "0.1.0",
};

export function registerExamplePlugin(registrar: FrontendRegistrar): void {
  registrar.pages.add({
    id: "example-plugin.home",
    path: "/plugins/example-plugin",
    title: "Example Plugin",
    component: () => import("./pages/Home"),
  });

  registrar.hooks.addFilter<AdminMenuItem[]>(
    "admin.menu.items",
    (items) => [
      ...items,
      {
        id: "example-plugin.home",
        label: "Example Plugin",
        path: "/plugins/example-plugin",
        description: "Frontend route registered by the example plugin bundle.",
      },
    ],
    { priority: 20 },
  );
}
