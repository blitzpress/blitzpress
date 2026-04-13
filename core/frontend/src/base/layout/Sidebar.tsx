import { A, useLocation } from "@solidjs/router";
import { For, Show, createMemo, type Component } from "solid-js";

import { useAdminRuntime } from "../app/AdminRuntimeProvider";
import Icon from "../icons/Icon";
import { hasRouteParams, isActivePath, navGroups, normalizePath, pluginSettingsPath } from "../routes/navigation";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: Component<SidebarProps> = (props) => {
  const location = useLocation();
  const { discoveredPlugins, pluginPages } = useAdminRuntime();

  const dynamicPluginPages = createMemo(() =>
    pluginPages()
      .filter((page) => !hasRouteParams(page.path))
      .map((page) => ({
        icon: "external-link",
        label: page.title,
        path: page.path,
      })),
  );

  const dynamicPluginSettings = createMemo(() =>
    discoveredPlugins().map((plugin) => ({
      icon: "settings",
      label: `${plugin.name} Settings`,
      path: pluginSettingsPath(plugin.id),
    })),
  );

  const currentPath = () => normalizePath(location.pathname);

  return (
    <aside
      class={`fixed left-0 top-0 z-30 flex h-full flex-col bg-slate-900 transition-all duration-300 ${props.collapsed ? "w-16" : "w-64"}`}
    >
      <div class={`flex h-16 items-center border-b border-white/[0.06] px-4 ${props.collapsed ? "justify-center" : ""}`}>
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
            <Icon name="bolt" size={20} class="text-white" />
          </div>
          <Show when={!props.collapsed}>
            <span class="text-lg font-bold tracking-tight text-white">
              Blitz<span class="text-indigo-400">Press</span>
            </span>
          </Show>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-5">
        <For each={navGroups}>
          {(group) => (
            <div class="mb-6">
              <Show when={!props.collapsed}>
                <div class="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
                  {group.label}
                </div>
              </Show>
              <For each={group.items}>
                {(item) => (
                  <A
                    href={item.path}
                    class={`group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      isActivePath(currentPath(), item.path)
                        ? "bg-white/[0.08] font-medium text-white"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    } ${props.collapsed ? "justify-center" : ""}`}
                  >
                    <Show when={isActivePath(currentPath(), item.path)}>
                      <div class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400" />
                    </Show>
                    <Icon
                      name={item.icon}
                      size={20}
                      class={`flex-shrink-0 transition-all duration-200 ${
                        isActivePath(currentPath(), item.path)
                          ? "text-blue-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <Show when={!props.collapsed}>
                      <span class="text-[13px]">{item.label}</span>
                    </Show>
                  </A>
                )}
              </For>
            </div>
          )}
        </For>

        <Show when={dynamicPluginPages().length > 0}>
          <div class="mb-6">
            <Show when={!props.collapsed}>
              <div class="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
                Plugin Pages
              </div>
            </Show>
            <For each={dynamicPluginPages()}>
              {(item) => (
                <A
                  href={item.path}
                  class={`group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    isActivePath(currentPath(), item.path)
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  } ${props.collapsed ? "justify-center" : ""}`}
                >
                  <Show when={isActivePath(currentPath(), item.path)}>
                    <div class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400" />
                  </Show>
                  <Icon
                    name={item.icon}
                    size={18}
                    class={isActivePath(currentPath(), item.path) ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}
                  />
                  <Show when={!props.collapsed}>
                    <span class="truncate text-[13px]">{item.label}</span>
                  </Show>
                </A>
              )}
            </For>
          </div>
        </Show>

        <Show when={dynamicPluginSettings().length > 0}>
          <div class="mb-6">
            <Show when={!props.collapsed}>
              <div class="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
                Plugin Settings
              </div>
            </Show>
            <For each={dynamicPluginSettings()}>
              {(item) => (
                <A
                  href={item.path}
                  class={`group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    currentPath() === normalizePath(item.path)
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  } ${props.collapsed ? "justify-center" : ""}`}
                >
                  <Show when={currentPath() === normalizePath(item.path)}>
                    <div class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400" />
                  </Show>
                  <Icon
                    name={item.icon}
                    size={18}
                    class={currentPath() === normalizePath(item.path) ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}
                  />
                  <Show when={!props.collapsed}>
                    <span class="truncate text-[13px]">{item.label}</span>
                  </Show>
                </A>
              )}
            </For>
          </div>
        </Show>
      </nav>

      <div class="border-t border-white/[0.06] p-3">
        <Show
          when={!props.collapsed}
          fallback={
            <button
              type="button"
              onClick={props.onToggle}
              class="flex w-full items-center justify-center rounded-xl py-2.5 text-slate-500 transition-all hover:bg-white/[0.04] hover:text-slate-300"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          }
        >
          <div class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]">
            <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              A
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-white">Admin</div>
              <div class="truncate text-[11px] text-slate-500">admin@blitzpress.dev</div>
            </div>
            <button
              type="button"
              onClick={props.onToggle}
              class="text-slate-500 transition-colors hover:text-slate-300"
            >
              <Icon name="chevron-left" size={16} />
            </button>
          </div>
        </Show>
      </div>
    </aside>
  );
};

export default Sidebar;
