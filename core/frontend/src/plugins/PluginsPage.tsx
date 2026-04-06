import { A } from "@solidjs/router";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { useAdminRuntime } from "../base/app/AdminRuntimeProvider";
import Icon from "../base/icons/Icon";
import { pluginSettingsPath } from "../base/routes/navigation";

type Filter = "installed" | "active" | "inactive";

interface PluginCard {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  hasUpdate: boolean;
  settingsPath?: string;
  pageCount?: number;
  widgetCount?: number;
}

const samplePlugins: PluginCard[] = [
  {
    id: "seo-optimizer",
    name: "SEO Optimizer",
    description: "Comprehensive SEO tools including meta tags, sitemaps, and search engine optimization recommendations.",
    version: "2.1.0",
    author: "BlitzPress Team",
    enabled: true,
    hasUpdate: false,
  },
  {
    id: "contact-forms",
    name: "Contact Forms",
    description: "Drag-and-drop form builder with email notifications, spam protection, and submission management.",
    version: "1.5.3",
    author: "BlitzPress Team",
    enabled: true,
    hasUpdate: true,
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Privacy-focused analytics with visitor tracking, page views, and custom event monitoring.",
    version: "3.0.1",
    author: "Community",
    enabled: false,
    hasUpdate: false,
  },
];

const pluginMeta: Record<string, { description: string; author: string; hasUpdate?: boolean }> = {
  "example-plugin": {
    description: "Reference plugin frontend loaded through the BlitzPress runtime registry.",
    author: "BlitzPress Team",
  },
};

export default function PluginsPage() {
  const { discoveredPlugins, loadStatus } = useAdminRuntime();
  const [activeFilter, setActiveFilter] = createSignal<Filter>("installed");
  const [pluginStates, setPluginStates] = createSignal<Record<string, boolean>>({});

  const runtimeSummary = createMemo(() => {
    const status = loadStatus();
    return status.state === "ready" ? status.summary : undefined;
  });

  const runtimePlugins = createMemo<PluginCard[]>(() =>
    discoveredPlugins().map((plugin) => {
      const meta = pluginMeta[plugin.id];
      const registered = runtimeState.plugins.find((entry) => entry.manifest.id === plugin.id);
      return {
        id: plugin.id,
        name: plugin.name,
        description: meta?.description ?? `${plugin.name} is available to the new admin shell through the plugin runtime.`,
        version: plugin.version,
        author: meta?.author ?? "Plugin author",
        enabled: true,
        hasUpdate: meta?.hasUpdate ?? false,
        settingsPath: pluginSettingsPath(plugin.id),
        pageCount: registered?.pageIds.length ?? 0,
        widgetCount: registered?.widgetIds.length ?? 0,
      };
    }),
  );

  const visiblePlugins = createMemo<PluginCard[]>(() =>
    runtimePlugins().length > 0 ? runtimePlugins() : samplePlugins,
  );

  createEffect(() => {
    const nextState = { ...pluginStates() };
    for (const plugin of visiblePlugins()) {
      if (nextState[plugin.id] === undefined) {
        nextState[plugin.id] = plugin.enabled;
      }
    }
    setPluginStates(nextState);
  });

  const filteredPlugins = createMemo(() =>
    visiblePlugins().filter((plugin) => {
      const isActive = pluginStates()[plugin.id] ?? plugin.enabled;
      if (activeFilter() === "active") {
        return isActive;
      }
      if (activeFilter() === "inactive") {
        return !isActive;
      }
      return true;
    }),
  );

  const activeCount = () => visiblePlugins().filter((plugin) => pluginStates()[plugin.id] ?? plugin.enabled).length;

  const togglePlugin = (id: string) => {
    setPluginStates((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div class="space-y-6">
      <Show when={loadStatus().state === "ready"}>
        <div class="rounded-2xl border border-slate-200/60 bg-white px-5 py-4 shadow-sm shadow-slate-200/50">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">Plugin runtime status</h3>
              <p class="mt-1 text-sm text-slate-500">
                Discovered {runtimeSummary()?.discovered ?? 0} plugin frontend(s) and loaded {runtimeSummary()?.loaded.length ?? 0} bundle(s).
              </p>
            </div>
            <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-500/20">
              {runtimeState.pages.length} page{runtimeState.pages.length === 1 ? "" : "s"} · {runtimeState.widgets.length} widget{runtimeState.widgets.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </Show>

      <div class="flex items-center justify-between">
        <div />
        <button class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]">
          <Icon name="plus" size={16} />
          Install Plugin
        </button>
      </div>

      <div class="flex items-center gap-1 border-b border-slate-200">
        <button type="button" onClick={() => setActiveFilter("installed")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "installed" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Installed <span class="font-normal text-slate-400">({visiblePlugins().length})</span>
        </button>
        <button type="button" onClick={() => setActiveFilter("active")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "active" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Active <span class="font-normal text-slate-400">({activeCount()})</span>
        </button>
        <button type="button" onClick={() => setActiveFilter("inactive")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "inactive" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Inactive <span class="font-normal text-slate-400">({visiblePlugins().length - activeCount()})</span>
        </button>
      </div>

      <div class="space-y-3">
        <For each={filteredPlugins()}>
          {(plugin) => {
            const isActive = () => pluginStates()[plugin.id] ?? plugin.enabled;
            return (
              <div class={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all ${isActive() ? "shadow-slate-200/50" : "opacity-70 shadow-slate-200/30"}`}>
                <div class={`absolute left-0 right-0 top-0 h-1 ${isActive() ? "bg-indigo-500" : "bg-slate-200"}`} />
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 flex-1 items-start gap-4">
                    <div class={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${isActive() ? "bg-indigo-50 ring-1 ring-indigo-500/10" : "bg-slate-100"}`}>
                      <Icon name="puzzle" size={24} class={isActive() ? "text-blue-600" : "text-slate-400"} />
                    </div>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="font-semibold text-slate-900">{plugin.name}</h3>
                        <span class="text-xs text-slate-400">v{plugin.version}</span>
                        <Show when={plugin.hasUpdate}>
                          <span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20">Update available</span>
                        </Show>
                      </div>
                      <p class="mt-1 text-sm text-slate-500">{plugin.description}</p>
                      <div class="mt-3 flex flex-wrap items-center gap-4">
                        <span class="text-xs text-slate-400">By {plugin.author}</span>
                        <Show when={plugin.settingsPath}>
                          {(settingsPath) => (
                            <A href={settingsPath()} class="text-xs font-medium text-blue-600 hover:text-blue-700">Settings</A>
                          )}
                        </Show>
                        <span class="text-xs text-slate-400">Pages: {plugin.pageCount ?? 0}</span>
                        <span class="text-xs text-slate-400">Widgets: {plugin.widgetCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePlugin(plugin.id)}
                    class={`relative mt-1 flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${isActive() ? "bg-indigo-600" : "bg-slate-300"}`}
                  >
                    <span class={`absolute left-[1px] top-[1px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${isActive() ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
