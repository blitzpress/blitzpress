import { type Component, createSignal, Show, For } from 'solid-js';

type SettingsTab = 'general' | 'writing' | 'reading' | 'media' | 'permalinks';

const tabs: { label: string; value: SettingsTab }[] = [
  { label: 'General', value: 'general' },
  { label: 'Writing', value: 'writing' },
  { label: 'Reading', value: 'reading' },
  { label: 'Media', value: 'media' },
  { label: 'Permalinks', value: 'permalinks' },
];

const Settings: Component = () => {
  const [activeTab, setActiveTab] = createSignal<SettingsTab>('general');

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div class="space-y-6">
      <div class="flex items-center gap-1 border-b border-slate-200">
        <For each={tabs}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab.value)}
              class={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab() === tab.value
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <Show when={activeTab() === 'general'}>
          <div class="space-y-5 max-w-2xl">
            <div>
              <label class={labelClass}>Site Title</label>
              <input type="text" value="BlitzPress Site" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Tagline</label>
              <input type="text" value="Just another BlitzPress site" class={inputClass} />
              <p class="text-xs text-slate-400 mt-1.5">In a few words, explain what this site is about.</p>
            </div>
            <div>
              <label class={labelClass}>Site URL</label>
              <input type="url" value="https://example.com" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Admin Email</label>
              <input type="email" value="admin@blitzpress.dev" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Timezone</label>
              <select class={inputClass + ' cursor-pointer'}>
                <option>UTC+0</option>
                <option>UTC-5 (Eastern)</option>
                <option>UTC-8 (Pacific)</option>
                <option selected>UTC+1 (Central European)</option>
                <option>UTC+9 (Japan)</option>
              </select>
            </div>
            <div>
              <label class={labelClass}>Date Format</label>
              <div class="space-y-2.5 mt-1">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="date_format" checked class="text-blue-600" />
                  <span class="text-sm text-slate-700">April 5, 2026</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="date_format" class="text-blue-600" />
                  <span class="text-sm text-slate-700">2026-04-05</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="date_format" class="text-blue-600" />
                  <span class="text-sm text-slate-700">04/05/2026</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="date_format" class="text-blue-600" />
                  <span class="text-sm text-slate-700">05/04/2026</span>
                </label>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'writing'}>
          <div class="space-y-5 max-w-2xl">
            <div>
              <label class={labelClass}>Default Post Category</label>
              <select class={inputClass + ' cursor-pointer'}>
                <option>Uncategorized</option>
                <option>Tutorials</option>
                <option>Development</option>
                <option>News</option>
              </select>
            </div>
            <div>
              <label class={labelClass}>Default Post Format</label>
              <select class={inputClass + ' cursor-pointer'}>
                <option>Standard</option>
                <option>Gallery</option>
                <option>Video</option>
                <option>Quote</option>
              </select>
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="auto-save" checked class="rounded border-slate-300 text-blue-600" />
              <label for="auto-save" class="text-sm text-slate-700 cursor-pointer">
                Enable auto-save for drafts
              </label>
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="markdown" class="rounded border-slate-300 text-blue-600" />
              <label for="markdown" class="text-sm text-slate-700 cursor-pointer">
                Enable Markdown support
              </label>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'reading'}>
          <div class="space-y-5 max-w-2xl">
            <div>
              <label class={labelClass}>Homepage displays</label>
              <div class="space-y-2.5 mt-1">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="homepage" checked class="text-blue-600" />
                  <span class="text-sm text-slate-700">Your latest posts</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="homepage" class="text-blue-600" />
                  <span class="text-sm text-slate-700">A static page</span>
                </label>
              </div>
            </div>
            <div>
              <label class={labelClass}>Posts per page</label>
              <input type="number" value="10" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="search-engine" checked class="rounded border-slate-300 text-blue-600" />
              <label for="search-engine" class="text-sm text-slate-700 cursor-pointer">
                Allow search engines to index this site
              </label>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'media'}>
          <div class="space-y-6 max-w-2xl">
            <div>
              <h3 class="text-sm font-medium text-slate-700 mb-3">Thumbnail size</h3>
              <div class="flex items-center gap-4">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Width</label>
                  <input type="number" value="150" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Height</label>
                  <input type="number" value="150" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-700 mb-3">Medium size</h3>
              <div class="flex items-center gap-4">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Max width</label>
                  <input type="number" value="300" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Max height</label>
                  <input type="number" value="300" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-700 mb-3">Large size</h3>
              <div class="flex items-center gap-4">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Max width</label>
                  <input type="number" value="1024" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Max height</label>
                  <input type="number" value="1024" class="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all" />
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="organize" checked class="rounded border-slate-300 text-blue-600" />
              <label for="organize" class="text-sm text-slate-700 cursor-pointer">
                Organize uploads into month- and year-based folders
              </label>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'permalinks'}>
          <div class="space-y-5 max-w-2xl">
            <div>
              <label class={labelClass}>Permalink Structure</label>
              <div class="space-y-2.5 mt-1">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="permalink" class="text-blue-600" />
                  <span class="text-sm text-slate-700">
                    Plain &mdash; <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">?p=123</code>
                  </span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="permalink" class="text-blue-600" />
                  <span class="text-sm text-slate-700">
                    Day and name &mdash;{' '}
                    <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/2026/04/05/post-name/</code>
                  </span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="permalink" class="text-blue-600" />
                  <span class="text-sm text-slate-700">
                    Month and name &mdash;{' '}
                    <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/2026/04/post-name/</code>
                  </span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="permalink" checked class="text-blue-600" />
                  <span class="text-sm text-slate-700">
                    Post name &mdash;{' '}
                    <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/post-name/</code>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </Show>

        <div class="mt-8 pt-6 border-t border-slate-100">
          <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
