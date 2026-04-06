import { For, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";

type SettingsTab = "general" | "writing" | "reading" | "media" | "permalinks";

const tabs: { label: string; value: SettingsTab }[] = [
  { label: "General", value: "general" },
  { label: "Writing", value: "writing" },
  { label: "Reading", value: "reading" },
  { label: "Media", value: "media" },
  { label: "Permalinks", value: "permalinks" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = createSignal<SettingsTab>("general");

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1 border-b border-slate-200">
          <For each={tabs}>
            {(tab) => (
              <button
                type="button"
                onClick={() => setActiveTab(tab.value)}
                class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab() === tab.value
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            )}
          </For>
        </div>
        <div class="flex items-center gap-2">
          <A href="/settings/discussion" class="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">Discussion</A>
          <A href="/settings/privacy" class="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">Privacy</A>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
        <Show when={activeTab() === "general"}>
          <div class="max-w-2xl space-y-5">
            <div><label class={labelClass}>Site Title</label><input type="text" value="BlitzPress Site" class={inputClass} /></div>
            <div><label class={labelClass}>Tagline</label><input type="text" value="Just another BlitzPress site" class={inputClass} /><p class="mt-1.5 text-xs text-slate-400">In a few words, explain what this site is about.</p></div>
            <div><label class={labelClass}>Site URL</label><input type="url" value="https://example.com" class={inputClass} /></div>
            <div><label class={labelClass}>Admin Email</label><input type="email" value="admin@blitzpress.dev" class={inputClass} /></div>
            <div>
              <label class={labelClass}>Timezone</label>
              <select class={`${inputClass} cursor-pointer`}>
                <option>UTC+0</option><option>UTC-5 (Eastern)</option><option>UTC-8 (Pacific)</option><option selected>UTC+1 (Central European)</option><option>UTC+9 (Japan)</option>
              </select>
            </div>
            <div>
              <label class={labelClass}>Date Format</label>
              <div class="mt-1 space-y-2.5">
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="date_format" checked class="text-blue-600" /><span class="text-sm text-slate-700">April 5, 2026</span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="date_format" class="text-blue-600" /><span class="text-sm text-slate-700">2026-04-05</span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="date_format" class="text-blue-600" /><span class="text-sm text-slate-700">04/05/2026</span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="date_format" class="text-blue-600" /><span class="text-sm text-slate-700">05/04/2026</span></label>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === "writing"}>
          <div class="max-w-2xl space-y-5">
            <div><label class={labelClass}>Default Post Category</label><select class={`${inputClass} cursor-pointer`}><option>Uncategorized</option><option>Tutorials</option><option>Development</option><option>News</option></select></div>
            <div><label class={labelClass}>Default Post Format</label><select class={`${inputClass} cursor-pointer`}><option>Standard</option><option>Gallery</option><option>Video</option><option>Quote</option></select></div>
            <div class="flex items-center gap-3"><input type="checkbox" id="auto-save" checked class="rounded border-slate-300 text-blue-600" /><label for="auto-save" class="cursor-pointer text-sm text-slate-700">Enable auto-save for drafts</label></div>
            <div class="flex items-center gap-3"><input type="checkbox" id="markdown" class="rounded border-slate-300 text-blue-600" /><label for="markdown" class="cursor-pointer text-sm text-slate-700">Enable Markdown support</label></div>
          </div>
        </Show>

        <Show when={activeTab() === "reading"}>
          <div class="max-w-2xl space-y-5">
            <div>
              <label class={labelClass}>Homepage displays</label>
              <div class="mt-1 space-y-2.5">
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="homepage" checked class="text-blue-600" /><span class="text-sm text-slate-700">Your latest posts</span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="homepage" class="text-blue-600" /><span class="text-sm text-slate-700">A static page</span></label>
              </div>
            </div>
            <div><label class={labelClass}>Posts per page</label><input type="number" value="10" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div>
            <div class="flex items-center gap-3"><input type="checkbox" id="search-engine" checked class="rounded border-slate-300 text-blue-600" /><label for="search-engine" class="cursor-pointer text-sm text-slate-700">Allow search engines to index this site</label></div>
          </div>
        </Show>

        <Show when={activeTab() === "media"}>
          <div class="max-w-2xl space-y-6">
            <div><h3 class="mb-3 text-sm font-medium text-slate-700">Thumbnail size</h3><div class="flex items-center gap-4"><div><label class="mb-1 block text-xs text-slate-500">Width</label><input type="number" value="150" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div><div><label class="mb-1 block text-xs text-slate-500">Height</label><input type="number" value="150" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div></div></div>
            <div><h3 class="mb-3 text-sm font-medium text-slate-700">Medium size</h3><div class="flex items-center gap-4"><div><label class="mb-1 block text-xs text-slate-500">Max width</label><input type="number" value="300" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div><div><label class="mb-1 block text-xs text-slate-500">Max height</label><input type="number" value="300" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div></div></div>
            <div><h3 class="mb-3 text-sm font-medium text-slate-700">Large size</h3><div class="flex items-center gap-4"><div><label class="mb-1 block text-xs text-slate-500">Max width</label><input type="number" value="1024" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div><div><label class="mb-1 block text-xs text-slate-500">Max height</label><input type="number" value="1024" class="w-24 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" /></div></div></div>
            <div class="flex items-center gap-3"><input type="checkbox" id="organize" checked class="rounded border-slate-300 text-blue-600" /><label for="organize" class="cursor-pointer text-sm text-slate-700">Organize uploads into month- and year-based folders</label></div>
          </div>
        </Show>

        <Show when={activeTab() === "permalinks"}>
          <div class="max-w-2xl space-y-5">
            <div>
              <label class={labelClass}>Permalink Structure</label>
              <div class="mt-1 space-y-2.5">
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="permalink" class="text-blue-600" /><span class="text-sm text-slate-700">Plain — <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">?p=123</code></span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="permalink" class="text-blue-600" /><span class="text-sm text-slate-700">Day and name — <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/2026/04/05/post-name/</code></span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="permalink" class="text-blue-600" /><span class="text-sm text-slate-700">Month and name — <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/2026/04/post-name/</code></span></label>
                <label class="flex cursor-pointer items-center gap-2.5"><input type="radio" name="permalink" checked class="text-blue-600" /><span class="text-sm text-slate-700">Post name — <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/post-name/</code></span></label>
              </div>
            </div>
          </div>
        </Show>

        <div class="mt-8 border-t border-slate-100 pt-6">
          <button class="cursor-pointer rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
