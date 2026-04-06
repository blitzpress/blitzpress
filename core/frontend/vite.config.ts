import { resolve } from "node:path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

const externalImports = [
  "solid-js",
  "solid-js/web",
  "solid-js/store",
  "@blitzpress/plugin-sdk",
];

function createAppConfig() {
  return defineConfig({
    plugins: [solidPlugin()],
    base: "/",
    server: {
      host: '0.0.0.0',
    },
    build: {
      target: "esnext",
      minify: false,
      sourcemap: false,
      cssCodeSplit: false,
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        external: externalImports,
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/chunks/[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  });
}

function createModulesConfig() {
  return defineConfig({
    plugins: [solidPlugin()],
    build: {
      target: "esnext",
      minify: false,
      sourcemap: false,
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        preserveEntrySignatures: "strict",
        input: {
          "solid-js": resolve(__dirname, "src/modules/solid-js.ts"),
          "solid-js-web": resolve(__dirname, "src/modules/solid-js-web.ts"),
          "solid-js-store": resolve(__dirname, "src/modules/solid-js-store.ts"),
          "plugin-sdk": resolve(__dirname, "src/modules/plugin-sdk.ts"),
        },
        output: {
          format: "es",
          entryFileNames: "modules/[name].js",
          chunkFileNames: "modules/chunks/[name].js",
          assetFileNames: "modules/assets/[name][extname]",
          manualChunks(id) {
            if (id.includes("/node_modules/solid-js/")) {
              return "solid-shared";
            }

            if (id.includes("/src/plugin-runtime/")) {
              return "plugin-runtime";
            }

            return undefined;
          },
        },
      },
    },
  });
}

export default defineConfig(({ mode }) => {
  if (mode === "modules") {
    return createModulesConfig();
  }

  return createAppConfig();
});
