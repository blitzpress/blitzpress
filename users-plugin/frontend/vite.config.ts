import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

import blitzpressPlugin from "@blitzpress/vite-plugin";

export default defineConfig({
  plugins: [
    solidPlugin(),
    blitzpressPlugin({
      pluginId: "users-plugin",
    }),
  ],
});
