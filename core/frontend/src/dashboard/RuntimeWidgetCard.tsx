import { Show, createResource } from "solid-js";

import type { RegisteredWidget } from "../plugin-runtime/types";

export default function RuntimeWidgetCard(props: { widget: RegisteredWidget }) {
  const [module] = createResource(() => props.widget.id, async () => props.widget.component());

  return (
    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm shadow-slate-200/50">
      <header class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">{props.widget.title}</h3>
          <p class="mt-1 text-xs text-slate-400">{props.widget.pluginId}</p>
        </div>
        <span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-500/20">
          Widget
        </span>
      </header>
      <Show when={module()} fallback={<p class="text-sm text-slate-400">Loading widget module…</p>}>
        {(loadedModule) => {
          const Widget = loadedModule().default;
          return <Widget />;
        }}
      </Show>
    </section>
  );
}
