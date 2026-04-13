import type { JSX } from "solid-js";

export interface PluginPageLayoutProps {
  title: string;
  pluginId: string;
  eyebrow?: string;
  children: JSX.Element;
}

export function PluginPageLayout(props: PluginPageLayoutProps) {
  return (
    <section class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
      <header class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            {props.eyebrow ?? "Plugin page"}
          </p>
          <h2 class="mt-2 text-lg font-semibold text-slate-900">{props.title}</h2>
        </div>
        <span class="bp-badge bp-badge-blue">{props.pluginId}</span>
      </header>
      {props.children}
    </section>
  );
}
