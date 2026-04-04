import type {
  PluginFrontendDescriptor,
  PluginListResponse,
  PluginLoadSummary,
} from "./types";

export type ModuleImporter = (specifier: string) => Promise<unknown>;
export type PluginFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface PluginLoaderOptions {
  fetch?: PluginFetch;
  importer?: ModuleImporter;
  document?: Document;
}

const defaultImporter: ModuleImporter = (specifier) => import(/* @vite-ignore */ specifier);

function ensureStylesheet(documentRef: Document, href?: string): void {
  if (!href) {
    return;
  }

  if (documentRef.head.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    return;
  }

  const link = documentRef.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  documentRef.head.appendChild(link);
}

async function fetchPluginDescriptors(fetchImpl: PluginFetch): Promise<PluginFrontendDescriptor[]> {
  const response = await fetchImpl("/api/cms/plugins");
  if (!response.ok) {
    throw new Error(`failed to load plugin manifest: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as PluginListResponse;
  return payload.plugins ?? [];
}

export async function loadPlugins(options: PluginLoaderOptions = {}): Promise<PluginLoadSummary> {
  const fetchImpl = options.fetch ?? fetch;
  const importer = options.importer ?? defaultImporter;
  const documentRef = options.document ?? document;
  const descriptors = await fetchPluginDescriptors(fetchImpl);

  const summary: PluginLoadSummary = {
    discovered: descriptors.length,
    loaded: [],
    failed: [],
  };

  for (const descriptor of descriptors) {
    if (!descriptor.has_frontend || !descriptor.frontend_entry) {
      continue;
    }

    ensureStylesheet(documentRef, descriptor.frontend_style);

    try {
      await importer(descriptor.frontend_entry);
      summary.loaded.push(descriptor.id);
    } catch (error) {
      summary.failed.push({
        pluginId: descriptor.id,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`failed to load plugin frontend: ${descriptor.id}`, error);
    }
  }

  return summary;
}
