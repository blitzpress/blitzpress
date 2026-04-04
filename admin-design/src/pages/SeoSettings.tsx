import type { Component } from 'solid-js';

export const SeoSettings: Component = () => {
  return (
    <div class="pt-16 pb-24 px-8 w-full max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-12 mb-10">
        <div class="flex items-start gap-5">
          <div class="w-14 h-14 bg-surface-container flex items-center justify-center rounded-xl overflow-hidden shrink-0">
            <img alt="SEO Suite Pro" class="w-10 h-10 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1F_7gnHvplEsgLJhCJToqLrrR7sFVifOWF03qwf-VgZeQyZ7r7Rz3b9ByFykWZM1JhZFZQBc4GzvsTtW-m0I1LylPDbXMrMs-9WRi6jyWqVKf6bzqId0ekrJR7nfq2KX5vdRzQSyuv0JrLYufNxTQxZgHJ5sIBP21x79ATodqYk2rLEishkTggA65hzPQ9vcFhdA8WNc-mznUp_bHFWb3twkMP5RdMBU1GJcu-dmOdG4abzbu4TYJhwQuvfgXxbHej9JrmRCnlyB7"/>
          </div>
          <div>
            <h1 class="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">SEO Suite Pro</h1>
            <p class="text-secondary body-md max-w-xl">Advanced on-page SEO optimization engine. Manage your search visibility, schema markups, and indexing frequency from a single premium console.</p>
          </div>
        </div>
        <button class="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-xl transition-all active:scale-95 shrink-0">
          Save Changes
        </button>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-10 shadow-[0_12px_40px_rgba(20,27,43,0.06)]">
        <form class="space-y-12">
          <div class="grid grid-cols-1 gap-y-10">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm font-semibold text-on-surface tracking-tight" for="api-key">API Key</label>
                <span class="text-xs font-medium text-primary cursor-pointer hover:underline">Where do I find this?</span>
              </div>
              <div class="relative">
                <input class="w-full bg-surface-container-low border-2 border-primary-container rounded-xl px-4 py-3.5 text-sm focus:ring-0 focus:outline-none transition-all font-mono" id="api-key" type="text" value="BP-X92-JKS8-ERR-404"/>
                <span class="material-symbols-outlined absolute right-4 top-3.5 text-error">error</span>
              </div>
              <p class="text-xs font-medium text-error flex items-center gap-1.5 px-1">
                <span class="w-1 h-1 bg-error rounded-full"></span>
                Invalid key format
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-sm font-semibold text-on-surface tracking-tight" for="frequency">Indexing Frequency</label>
              <div class="relative">
                <select class="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3.5 text-sm appearance-none focus:ring-2 focus:ring-primary/10 focus:border-primary-container transition-all cursor-pointer" id="frequency">
                  <option>Real-time (Push)</option>
                  <option selected>Every 6 Hours</option>
                  <option>Daily at Midnight</option>
                  <option>Weekly</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-3.5 text-secondary pointer-events-none">expand_more</span>
              </div>
              <p class="text-xs text-secondary px-1">Recommended for high-traffic editorial sites.</p>
            </div>

            <div class="flex items-center justify-between p-6 bg-surface-container-low rounded-xl">
              <div class="space-y-1">
                <h4 class="text-sm font-semibold text-on-surface tracking-tight">Enable Auto-Optimizer</h4>
                <p class="text-xs text-secondary">Automatically compress images and inject meta descriptions on publish.</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input checked type="checkbox" class="sr-only peer"/>
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
              </label>
            </div>

            <div class="space-y-3">
              <label class="text-sm font-semibold text-on-surface tracking-tight" for="schema">Custom Schema Scripts</label>
              <textarea class="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary-container transition-all font-mono resize-none" id="schema" placeholder="Enter JSON-LD scripts here..." rows="6" value={`{\n  "@context": "https://schema.org",\n  "@type": "NewsArticle",\n  "headline": "Editorial Excellence in BlitzPress"\n}`}></textarea>
              <p class="text-xs text-secondary px-1">Paste your custom JSON-LD blocks here to override default page schema.</p>
            </div>
          </div>
        </form>
      </div>

      <div class="mt-12 p-8 border border-error/10 bg-error-container/20 rounded-xl flex items-center justify-between">
        <div>
          <h4 class="text-sm font-bold text-on-error-container">Deactivate Plugin</h4>
          <p class="text-xs text-on-secondary-container">This will remove all SEO Suite Pro meta data from your head tags.</p>
        </div>
        <button class="px-5 py-2 rounded-lg text-sm font-semibold text-error border border-error/20 hover:bg-error hover:text-white transition-all">Deactivate</button>
      </div>

      <div class="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div class="bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-md">
          <span class="material-symbols-outlined text-tertiary-fixed text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          <span class="text-sm font-medium tracking-tight">Saved successfully</span>
        </div>
      </div>
    </div>
  );
};
