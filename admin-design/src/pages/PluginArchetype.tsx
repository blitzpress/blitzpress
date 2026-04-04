import type { Component } from 'solid-js';

export const PluginArchetype: Component = () => {
  return (
    <div class="pt-24 px-8 pb-12 max-w-[1440px] mx-auto">
      <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div class="relative">
          <div class="absolute -top-8 -left-2 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold tracking-widest flex items-center">
            <span class="w-1 h-1 bg-primary rounded-full mr-1"></span> INTER TYPOGRAPHY
          </div>
          <h1 class="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Plugin Template</h1>
          <p class="text-lg text-secondary font-light max-w-xl">Standardized layout for third-party extensions. Ensuring design consistency across the BlitzPress ecosystem.</p>
        </div>
        <div>
          <button class="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
            <span>Action</span>
            <span class="material-symbols-outlined text-sm">bolt</span>
          </button>
        </div>
      </header>

      <section class="mb-10">
        <div class="bg-error-container/30 border-l-4 border-error p-5 rounded-xl flex items-start gap-4">
          <span class="material-symbols-outlined text-error mt-0.5">report</span>
          <div>
            <h4 class="font-semibold text-on-error-container mb-1">Error Diagnostic</h4>
            <p class="text-sm text-on-error-container/80">The system encountered a minor synchronization delay. This has been automatically logged for review.</p>
          </div>
          <button class="ml-auto text-error hover:bg-error/10 p-1 rounded-lg transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div class="md:col-span-8 group relative">
          <div class="absolute -top-4 right-4 z-10 bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold tracking-widest flex items-center">
            <span class="w-1 h-1 bg-tertiary rounded-full mr-1"></span> 4-8PX RADIUS
          </div>
          <div class="bg-white p-8 rounded-xl shadow-[0_12px_40px_rgba(20,27,43,0.04)] border border-slate-100/50">
            <h3 class="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">auto_awesome</span>
              Native Feel Explanation
            </h3>
            <div class="space-y-6 text-on-surface-variant leading-relaxed">
              <p>To maintain the premium "Digital Atelier" aesthetic, all plugins must adhere to the 12-column grid system.</p>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-surface-container-low p-4 rounded-lg">
                  <span class="text-xs font-bold text-primary block mb-1 uppercase tracking-tighter">Constraint</span>
                  <p class="text-sm font-medium">Max-width is strictly enforced at 1440px.</p>
                </div>
                <div class="bg-surface-container-low p-4 rounded-lg">
                  <span class="text-xs font-bold text-primary block mb-1 uppercase tracking-tighter">Rhythm</span>
                  <p class="text-sm font-medium">Vertical whitespace uses increments of 8px.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="md:col-span-4 space-y-8">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100/50">
            <h4 class="text-sm font-bold text-secondary mb-4 flex items-center justify-between">
              PENDING SYNCHRONIZATION
              <span class="material-symbols-outlined text-xs animate-spin">refresh</span>
            </h4>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-surface-container-low rounded-full animate-pulse"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-surface-container-low rounded-full w-3/4 animate-pulse"></div>
                  <div class="h-2 bg-surface-container-low rounded-full w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
