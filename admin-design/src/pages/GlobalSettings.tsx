import type { Component } from 'solid-js';

export const GlobalSettings: Component = () => {
  return (
    <>
      <div class="pt-24 pb-32 px-12 max-w-7xl mx-auto">
        <header class="mb-12">
          <h2 class="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Global Settings</h2>
          <p class="text-secondary font-medium text-lg max-w-2xl">Configure the core parameters of your digital atelier. Precision controls for a high-performance publishing environment.</p>
        </header>

        <nav class="flex gap-8 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          <a class="text-primary font-semibold border-b-2 border-primary pb-2 whitespace-nowrap" href="#">General</a>
          <a class="text-secondary font-medium hover:text-primary transition-colors pb-2 whitespace-nowrap" href="#">Security</a>
          <a class="text-secondary font-medium hover:text-primary transition-colors pb-2 whitespace-nowrap" href="#">Performance</a>
          <a class="text-secondary font-medium hover:text-primary transition-colors pb-2 whitespace-nowrap" href="#">Integrations</a>
          <a class="text-secondary font-medium hover:text-primary transition-colors pb-2 whitespace-nowrap" href="#">API</a>
        </nav>

        <div class="grid grid-cols-12 gap-8">
          <section class="col-span-12 lg:col-span-8 space-y-6">
            <div class="bg-surface-container-lowest p-8 rounded-xl">
              <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-primary" data-icon="fingerprint">fingerprint</span>
                <h3 class="text-xl font-bold tracking-tight">Site Identity</h3>
              </div>
              <div class="space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface">Site Title</label>
                    <input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container transition-all" type="text" value="BlitzPress Atelier"/>
                    <p class="text-[11px] text-secondary">The main identification of your project.</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface">Tagline</label>
                    <input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container transition-all" placeholder="The executive publishing engine" type="text"/>
                    <p class="text-[11px] text-secondary">A short, editorial punchline.</p>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-on-surface">Timezone</label>
                  <div class="relative">
                    <select class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-primary-container transition-all">
                      <option>UTC +00:00 (London, Lisbon, Reykjavik)</option>
                      <option>UTC +01:00 (Paris, Berlin, Rome)</option>
                      <option>UTC -05:00 (New York, Miami, Toronto)</option>
                      <option>UTC +09:00 (Tokyo, Seoul)</option>
                    </select>
                    <span class="material-symbols-outlined absolute right-4 top-3 text-secondary pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-surface-container-lowest p-8 rounded-xl">
              <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-primary" data-icon="bolt">bolt</span>
                <h3 class="text-xl font-bold tracking-tight">Performance</h3>
              </div>
              <div class="space-y-10">
                <div class="flex flex-col gap-4">
                  <label class="text-xs font-bold uppercase tracking-wider text-on-surface">Caching Engine Depth</label>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label class="relative cursor-pointer group">
                      <input class="peer sr-only" name="caching" type="radio"/>
                      <div class="p-4 rounded-xl bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-white transition-all group-hover:bg-surface-container">
                        <div class="font-bold text-sm">Light</div>
                        <div class="text-[10px] opacity-80 mt-1">Standard page cache.</div>
                      </div>
                    </label>
                    <label class="relative cursor-pointer group">
                      <input checked class="peer sr-only" name="caching" type="radio"/>
                      <div class="p-4 rounded-xl bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-white transition-all group-hover:bg-surface-container border-2 border-transparent peer-checked:border-primary">
                        <div class="font-bold text-sm">Aggressive</div>
                        <div class="text-[10px] opacity-80 mt-1">Edge computing enabled.</div>
                      </div>
                    </label>
                    <label class="relative cursor-pointer group">
                      <input class="peer sr-only" name="caching" type="radio"/>
                      <div class="p-4 rounded-xl bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-white transition-all group-hover:bg-surface-container">
                        <div class="font-bold text-sm">Real-time</div>
                        <div class="text-[10px] opacity-80 mt-1">Direct DB queries.</div>
                      </div>
                    </label>
                  </div>
                </div>
                <div class="flex items-center justify-between p-6 bg-surface-container-low rounded-xl">
                  <div>
                    <h4 class="text-sm font-bold text-on-surface">Lazy Loading Assets</h4>
                    <p class="text-xs text-secondary mt-1">Defer loading of off-screen media to improve Core Web Vitals.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input checked class="sr-only peer" type="checkbox"/>
                    <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <aside class="col-span-12 lg:col-span-4 space-y-8">
            <div class="bg-surface-container-lowest p-8 rounded-xl">
              <div class="flex items-center gap-3 mb-6">
                <span class="material-symbols-outlined text-primary" data-icon="visibility">visibility</span>
                <h3 class="text-lg font-bold tracking-tight">Privacy</h3>
              </div>
              <ul class="space-y-6">
                <li class="flex items-start gap-4">
                  <label class="relative inline-flex items-center cursor-pointer pt-1">
                    <input type="checkbox" class="sr-only peer"/>
                    <div class="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold">Search Engine Indexing</span>
                    <span class="text-[11px] text-secondary leading-relaxed">Disallow search engines from indexing this site. Useful for staging environments.</span>
                  </div>
                </li>
                <li class="flex items-start gap-4">
                  <label class="relative inline-flex items-center cursor-pointer pt-1">
                    <input checked type="checkbox" class="sr-only peer"/>
                    <div class="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold">Public Access</span>
                    <span class="text-[11px] text-secondary leading-relaxed">Toggle overall site visibility to the open web.</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div class="relative overflow-hidden rounded-xl bg-primary-container p-8 text-white">
              <div class="relative z-10">
                <span class="material-symbols-outlined mb-4" data-icon="auto_awesome">auto_awesome</span>
                <h3 class="text-xl font-bold mb-2">Pro Tip</h3>
                <p class="text-sm opacity-90 leading-relaxed mb-6">Aggressive caching can reduce server load by up to 80% for content-heavy sites.</p>
                <a class="text-xs font-bold uppercase tracking-widest bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all inline-block" href="#">Documentation</a>
              </div>
              <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </aside>
        </div>
      </div>

      <footer class="fixed bottom-0 right-0 left-64 z-40 bg-[#f9f9ff]/70 backdrop-blur-xl border-t border-outline-variant/10">
        <div class="px-12 py-6 flex items-center justify-end gap-8 max-w-7xl mx-auto">
          <button class="text-sm font-bold text-secondary hover:text-on-surface transition-colors">Cancel</button>
          <button class="bg-gradient-to-br from-primary to-primary-container text-white px-10 py-4 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all">
            Save Changes
          </button>
        </div>
      </footer>
    </>
  );
};
