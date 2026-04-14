import { createSignal } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";

export default function Features() {
  const [isDarkMode, setIsDarkMode] = createSignal(true);
  const [hoverPlugin, setHoverPlugin] = createSignal(false);

  return (
    <main class="bg-[#0a0a0a] min-h-screen text-white pt-24 pb-40">
      <div class="page-shell">
        
        <header class="max-w-3xl mb-24">
          <AnimateOnView animation="fade-up">
            <h1 class="text-hero leading-tight mb-6">
              Features that <br/> don't feel like features.
            </h1>
            <p class="text-subhead">
              The point is not one isolated capability. It is the way the core, plugin runtime, and frontend extensibility reinforce each other.
            </p>
          </AnimateOnView>
        </header>

        {/* Bento Box Grid */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          {/* Main Hero Card (Takes 2 cols, 2 rows) */}
          <div class="md:col-span-2 md:row-span-2 bg-[#121212] rounded-3xl p-10 border border-white/5 relative overflow-hidden group">
            <div class="relative z-10 w-full md:w-2/3">
              <h2 class="text-4xl font-semibold mb-4 text-white">Go-first CMS runtime</h2>
              <p class="text-white/60 text-lg leading-relaxed mb-8">
                A modern core built for performance, typed contracts, and explicit lifecycle control. It's not just fast; it's predictable.
              </p>
            </div>
            
            {/* Decorative SVG */}
            <div class="absolute -right-20 -bottom-20 w-full max-w-[500px] h-full opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="0.5" stroke-dasharray="4 4" class="animate-[spin_60s_linear_infinite]" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="#10b981" stroke-width="1" class="animate-[spin_40s_linear_infinite_reverse]" />
                <circle cx="100" cy="100" r="40" fill="none" stroke="#34d399" stroke-width="2" class="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* Interactive Widget Card */}
          <div class="bg-[#121212] rounded-3xl p-8 border border-white/5 flex flex-col justify-between overflow-hidden">
            <div>
              <h3 class="text-xl font-semibold mb-2">Dynamic SolidJS Admin</h3>
              <p class="text-sm text-white/50">Plugin frontends load at runtime without a core rebuild.</p>
            </div>
            
            {/* Interactive Mini UI */}
            <div class={`mt-6 rounded-xl border border-white/10 p-4 transition-colors duration-500 ${isDarkMode() ? 'bg-black text-white' : 'bg-white text-black'}`}>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-mono font-bold uppercase">Widget Preview</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode())}
                  class={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode() ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <div class={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${isDarkMode() ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </button>
              </div>
              <div class="space-y-2">
                <div class={`h-2 rounded w-full ${isDarkMode() ? 'bg-white/20' : 'bg-black/10'}`}></div>
                <div class={`h-2 rounded w-2/3 ${isDarkMode() ? 'bg-white/20' : 'bg-black/10'}`}></div>
              </div>
            </div>
          </div>

          {/* Hover Code Card */}
          <div 
            class="bg-[#121212] rounded-3xl p-8 border border-white/5 relative overflow-hidden group cursor-pointer"
            onMouseEnter={() => setHoverPlugin(true)}
            onMouseLeave={() => setHoverPlugin(false)}
          >
            <div class={`absolute inset-0 bg-[#0d1117] p-6 transition-all duration-500 font-mono text-xs overflow-hidden ${hoverPlugin() ? 'opacity-100 z-20 translate-y-0' : 'opacity-0 z-0 translate-y-4'}`}>
              <span class="text-pink-400">package</span> main<br/><br/>
              <span class="text-pink-400">import</span> "github.com/blitzpress/sdk"<br/><br/>
              <span class="text-pink-400">func</span> <span class="text-blue-400">InitPlugin</span>(api sdk.API) {'{'}<br/>
              &nbsp;&nbsp;api.RegisterRoute(<span class="text-amber-300">"/custom"</span>, handler)<br/>
              {'}'}
            </div>

            <div class={`relative z-10 transition-opacity duration-300 ${hoverPlugin() ? 'opacity-0' : 'opacity-100'}`}>
              <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg class="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold mb-2">Compiled Plugins</h3>
              <p class="text-sm text-white/50">Manifest-driven `.so` files mount routes natively. Hover to reveal.</p>
            </div>
          </div>

          {/* DX Card (Spans 2 cols) */}
          <div class="md:col-span-2 bg-gradient-to-br from-indigo-900/20 to-black rounded-3xl p-8 border border-indigo-500/20 flex flex-col justify-end relative overflow-hidden">
            <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
            
            <div class="relative z-10">
              <h3 class="text-2xl font-semibold mb-2">Monorepo DX</h3>
              <p class="text-white/60">Hot reloading, build scripts, and a manager CLI make the platform practical.</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}