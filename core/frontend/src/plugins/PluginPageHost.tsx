import { Show, createResource } from "solid-js";

import type { RegisteredPage } from "../plugin-runtime/types";

export default function PluginPageHost(props: { page: RegisteredPage }) {
  const [module] = createResource(() => props.page.id, async () => props.page.component());

  return (
    <section class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
      <header class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Plugin page</p>
          <h2 class="mt-2 text-lg font-semibold text-slate-900">{props.page.title}</h2>
        </div>
        <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-500/20">
          {props.page.pluginId}
        </span>
      </header>
      <Show when={module()} fallback={<p class="text-sm text-slate-400">Loading page module…</p>}>
        {(loadedModule) => {
          const Page = loadedModule().default;
          return <Page />;
        }}
      </Show>
    </section>
  );
}
