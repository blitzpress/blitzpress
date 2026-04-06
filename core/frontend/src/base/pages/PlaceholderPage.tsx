import { A, useLocation } from "@solidjs/router";
import { For, Show } from "solid-js";

import Icon from "../icons/Icon";
import NotFoundPage from "./NotFoundPage";
import { normalizePath, placeholderPages } from "../routes/navigation";

export default function PlaceholderPage() {
  const location = useLocation();
  const page = () => placeholderPages[normalizePath(location.pathname)];

  return (
    <Show when={page()} fallback={<NotFoundPage />}>
      {(entry) => (
        <div class="space-y-6">
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-500/15 animate-gradient">
            <div class="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            <div class="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-white/[0.07] blur-3xl" />
            <div class="relative">
              <p class="text-sm font-medium uppercase tracking-[0.15em] text-blue-100/80">WordPress parity</p>
              <h2 class="mt-3 text-2xl font-bold tracking-tight">{entry().title}</h2>
              <p class="mt-2 max-w-2xl text-blue-100/85">{entry().description}</p>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-3">
            <section class="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div class="flex items-center gap-2.5">
                <div class="h-5 w-1.5 rounded-full bg-indigo-500" />
                <h3 class="text-sm font-semibold text-slate-900">Planned scope</h3>
              </div>
              <div class="mt-5 space-y-3 text-sm text-slate-600">
                <Show when={entry().bullets?.length} fallback={<p>This screen is reserved and wired into the new CMS information architecture.</p>}>
                  <ul class="space-y-3">
                    <For each={entry().bullets}>{(bullet) => <li class="flex items-start gap-3"><Icon name="check" size={16} class="mt-0.5 text-emerald-600" /><span>{bullet}</span></li>}</For>
                  </ul>
                </Show>
              </div>
            </section>

            <section class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div class="flex items-center gap-2.5">
                <div class="h-5 w-1.5 rounded-full bg-violet-500" />
                <h3 class="text-sm font-semibold text-slate-900">Quick links</h3>
              </div>
              <div class="mt-5 space-y-3">
                <Show when={entry().links?.length} fallback={<p class="text-sm text-slate-500">No related placeholder screens for this section yet.</p>}>
                  <For each={entry().links}>
                    {(link) => (
                      <A
                        href={link.path}
                        class="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-slate-50"
                      >
                        <span>{link.label}</span>
                        <Icon name="chevron-right" size={16} class="text-slate-400" />
                      </A>
                    )}
                  </For>
                </Show>
              </div>
            </section>
          </div>
        </div>
      )}
    </Show>
  );
}
