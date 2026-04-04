import { registerPlugin } from '@blitzpress/plugin-sdk';

const examplePluginManifest = {
  id: "example-plugin",
  name: "Example Plugin",
  version: "0.1.0"
};
function registerExamplePlugin(registrar) {
  registrar.pages.add({
    id: "example-plugin.home",
    path: "/plugins/example-plugin",
    title: "Example Plugin",
    component: () => import('./chunks/Home.js')
  });
  registrar.hooks.addFilter(
    "admin.menu.items",
    (items) => [
      ...items,
      {
        id: "example-plugin.home",
        label: "Example Plugin",
        path: "/plugins/example-plugin",
        description: "Frontend route registered by the example plugin bundle."
      }
    ],
    { priority: 20 }
  );
}

registerPlugin(examplePluginManifest, registerExamplePlugin);
