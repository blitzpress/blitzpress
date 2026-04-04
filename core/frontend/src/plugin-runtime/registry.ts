import { createStore } from "solid-js/store";

import { events } from "./events";
import { hooks } from "./hooks";
import type {
  ComponentLoader,
  FieldComponent,
  FrontendRegistrar,
  PluginManifest,
  PluginRuntimeState,
  RegisteredPage,
  RegisteredPlugin,
  RegisteredWidget,
} from "./types";

function createInitialState(): PluginRuntimeState {
  return {
    plugins: [],
    pages: [],
    widgets: [],
    settingsComponents: {},
    fieldComponents: {},
  };
}

export const [runtimeState, setRuntimeState] = createStore<PluginRuntimeState>(
  createInitialState(),
);

function cloneManifest(manifest: PluginManifest): PluginManifest {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
  };
}

function ensureNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required`);
  }

  return normalized;
}

function ensurePath(pathname: string): string {
  const normalized = pathname.trim();
  if (!normalized.startsWith("/")) {
    throw new Error("page path must start with '/'");
  }

  return normalized;
}

function ensureUniqueRegistration(kind: string, id: string, existingIDs: Iterable<string>): void {
  for (const existingID of existingIDs) {
    if (existingID === id) {
      throw new Error(`${kind} '${id}' is already registered`);
    }
  }
}

function validateManifest(manifest: PluginManifest): PluginManifest {
  return {
    id: ensureNonEmpty(manifest.id, "plugin id"),
    name: ensureNonEmpty(manifest.name, "plugin name"),
    version: manifest.version?.trim() || undefined,
  };
}

function registeredPluginRecord(
  manifest: PluginManifest,
  pages: RegisteredPage[],
  widgets: RegisteredWidget[],
): RegisteredPlugin {
  return {
    manifest: cloneManifest(manifest),
    pageIds: pages.map((page) => page.id),
    widgetIds: widgets.map((widget) => widget.id),
  };
}

type BufferedRegistrar = {
  registrar: FrontendRegistrar;
  pages: RegisteredPage[];
  widgets: RegisteredWidget[];
  settingsComponent?: ComponentLoader;
  fieldComponents: Record<string, FieldComponent>;
};

function createBufferedRegistrar(manifest: PluginManifest): BufferedRegistrar {
  const pages: RegisteredPage[] = [];
  const widgets: RegisteredWidget[] = [];
  let settingsComponent: ComponentLoader | undefined;
  const fieldComponents: Record<string, FieldComponent> = {};

  const registrar: FrontendRegistrar = {
    pages: {
      add(page) {
        const normalizedPage: RegisteredPage = {
          id: ensureNonEmpty(page.id, "page id"),
          pluginId: manifest.id,
          path: ensurePath(page.path),
          title: ensureNonEmpty(page.title, "page title"),
          component: page.component,
        };

        ensureUniqueRegistration(
          "page",
          normalizedPage.id,
          [...runtimeState.pages.map((item) => item.id), ...pages.map((item) => item.id)],
        );

        pages.push(normalizedPage);
      },
    },
    widgets: {
      add(widget) {
        const normalizedWidget: RegisteredWidget = {
          id: ensureNonEmpty(widget.id, "widget id"),
          pluginId: manifest.id,
          title: ensureNonEmpty(widget.title, "widget title"),
          component: widget.component,
        };

        ensureUniqueRegistration(
          "widget",
          normalizedWidget.id,
          [...runtimeState.widgets.map((item) => item.id), ...widgets.map((item) => item.id)],
        );

        widgets.push(normalizedWidget);
      },
    },
    hooks,
    events,
    settings: {
      setCustomComponent(loader) {
        settingsComponent = loader;
      },
      addFieldComponent(id, component) {
        const normalizedID = ensureNonEmpty(id, "field component id");
        ensureUniqueRegistration(
          "field component",
          normalizedID,
          [...Object.keys(runtimeState.fieldComponents), ...Object.keys(fieldComponents)],
        );
        fieldComponents[normalizedID] = component;
      },
    },
  };

  return {
    registrar,
    pages,
    widgets,
    get settingsComponent() {
      return settingsComponent;
    },
    fieldComponents,
  };
}

export function createRegistrar(manifest: PluginManifest): FrontendRegistrar {
  return createBufferedRegistrar(validateManifest(manifest)).registrar;
}

export function registerPlugin(
  manifest: PluginManifest,
  registerFn: (registrar: FrontendRegistrar) => void,
): void {
  const normalizedManifest = validateManifest(manifest);
  ensureUniqueRegistration(
    "plugin",
    normalizedManifest.id,
    runtimeState.plugins.map((plugin) => plugin.manifest.id),
  );

  const bufferedRegistrar = createBufferedRegistrar(normalizedManifest);
  registerFn(bufferedRegistrar.registrar);

  setRuntimeState("plugins", (plugins) => [
    ...plugins,
    registeredPluginRecord(normalizedManifest, bufferedRegistrar.pages, bufferedRegistrar.widgets),
  ]);
  setRuntimeState("pages", (pages) => [...pages, ...bufferedRegistrar.pages]);
  setRuntimeState("widgets", (widgets) => [...widgets, ...bufferedRegistrar.widgets]);

  if (bufferedRegistrar.settingsComponent) {
    setRuntimeState("settingsComponents", normalizedManifest.id, () => bufferedRegistrar.settingsComponent!);
  }

  for (const [componentID, component] of Object.entries(bufferedRegistrar.fieldComponents)) {
    setRuntimeState("fieldComponents", componentID, () => component);
  }
}

export function getRuntimeSnapshot(): PluginRuntimeState {
  return {
    plugins: runtimeState.plugins.map((plugin) => ({
      manifest: cloneManifest(plugin.manifest),
      pageIds: [...plugin.pageIds],
      widgetIds: [...plugin.widgetIds],
    })),
    pages: runtimeState.pages.map((page) => ({ ...page })),
    widgets: runtimeState.widgets.map((widget) => ({ ...widget })),
    settingsComponents: { ...runtimeState.settingsComponents },
    fieldComponents: { ...runtimeState.fieldComponents },
  };
}

export function resetRuntimeForTests(): void {
  setRuntimeState(() => createInitialState());
  hooks.reset();
  events.reset();
}
