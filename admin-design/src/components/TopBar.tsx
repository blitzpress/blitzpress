import { type Component, createSignal } from 'solid-js';
import { useLocation } from '@solidjs/router';
import Icon from './Icon';

interface TopBarProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/posts': 'Posts',
  '/posts/new': 'New Post',
  '/media': 'Media Library',
  '/pages': 'Pages',
  '/plugins': 'Plugins',
  '/users': 'Users',
  '/settings': 'Settings',
};

const TopBar: Component<TopBarProps> = (props) => {
  const location = useLocation();
  const [searchFocused, setSearchFocused] = createSignal(false);

  const pageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname === path) return title;
      if (path !== '/' && location.pathname.startsWith(path)) return title;
    }
    return 'BlitzPress';
  };

  return (
    <header class="sticky top-0 z-20 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6">
      <div class="flex items-center gap-4">
        <button
          onClick={props.onMenuToggle}
          class="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <Icon name="menu" size={20} />
        </button>
        <h1 class="text-lg font-semibold text-slate-800">{pageTitle()}</h1>
      </div>

      <div class="flex items-center gap-2">
        <div class={`relative transition-all duration-300 ${searchFocused() ? 'w-80' : 'w-64'}`}>
          <Icon name="search" size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100/80 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 focus:bg-white transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <button class="relative p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer group">
          <Icon name="bell" size={20} />
          <span class="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span class="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        </button>

        <button
          class="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer"
          title="View Site"
        >
          <Icon name="external-link" size={20} />
        </button>

        <div class="flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200/60">
          <div class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div class="hidden sm:block">
            <div class="text-sm font-semibold text-slate-800">Admin</div>
            <div class="text-[11px] text-slate-400 -mt-0.5">Administrator</div>
          </div>
          <Icon name="chevron-down" size={14} class="text-slate-300" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
