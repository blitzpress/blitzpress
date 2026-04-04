import type { Component } from 'solid-js';
import { A, useLocation } from '@solidjs/router';

export const Sidebar: Component = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const activeClass = "relative flex items-center px-4 py-3 text-[#0052FF] font-semibold before:content-[''] before:absolute before:left-0 before:w-1 before:h-6 before:bg-[#0052FF] before:rounded-r-full transition-all duration-200 ease-in-out";
  const inactiveClass = "flex items-center px-4 py-3 text-[#565e71] hover:text-[#0052FF] hover:bg-white/50 transition-all duration-200 ease-in-out rounded-lg";

  return (
    <aside class="fixed left-0 top-0 h-full w-64 z-40 bg-[#f1f3ff] flex flex-col py-8 px-4 gap-y-2 font-['Inter'] text-[0.875rem] tracking-normal overflow-y-auto">
      <div class="px-4 mb-8 flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white shrink-0">
          <span class="material-symbols-outlined" data-icon="palette">palette</span>
        </div>
        <div>
          <h2 class="text-xl font-bold text-[#141b2b] leading-tight">The Atelier</h2>
          <p class="text-xs text-secondary">CMS Curator</p>
        </div>
      </div>
      <nav class="flex-1 space-y-1">
        <A href="/" class={isActive('/') ? activeClass : inactiveClass}>
          <span class="material-symbols-outlined mr-3" data-icon="dashboard">dashboard</span>
          <span>Dashboard</span>
        </A>
        <A href="/plugins" class={isActive('/plugins') ? activeClass : inactiveClass}>
          <span class="material-symbols-outlined mr-3" data-icon="extension">extension</span>
          <span>Plugins List</span>
        </A>
        <A href="/plugin-archetype" class={isActive('/plugin-archetype') ? activeClass : inactiveClass}>
          <span class="material-symbols-outlined mr-3" data-icon="architecture">architecture</span>
          <span>Plugin Archetype</span>
        </A>
        <A href="/seo-settings" class={isActive('/seo-settings') ? activeClass : inactiveClass}>
          <span class="material-symbols-outlined mr-3" data-icon="search">search</span>
          <span>SEO Settings</span>
        </A>
        <A href="/settings" class={isActive('/settings') ? activeClass : inactiveClass}>
          <span class="material-symbols-outlined mr-3" data-icon="settings">settings</span>
          <span>Global Settings</span>
        </A>
      </nav>
      <div class="pt-4 border-t border-transparent space-y-1">
        <button class="w-full mb-4 bg-gradient-to-br from-primary to-primary-container text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          <span class="material-symbols-outlined" data-icon="add">add</span>
          New Entry
        </button>
      </div>
    </aside>
  );
};
