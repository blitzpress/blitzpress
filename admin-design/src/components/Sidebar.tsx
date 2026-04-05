import { type Component, For, Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import Icon from './Icon';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navGroups = [
  {
    label: 'Main',
    items: [{ icon: 'home', label: 'Dashboard', path: '/' }],
  },
  {
    label: 'Content',
    items: [
      { icon: 'file-text', label: 'Posts', path: '/posts' },
      { icon: 'image', label: 'Media', path: '/media' },
      { icon: 'file', label: 'Pages', path: '/pages' },
    ],
  },
  {
    label: 'Extensions',
    items: [{ icon: 'puzzle', label: 'Plugins', path: '/plugins' }],
  },
  {
    label: 'System',
    items: [
      { icon: 'users', label: 'Users', path: '/users' },
      { icon: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
];

const Sidebar: Component<SidebarProps> = (props) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      class={`fixed left-0 top-0 h-full bg-slate-900 z-30 transition-all duration-300 flex flex-col ${
        props.collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div
        class={`flex items-center h-16 border-b border-white/[0.06] px-4 ${props.collapsed ? 'justify-center' : ''}`}
      >
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="bolt" size={20} class="text-white" />
          </div>
          <Show when={!props.collapsed}>
            <span class="text-lg font-bold text-white tracking-tight">
              Blitz
              <span class="text-indigo-400">Press</span>
            </span>
          </Show>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-5 px-3">
        <For each={navGroups}>
          {(group) => (
            <div class="mb-6">
              <Show when={!props.collapsed}>
                <div class="px-3 mb-2.5 text-[10px] font-bold text-slate-500/80 uppercase tracking-[0.15em]">
                  {group.label}
                </div>
              </Show>
              <For each={group.items}>
                {(item) => (
                  <A
                    href={item.path}
                    class={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 group relative ${
                      isActive(item.path)
                        ? 'bg-white/[0.08] text-white font-medium'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    } ${props.collapsed ? 'justify-center' : ''}`}
                  >
                    <Show when={isActive(item.path)}>
                      <div class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-r-full" />
                    </Show>
                    <Icon
                      name={item.icon}
                      size={20}
                      class={`flex-shrink-0 transition-all duration-200 ${
                        isActive(item.path) ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
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
      </nav>

      <div class="border-t border-white/[0.06] p-3">
        <Show
          when={!props.collapsed}
          fallback={
            <button
              onClick={props.onToggle}
              class="w-full flex items-center justify-center py-2.5 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          }
        >
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all">
            <div class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              A
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-white truncate">Admin</div>
              <div class="text-[11px] text-slate-500 truncate">admin@blitzpress.dev</div>
            </div>
            <button
              onClick={props.onToggle}
              class="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
