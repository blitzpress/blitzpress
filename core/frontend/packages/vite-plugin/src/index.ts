import type { Plugin, UserConfig } from "vite";

export interface BlitzPressVitePluginOptions {
  pluginId: string;
}

const externalImports = [
  "solid-js",
  "solid-js/web",
  "solid-js/store",
  "@blitzpress/plugin-sdk",
];

function normalizePluginId(pluginId: string): string {
  const normalized = pluginId.trim();
  if (!normalized) {
    throw new Error("pluginId is required");
  }

  return normalized;
}

export default function blitzpressPlugin(opts: BlitzPressVitePluginOptions): Plugin {
  const pluginId = normalizePluginId(opts.pluginId);
  const assetBase = `/plugins/${pluginId}/assets/`;

  return {
    name: "blitzpress-plugin",
    config(): UserConfig {
      return {
        base: assetBase,
        build: {
          target: "esnext",
          minify: false,
          sourcemap: false,
          cssCodeSplit: false,
          outDir: "dist/frontend",
          emptyOutDir: true,
          lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: () => "assets/index.js",
          },
          rollupOptions: {
            external: externalImports,
            output: {
              format: "es",
              entryFileNames: "assets/index.js",
              chunkFileNames: "assets/chunks/[name].js",
              assetFileNames: (assetInfo) => {
                if (assetInfo.name?.endsWith(".css")) {
                  return "assets/index.css";
                }

                return "assets/[name][extname]";
              },
            },
          },
        },
      };
    },
  };
}

export { externalImports };
