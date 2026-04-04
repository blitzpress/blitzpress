import {
  For,
  Show,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { loadPlugins } from "./plugin-runtime/loader";
import type { PluginLoadSummary, RegisteredPage, RegisteredWidget } from "./plugin-runtime/types";

type LoadStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; summary: PluginLoadSummary }
  | { state: "error"; message: string };

function normalizePath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function createLocationSignal() {
  const [pathname, setPathname] = createSignal(normalizePath(window.location.pathname));

  const sync = () => setPathname(normalizePath(window.location.pathname));

  onMount(() => {
    window.addEventListener("popstate", sync);
  });

  onCleanup(() => {
    window.removeEventListener("popstate", sync);
  });

  const navigate = (nextPath: string) => {
    const normalized = normalizePath(nextPath);
    if (normalized === pathname()) {
      return;
    }

    window.history.pushState({}, "", normalized);
    setPathname(normalized);
  };

  return [pathname, navigate] as const;
}

function WidgetCard(props: { widget: RegisteredWidget }) {
  const [module] = createResource(() => props.widget.id, async () => props.widget.component());

  return (
    <section class="widget-card">
      <header>
        <div>
          <h3>{props.widget.title}</h3>
          <small>{props.widget.pluginId}</small>
        </div>
        <span class="pill">Widget</span>
      </header>
      <Show
        when={module()}
        fallback={<p>Loading widget module…</p>}
      >
        {(loadedModule) => {
          const Widget = loadedModule().default;
          return <Widget />;
        }}
      </Show>
    </section>
  );
}

function PluginPage(props: { page: RegisteredPage }) {
  const [module] = createResource(() => props.page.id, async () => props.page.component());

  return (
    <section class="page-frame panel">
      <header>
        <div>
          <small>Plugin page</small>
          <h2>{props.page.title}</h2>
        </div>
        <span class="pill">{props.page.pluginId}</span>
      </header>
      <Show
        when={module()}
        fallback={<p>Loading page module…</p>}
      >
        {(loadedModule) => {
          const Page = loadedModule().default;
          return <Page />;
        }}
      </Show>
    </section>
  );
}

export default function App() {
  const [pathname, navigate] = createLocationSignal();
  const [loadStatus, setLoadStatus] = createSignal<LoadStatus>({ state: "idle" });

  onMount(async () => {
    setLoadStatus({ state: "loading" });

    try {
      const summary = await loadPlugins();
      setLoadStatus({ state: "ready", summary });
    } catch (error) {
      setLoadStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const pages = createMemo(() => runtimeState.pages);
  const widgets = createMemo(() => runtimeState.widgets);
  const activePage = createMemo(() => pages().find((page) => normalizePath(page.path) === pathname()));

  const activePath = createMemo(() => pathname());

  return (
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <p>Plugin-driven CMS runtime</p>
          <h1>BlitzPress Admin</h1>
          <p>
            SolidJS core frontend that discovers plugin pages, widgets, hooks, and shared frontend modules at runtime.
          </p>
        </div>

        <section class="nav-section">
          <h2>Navigation</h2>
          <a
            class={`nav-link${activePath() === "/" ? " active" : ""}`}
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate("/");
            }}
          >
            Dashboard
          </a>
          <For each={pages()}>
            {(page) => (
              <a
                class={`nav-link${activePath() === normalizePath(page.path) ? " active" : ""}`}
                href={page.path}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(page.path);
                }}
              >
                {page.title}
              </a>
            )}
          </For>
        </section>

        <section class="status-card">
          <h2>Runtime status</h2>
          <Show when={loadStatus().state === "ready"} fallback={<p>Loading plugin frontends…</p>}>
            <p>
              Loaded {(loadStatus() as { state: "ready"; summary: PluginLoadSummary }).summary.loaded.length} frontend bundle(s).
            </p>
          </Show>
          <Show when={loadStatus().state === "error"}>
            <p>{(loadStatus() as { state: "error"; message: string }).message}</p>
          </Show>
          <ul class="status-list">
            <li>{runtimeState.plugins.length} registered plugin runtime(s)</li>
            <li>{pages().length} plugin page(s)</li>
            <li>{widgets().length} dashboard widget(s)</li>
          </ul>
        </section>
      </aside>

      <main class="main-content">
        <Show when={activePage()} fallback={<Dashboard status={loadStatus()} widgets={widgets()} />}>
          {(page) => <PluginPage page={page()} />}
        </Show>
      </main>
    </div>
  );
}

function Dashboard(props: { status: LoadStatus; widgets: RegisteredWidget[] }) {
  return (
    <>
      <section class="hero">
        <p>Core frontend shell</p>
        <h2>Runtime-loaded extensions</h2>
        <p>
          The embedded SolidJS app now exposes frontend hooks, an event bus, plugin registries, and shared ESM modules that plugin frontends can consume without rebuilding the core.
        </p>
      </section>

      <section class="metrics">
        <article class="metric">
          <strong>{runtimeState.plugins.length}</strong>
          <span>Registered plugins</span>
        </article>
        <article class="metric">
          <strong>{runtimeState.pages.length}</strong>
          <span>Plugin pages</span>
        </article>
        <article class="metric">
          <strong>{runtimeState.widgets.length}</strong>
          <span>Dashboard widgets</span>
        </article>
      </section>

      <section class="panel">
        <h2>Extension lifecycle</h2>
        <ol class="extension-list">
          <li>Fetch plugin manifests from <code>/api/cms/plugins</code>.</li>
          <li>Inject plugin stylesheets before each frontend module import.</li>
          <li>Load plugin ES modules through the browser import map.</li>
          <li>Let plugins register pages, widgets, hooks, events, and settings extensions.</li>
        </ol>
      </section>

      <Show when={props.widgets.length > 0} fallback={<EmptyState status={props.status} />}>
        <section class="grid">
          <For each={props.widgets}>{(widget) => <WidgetCard widget={widget} />}</For>
        </section>
      </Show>
    </>
  );
}

function EmptyState(props: { status: LoadStatus }) {
  const failures = () => (props.status.state === "ready" ? props.status.summary.failed : []);

  return (
    <section class="empty-state">
      <h2>No plugin widgets registered yet</h2>
      <p>
        Install a plugin frontend and call <code>registerPlugin()</code> to populate the dashboard with widgets and routes.
      </p>
      <Show when={failures().length > 0}>
        <ul class="status-list">
          <For each={failures()}>
            {(failure) => (
              <li>
                {failure.pluginId}: {failure.error}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
