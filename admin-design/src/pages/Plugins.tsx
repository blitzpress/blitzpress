import { type Component, For, Show, createSignal } from 'solid-js';
import Icon from '../components/Icon';

const plugins = [
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Comprehensive SEO tools including meta tags, sitemaps, and search engine optimization recommendations.',
    version: '2.1.0',
    author: 'BlitzPress Team',
    enabled: true,
    hasUpdate: false,
  },
  {
    id: 'contact-forms',
    name: 'Contact Forms',
    description: 'Drag-and-drop form builder with email notifications, spam protection, and submission management.',
    version: '1.5.3',
    author: 'BlitzPress Team',
    enabled: true,
    hasUpdate: true,
  },
  {
    id: 'image-optimizer',
    name: 'Image Optimizer',
    description: 'Automatically compress and optimize uploaded images. Supports WebP conversion and lazy loading.',
    version: '1.2.0',
    author: 'Community',
    enabled: true,
    hasUpdate: false,
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Privacy-focused analytics with visitor tracking, page views, and custom event monitoring.',
    version: '3.0.1',
    author: 'BlitzPress Team',
    enabled: false,
    hasUpdate: false,
  },
  {
    id: 'backup-manager',
    name: 'Backup Manager',
    description: 'Automated scheduled backups with cloud storage support. Restore with one click.',
    version: '1.0.0',
    author: 'Community',
    enabled: false,
    hasUpdate: false,
  },
];

const Plugins: Component = () => {
  const [pluginStates, setPluginStates] = createSignal<Record<string, boolean>>(
    Object.fromEntries(plugins.map((p) => [p.id, p.enabled])),
  );

  const togglePlugin = (id: string) => {
    setPluginStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCount = () => Object.values(pluginStates()).filter(Boolean).length;

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div />
        <button class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]">
          <Icon name="plus" size={16} />
          Install Plugin
        </button>
      </div>

      <div class="flex items-center gap-1 border-b border-slate-200">
        <button class="px-4 py-2.5 text-sm font-medium border-b-2 border-indigo-500 text-indigo-600 cursor-pointer">
          Installed <span class="text-slate-400 font-normal">({plugins.length})</span>
        </button>
        <button class="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 cursor-pointer">
          Active <span class="text-slate-400 font-normal">({activeCount()})</span>
        </button>
        <button class="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 cursor-pointer">
          Inactive <span class="text-slate-400 font-normal">({plugins.length - activeCount()})</span>
        </button>
      </div>

      <div class="space-y-3">
        <For each={plugins}>
          {(plugin) => {
            const isActive = () => pluginStates()[plugin.id];
            return (
              <div
                class={`bg-white rounded-2xl border shadow-sm p-5 transition-all relative overflow-hidden ${
                  isActive() ? 'border-slate-200/60' : 'border-slate-200/60 opacity-70'
                }`}
              >
                <Show when={isActive()} fallback={<div class="absolute top-0 left-0 right-0 h-1 bg-slate-200" />}>
                  <div class="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                </Show>
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      class={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive() ? 'bg-indigo-50 ring-1 ring-indigo-500/10' : 'bg-slate-100'
                      }`}
                    >
                      <Icon
                        name="puzzle"
                        size={24}
                        class={isActive() ? 'text-blue-600' : 'text-slate-400'}
                      />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h3 class="font-semibold text-slate-900">{plugin.name}</h3>
                        <span class="text-xs text-slate-400">v{plugin.version}</span>
                        <Show when={plugin.hasUpdate}>
                          <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-500/20">
                            Update available
                          </span>
                        </Show>
                      </div>
                      <p class="text-sm text-slate-500 mt-1">{plugin.description}</p>
                      <div class="flex items-center gap-4 mt-3">
                        <span class="text-xs text-slate-400">By {plugin.author}</span>
                        <button class="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                          Settings
                        </button>
                        <button class="text-xs text-red-500 hover:text-red-600 cursor-pointer">Delete</button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    class={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 mt-1 ${
                      isActive() ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      class={`absolute top-[1px] left-[1px] w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-transform ${
                        isActive() ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default Plugins;
