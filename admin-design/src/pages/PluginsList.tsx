import type { Component } from 'solid-js';

export const PluginsList: Component = () => {
  return (
    <div class="pt-24 px-8 pb-12 max-w-7xl mx-auto">
      <div class="flex justify-between items-end mb-10">
        <div>
          <nav class="flex gap-2 text-xs font-medium text-secondary mb-2">
            <span>Admin</span>
            <span class="opacity-30">/</span>
            <span class="text-primary">Plugins</span>
          </nav>
          <h1 class="text-4xl font-extrabold tracking-tight text-on-surface">Plugins</h1>
        </div>
        <button class="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary-container/20 hover:shadow-xl hover:shadow-primary-container/30 transition-all active:scale-95">
          <span class="material-symbols-outlined text-lg">add_circle</span>
          Add New Plugin
        </button>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div class="flex flex-wrap gap-2">
          <button class="px-4 py-2 rounded-lg bg-surface-container-low text-primary font-semibold text-sm transition-colors hover:bg-surface-container">All <span class="ml-1 opacity-50 font-normal">24</span></button>
          <button class="px-4 py-2 rounded-lg text-secondary font-medium text-sm transition-colors hover:bg-surface-container-low">Active <span class="ml-1 opacity-50 font-normal">18</span></button>
          <button class="px-4 py-2 rounded-lg text-secondary font-medium text-sm transition-colors hover:bg-surface-container-low">Inactive <span class="ml-1 opacity-50 font-normal">4</span></button>
          <button class="px-4 py-2 rounded-lg text-secondary font-medium text-sm transition-colors hover:bg-surface-container-low">Updates <span class="ml-1 opacity-50 font-normal">2</span></button>
          <button class="px-4 py-2 rounded-lg text-secondary font-medium text-sm transition-colors hover:bg-surface-container-low">Errors <span class="ml-1 opacity-50 font-normal">1</span></button>
        </div>
        <div class="flex gap-4 flex-1 max-w-md">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input class="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20" placeholder="Filter installed plugins..." type="text"/>
          </div>
          <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-secondary font-medium text-sm hover:bg-surface-container">
            <span class="material-symbols-outlined text-lg">filter_list</span>
            Bulk Actions
          </button>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low/50 border-b border-outline-variant/10">
              <th class="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary opacity-60">Plugin Name</th>
              <th class="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary opacity-60">Description & Details</th>
              <th class="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary opacity-60">Version</th>
              <th class="px-8 py-5 text-xs font-bold uppercase tracking-widest text-secondary opacity-60 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            <tr class="group hover:bg-error-container/5 transition-colors">
              <td class="px-8 py-8 align-top">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-error-container/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-error" data-weight="fill">warning</span>
                  </div>
                  <div>
                    <div class="text-base font-bold text-on-surface mb-1 leading-tight">BlitzCore Performance</div>
                    <div class="flex gap-3 text-xs font-medium">
                      <a class="text-primary hover:underline" href="#">Settings</a>
                      <span class="text-outline-variant">|</span>
                      <a class="text-error hover:underline font-semibold" href="#">Deactivate</a>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-8 align-top">
                <div class="max-w-md">
                  <p class="text-sm text-secondary leading-relaxed mb-4">The essential engine for lightning-fast page loads and core editorial features across your BlitzPress network.</p>
                  <div class="bg-error-container/30 border border-error/10 p-4 rounded-lg flex gap-3">
                    <span class="material-symbols-outlined text-error text-lg mt-0.5">report</span>
                    <p class="text-xs font-medium text-on-error-container">Plugin conflict detected with BlitzCore 2.0. Click for details and resolution steps.</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-8 align-top">
                <span class="inline-block px-2 py-1 rounded-md bg-surface-container text-xs font-mono font-medium text-secondary">2.4.1</span>
              </td>
              <td class="px-8 py-8 align-top text-right">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-error text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                  ERROR
                </div>
              </td>
            </tr>
            <tr class="group hover:bg-surface-container-low transition-colors">
              <td class="px-8 py-8 align-top">
                <div class="flex items-start gap-4">
                  <img alt="Plugin Icon" class="w-12 h-12 rounded-xl object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdXKZDjxiazQ9-Wkg1cVjetOfB5YRgbgmly_N078PUepOH7eUlHWyh04zsoeab-S06yQ0xexagsq4t0QELUdyhBEblygRkyVHzZJ3xe6e6h3B3-kgOMef5WCXwV1EQ8HJj9bvCrlcGRT8FLn6IsLDEdeiu84AaueYn4c5ZH4pFRblFwJbU_4nL4FKNilccoj72bQmGbv-laD5Yk4ac0G0YQ58qRsOtuQCdvOr4CO1WpAopuip4zHaWZDGbzh_WdPz7kWSnSwnHYVjz"/>
                  <div>
                    <div class="text-base font-bold text-on-surface mb-1 leading-tight">Editorial AI Suite</div>
                    <div class="flex gap-3 text-xs font-medium">
                      <a class="text-primary hover:underline" href="#">Settings</a>
                      <span class="text-outline-variant">|</span>
                      <a class="text-secondary hover:underline" href="#">Deactivate</a>
                      <span class="text-outline-variant">|</span>
                      <a class="text-secondary hover:underline" href="#">Documentation</a>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-8 align-top">
                <p class="text-sm text-secondary leading-relaxed max-w-md">Advanced LLM-powered writing assistants, automated meta-tagging, and high-fidelity image generation integrated into your post editor.</p>
              </td>
              <td class="px-8 py-8 align-top">
                <span class="inline-block px-2 py-1 rounded-md bg-surface-container text-xs font-mono font-medium text-secondary">1.0.8</span>
              </td>
              <td class="px-8 py-8 align-top text-right">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container/10 text-tertiary text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  ACTIVE
                </div>
              </td>
            </tr>
            <tr class="group hover:bg-surface-container-low transition-colors bg-surface-container-low/20">
              <td class="px-8 py-8 align-top">
                <div class="flex items-start gap-4 opacity-70">
                  <div class="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                    <span class="material-symbols-outlined text-slate-400">monitoring</span>
                  </div>
                  <div>
                    <div class="text-base font-bold text-on-surface mb-1 leading-tight">Traffic Pulse Pro</div>
                    <div class="flex gap-3 text-xs font-medium">
                      <a class="text-primary hover:underline font-bold" href="#">Activate</a>
                      <span class="text-outline-variant">|</span>
                      <a class="text-error hover:underline" href="#">Delete</a>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-8 align-top">
                <p class="text-sm text-secondary/70 leading-relaxed max-w-md">Real-time visitor tracking and heatmap visualization for identifying content high-points and conversion bottlenecks.</p>
              </td>
              <td class="px-8 py-8 align-top">
                <span class="inline-block px-2 py-1 rounded-md bg-surface-container/50 text-xs font-mono font-medium text-secondary/50">3.2.0</span>
              </td>
              <td class="px-8 py-8 align-top text-right">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 text-slate-500 text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  INACTIVE
                </div>
              </td>
            </tr>
            <tr class="group hover:bg-primary-fixed/5 transition-colors">
              <td class="px-8 py-8 align-top">
                <div class="flex items-start gap-4">
                  <img alt="Plugin Icon" class="w-12 h-12 rounded-xl object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiOhJyMR6i97yaalGfB62Kry9OBE21sF7YFWx-M1vACDiK8b4XQQEa3u8QdQMqB37blqJmqpNEkHIYg01XMxr0Zn9ymbniNITwh3PxsciA2ft2JsUFtxAdhWVkGN8VtVEbYx2JiYS5bqPKptrn_V2D4KH_dqSIVIa3QwlDgj01HP1HUMtrAd9DKVndXBtFdgrGOzHW2cd7df7634M_Tch3_IkXZF39euCPKACHVdvmjKVJJVl47LFsVgr4ltj--BaprW8UT5gBVwY6"/>
                  <div>
                    <div class="text-base font-bold text-on-surface mb-1 leading-tight">Fortress Firewall</div>
                    <div class="flex gap-3 text-xs font-medium">
                      <a class="text-primary hover:underline" href="#">Settings</a>
                      <span class="text-outline-variant">|</span>
                      <a class="text-secondary hover:underline" href="#">Deactivate</a>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-8 align-top">
                <div class="max-w-md">
                  <p class="text-sm text-secondary leading-relaxed mb-3">Enterprise-grade security perimeter with brute-force protection and IP blacklisting.</p>
                  <div class="inline-flex items-center gap-2 text-[10px] font-bold text-primary uppercase bg-primary-fixed px-2 py-1 rounded">
                    <span class="material-symbols-outlined text-sm">update</span>
                    Update to v4.5.0 available
                  </div>
                </div>
              </td>
              <td class="px-8 py-8 align-top">
                <span class="inline-block px-2 py-1 rounded-md bg-surface-container text-xs font-mono font-medium text-secondary">4.4.9</span>
              </td>
              <td class="px-8 py-8 align-top text-right">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-primary text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  ACTIVE
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-8 flex items-center justify-between text-sm text-secondary">
        <p>Showing 1 to 4 of 24 plugins</p>
        <div class="flex gap-2">
          <button class="px-4 py-2 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors disabled:opacity-30" disabled>Previous</button>
          <button class="px-4 py-2 rounded-lg bg-primary-container text-white font-semibold">1</button>
          <button class="px-4 py-2 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors">2</button>
          <button class="px-4 py-2 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors">3</button>
          <button class="px-4 py-2 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors">Next</button>
        </div>
      </div>

      <button class="fixed bottom-8 right-8 w-14 h-14 bg-primary rounded-full text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-2xl" data-weight="fill">upload</span>
      </button>
    </div>
  );
};
