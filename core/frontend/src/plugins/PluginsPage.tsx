import { A } from "@solidjs/router";
import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { useAdminRuntime } from "../base/app/AdminRuntimeProvider";
import Icon from "../base/icons/Icon";
import { pluginSettingsPath } from "../base/routes/navigation";
import { type AdminPlugin, fetchAdminPlugins, togglePluginEnabled } from "./pluginsApi";

type Filter = "installed" | "active" | "inactive";

export default function PluginsPage() {
  const { loadStatus } = useAdminRuntime();
  const [activeFilter, setActiveFilter] = createSignal<Filter>("installed");
  const [toggling, setToggling] = createSignal<string | null>(null);
  const [plugins, { mutate }] = createResource(fetchAdminPlugins, { initialValue: [] });

  const runtimeSummary = createMemo(() => {
    const status = loadStatus();
    return status.state === "ready" ? status.summary : undefined;
  });

  const filteredPlugins = createMemo(() => {
    const all = plugins() ?? [];
    if (activeFilter() === "active") return all.filter((p) => p.enabled);
    if (activeFilter() === "inactive") return all.filter((p) => !p.enabled);
    return all;
  });

  const activeCount = () => (plugins() ?? []).filter((p) => p.enabled).length;

  const handleToggle = async (plugin: AdminPlugin) => {
    setToggling(plugin.id);
    try {
      const result = await togglePluginEnabled(plugin.id, !plugin.enabled);
      mutate((prev) => (prev ?? []).map((p) => (p.id === plugin.id ? result.plugin : p)));
    } catch (error) {
      console.error("Failed to toggle plugin:", error);
    } finally {
      setToggling(null);
    }
  };

  const registeredPlugin = (id: string) =>
    runtimeState.plugins.find((entry) => entry.manifest.id === id);

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
          Installed <span class="font-normal text-slate-400">({(plugins() ?? []).length})</span>
        </button>
        <button type="button" onClick={() => setActiveFilter("active")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "active" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Active <span class="font-normal text-slate-400">({activeCount()})</span>
        </button>
        <button type="button" onClick={() => setActiveFilter("inactive")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "inactive" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Inactive <span class="font-normal text-slate-400">({(plugins() ?? []).length - activeCount()})</span>
        </button>
      </div>

      <Show when={plugins.loading}>
        <div class="py-12 text-center text-sm text-slate-400">Loading plugins...</div>
      </Show>

      <Show when={plugins.error}>
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load plugins. Please try refreshing the page.
        </div>
      </Show>

      <div class="space-y-3">
        <For each={filteredPlugins()}>
          {(plugin) => {
            const registered = () => registeredPlugin(plugin.id);
            const isToggling = () => toggling() === plugin.id;
            return (
              <div class={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all ${plugin.enabled ? "shadow-slate-200/50" : "opacity-70 shadow-slate-200/30"}`}>
                <div class={`absolute left-0 right-0 top-0 h-1 ${plugin.status === "error" ? "bg-red-500" : plugin.enabled ? "bg-indigo-500" : "bg-slate-200"}`} />
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 flex-1 items-start gap-4">
                    <div class={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${plugin.status === "error" ? "bg-red-50 ring-1 ring-red-500/10" : plugin.enabled ? "bg-indigo-50 ring-1 ring-indigo-500/10" : "bg-slate-100"}`}>
                      <Icon name="puzzle" size={24} class={plugin.status === "error" ? "text-red-500" : plugin.enabled ? "text-blue-600" : "text-slate-400"} />
                    </div>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="font-semibold text-slate-900">{plugin.name}</h3>
                        <span class="text-xs text-slate-400">v{plugin.version}</span>
                        <Show when={plugin.status === "error"}>
                          <span class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-500/20">Error</span>
                        </Show>
                      </div>
                      <Show when={plugin.description}>
                        <p class="mt-1 text-sm text-slate-500">{plugin.description}</p>
                      </Show>
                      <Show when={plugin.errors && plugin.errors.length > 0}>
                        <p class="mt-1 text-xs text-red-600">{plugin.errors![0]}</p>
                      </Show>
                      <div class="mt-3 flex flex-wrap items-center gap-4">
                        <Show when={plugin.author}>
                          <span class="text-xs text-slate-400">By {plugin.author}</span>
                        </Show>
                        <Show when={plugin.enabled}>
                          <A href={pluginSettingsPath(plugin.id)} class="text-xs font-medium text-blue-600 hover:text-blue-700">Settings</A>
                        </Show>
                        <span class="text-xs text-slate-400">Pages: {registered()?.pageIds.length ?? 0}</span>
                        <span class="text-xs text-slate-400">Widgets: {registered()?.widgetIds.length ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isToggling()}
                    onClick={() => handleToggle(plugin)}
                    class={`relative mt-1 flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${isToggling() ? "opacity-50" : ""} ${plugin.enabled ? "bg-indigo-600" : "bg-slate-300"}`}
                  >
                    <span class={`absolute left-[1px] top-[1px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${plugin.enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            );
          }}
        </For>

        <Show when={!plugins.loading && filteredPlugins().length === 0}>
          <div class="py-12 text-center text-sm text-slate-400">
            No {activeFilter() === "installed" ? "" : activeFilter()} plugins found.
          </div>
        </Show>
      </div>
    </div>
  );
}
