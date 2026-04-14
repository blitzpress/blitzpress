import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { staticRoutes } from "../static-routes.mjs";

const outputDir = new URL("../.output/public/", import.meta.url);
const serverBundle = new URL("../dist/server/entry-server.js", import.meta.url);
const host = "127.0.0.1";
const port = Number(process.env.STATIC_EXPORT_PORT || 4173);
const baseUrl = `http://${host}:${port}`;

async function ensureBuildOutput() {
  await stat(serverBundle);
  await stat(outputDir);
}

function createOutputPath(route) {
  if (route === "/") {
    return new URL("index.html", outputDir);
  }

  const normalizedRoute = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return new URL(`${normalizedRoute}/index.html`, outputDir);
}

async function exportRoutes(app) {
  for (const route of staticRoutes) {
    const response = await app.fetch(new Request(`${baseUrl}${route}`));
    if (!response.ok) {
      throw new Error(`Failed to export ${route}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const outputFile = createOutputPath(route);

    await mkdir(dirname(outputFile.pathname), { recursive: true });
    await writeFile(outputFile, html, "utf8");

    console.log(`exported ${route} -> ${outputFile.pathname}`);
  }
}

async function main() {
  await ensureBuildOutput();
  const { default: app } = await import(serverBundle.href);
  await exportRoutes(app);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
