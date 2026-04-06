import { useLocation } from "@solidjs/router";
import { createSignal, type Component } from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { useAdminRuntime } from "../app/AdminRuntimeProvider";
import Icon from "../icons/Icon";
import { getPageTitle } from "../routes/navigation";

interface TopBarProps {
  onMenuToggle: () => void;
}

const TopBar: Component<TopBarProps> = (props) => {
  const location = useLocation();
  const { discoveredPlugins } = useAdminRuntime();
  const [searchFocused, setSearchFocused] = createSignal(false);

  const pageTitle = () => getPageTitle(location.pathname, runtimeState.pages, discoveredPlugins());

  return (
    <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/70 px-6 backdrop-blur-xl">
      <div class="flex items-center gap-4">
        <button
          type="button"
          onClick={props.onMenuToggle}
          class="cursor-pointer rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700"
        >
          <Icon name="menu" size={20} />
        </button>
        <h1 class="text-lg font-semibold text-slate-800">{pageTitle()}</h1>
      </div>

      <div class="flex items-center gap-2">
        <div class={`relative transition-all duration-300 ${searchFocused() ? "w-80" : "w-64"}`}>
          <Icon name="search" size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            class="w-full rounded-xl border border-transparent bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-indigo-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <button class="group relative cursor-pointer rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700">
          <Icon name="bell" size={20} />
          <span class="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span class="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        </button>

        <button
          class="cursor-pointer rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700"
          title="View Site"
        >
          <Icon name="external-link" size={20} />
        </button>

        <div class="ml-1 flex items-center gap-2.5 border-l border-slate-200/60 pl-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            A
          </div>
          <div class="hidden sm:block">
            <div class="text-sm font-semibold text-slate-800">Admin</div>
            <div class="-mt-0.5 text-[11px] text-slate-400">Administrator</div>
          </div>
          <Icon name="chevron-down" size={14} class="text-slate-300" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
