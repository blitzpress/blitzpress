import { c as createStore } from './solid-shared.js';

class FrontendEventBusImpl {
  subscriptions = /* @__PURE__ */ new Map();
  nextID = 0;
  publish(name, payload) {
    const event = {
      name,
      payload,
      timestamp: Date.now()
    };
    for (const subscription of this.subscriptions.get(name) ?? []) {
      queueMicrotask(() => {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error(`frontend event handler failed: ${name}`, error);
        }
      });
    }
  }
  subscribe(name, handler) {
    const entry = {
      id: `event-${++this.nextID}`,
      name,
      handler
    };
    this.subscriptions.set(name, [...this.subscriptions.get(name) ?? [], entry]);
    return entry.id;
  }
  unsubscribe(id) {
    for (const [name, subscriptions] of this.subscriptions.entries()) {
      const nextSubscriptions = subscriptions.filter((subscription) => subscription.id !== id);
      if (nextSubscriptions.length === subscriptions.length) {
        continue;
      }
      if (nextSubscriptions.length === 0) {
        this.subscriptions.delete(name);
      } else {
        this.subscriptions.set(name, nextSubscriptions);
      }
      return true;
    }
    return false;
  }
  reset() {
    this.subscriptions.clear();
    this.nextID = 0;
  }
}
function createEventBus() {
  return new FrontendEventBusImpl();
}
const events = createEventBus();

const defaultPriority = 10;
function normalizePriority(opts) {
  if (typeof opts?.priority === "number" && Number.isFinite(opts.priority)) {
    return opts.priority;
  }
  return defaultPriority;
}
function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }
    return left.order - right.order;
  });
}
class FrontendHookEngineImpl {
  actions = /* @__PURE__ */ new Map();
  filters = /* @__PURE__ */ new Map();
  nextID = 0;
  nextOrder = 0;
  addAction(name, fn, opts) {
    const entry = {
      id: this.createID("action"),
      priority: normalizePriority(opts),
      order: this.nextOrder++,
      fn
    };
    this.actions.set(name, sortEntries([...this.actions.get(name) ?? [], entry]));
    return entry.id;
  }
  addFilter(name, fn, opts) {
    const entry = {
      id: this.createID("filter"),
      priority: normalizePriority(opts),
      order: this.nextOrder++,
      fn
    };
    this.filters.set(name, sortEntries([...this.filters.get(name) ?? [], entry]));
    return entry.id;
  }
  doAction(name, ...args) {
    for (const entry of this.actions.get(name) ?? []) {
      try {
        entry.fn(...args);
      } catch (error) {
        console.error(`frontend action hook failed: ${name}`, error);
      }
    }
  }
  applyFilters(name, value, ...args) {
    let nextValue = value;
    for (const entry of this.filters.get(name) ?? []) {
      try {
        nextValue = entry.fn(nextValue, ...args);
      } catch (error) {
        console.error(`frontend filter hook failed: ${name}`, error);
      }
    }
    return nextValue;
  }
  removeAction(name, id) {
    return this.removeEntry(this.actions, name, id);
  }
  removeFilter(name, id) {
    return this.removeEntry(this.filters, name, id);
  }
  reset() {
    this.actions.clear();
    this.filters.clear();
    this.nextID = 0;
    this.nextOrder = 0;
  }
  createID(prefix) {
    this.nextID += 1;
    return `${prefix}-${this.nextID}`;
  }
  removeEntry(collection, name, id) {
    const entries = collection.get(name);
    if (!entries) {
      return false;
    }
    const nextEntries = entries.filter((entry) => entry.id !== id);
    if (nextEntries.length === entries.length) {
      return false;
    }
    if (nextEntries.length === 0) {
      collection.delete(name);
      return true;
    }
    collection.set(name, nextEntries);
    return true;
  }
}
function createHookEngine() {
  return new FrontendHookEngineImpl();
}
const hooks = createHookEngine();

function createInitialState() {
  return {
    plugins: [],
    pages: [],
    widgets: [],
    settingsComponents: {},
    fieldComponents: {}
  };
}
const [runtimeState, setRuntimeState] = createStore(
  createInitialState()
);
function cloneManifest(manifest) {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version
  };
}
function ensureNonEmpty(value, label) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required`);
  }
  return normalized;
}
function ensurePath(pathname) {
  const normalized = pathname.trim();
  if (!normalized.startsWith("/")) {
    throw new Error("page path must start with '/'");
  }
  return normalized;
}
function ensureUniqueRegistration(kind, id, existingIDs) {
  for (const existingID of existingIDs) {
    if (existingID === id) {
      throw new Error(`${kind} '${id}' is already registered`);
    }
  }
}
function validateManifest(manifest) {
  return {
    id: ensureNonEmpty(manifest.id, "plugin id"),
    name: ensureNonEmpty(manifest.name, "plugin name"),
    version: manifest.version?.trim() || void 0
  };
}
function registeredPluginRecord(manifest, pages, widgets) {
  return {
    manifest: cloneManifest(manifest),
    pageIds: pages.map((page) => page.id),
    widgetIds: widgets.map((widget) => widget.id)
  };
}
function createBufferedRegistrar(manifest) {
  const pages = [];
  const widgets = [];
  let settingsComponent;
  const fieldComponents = {};
  const registrar = {
    pages: {
      add(page) {
        const normalizedPage = {
          id: ensureNonEmpty(page.id, "page id"),
          pluginId: manifest.id,
          path: ensurePath(page.path),
          title: ensureNonEmpty(page.title, "page title"),
          component: page.component
        };
        ensureUniqueRegistration(
          "page",
          normalizedPage.id,
          [...runtimeState.pages.map((item) => item.id), ...pages.map((item) => item.id)]
        );
        pages.push(normalizedPage);
      }
    },
    widgets: {
      add(widget) {
        const normalizedWidget = {
          id: ensureNonEmpty(widget.id, "widget id"),
          pluginId: manifest.id,
          title: ensureNonEmpty(widget.title, "widget title"),
          component: widget.component
        };
        ensureUniqueRegistration(
          "widget",
          normalizedWidget.id,
          [...runtimeState.widgets.map((item) => item.id), ...widgets.map((item) => item.id)]
        );
        widgets.push(normalizedWidget);
      }
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
          [...Object.keys(runtimeState.fieldComponents), ...Object.keys(fieldComponents)]
        );
        fieldComponents[normalizedID] = component;
      }
    }
  };
  return {
    registrar,
    pages,
    widgets,
    get settingsComponent() {
      return settingsComponent;
    },
    fieldComponents
  };
}
function createRegistrar(manifest) {
  return createBufferedRegistrar(validateManifest(manifest)).registrar;
}
function registerPlugin(manifest, registerFn) {
  const normalizedManifest = validateManifest(manifest);
  ensureUniqueRegistration(
    "plugin",
    normalizedManifest.id,
    runtimeState.plugins.map((plugin) => plugin.manifest.id)
  );
  const bufferedRegistrar = createBufferedRegistrar(normalizedManifest);
  registerFn(bufferedRegistrar.registrar);
  setRuntimeState("plugins", (plugins) => [
    ...plugins,
    registeredPluginRecord(normalizedManifest, bufferedRegistrar.pages, bufferedRegistrar.widgets)
  ]);
  setRuntimeState("pages", (pages) => [...pages, ...bufferedRegistrar.pages]);
  setRuntimeState("widgets", (widgets) => [...widgets, ...bufferedRegistrar.widgets]);
  if (bufferedRegistrar.settingsComponent) {
    setRuntimeState("settingsComponents", normalizedManifest.id, () => bufferedRegistrar.settingsComponent);
  }
  for (const [componentID, component] of Object.entries(bufferedRegistrar.fieldComponents)) {
    setRuntimeState("fieldComponents", componentID, () => component);
  }
}
function getRuntimeSnapshot() {
  return {
    plugins: runtimeState.plugins.map((plugin) => ({
      manifest: cloneManifest(plugin.manifest),
      pageIds: [...plugin.pageIds],
      widgetIds: [...plugin.widgetIds]
    })),
    pages: runtimeState.pages.map((page) => ({ ...page })),
    widgets: runtimeState.widgets.map((widget) => ({ ...widget })),
    settingsComponents: { ...runtimeState.settingsComponents },
    fieldComponents: { ...runtimeState.fieldComponents }
  };
}
function resetRuntimeForTests() {
  setRuntimeState(() => createInitialState());
  hooks.reset();
  events.reset();
}

export { createHookEngine as a, createRegistrar as b, createEventBus as c, resetRuntimeForTests as d, events as e, runtimeState as f, getRuntimeSnapshot as g, hooks as h, registerPlugin as r };
