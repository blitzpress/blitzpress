import { createSignal } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";

type HotspotId = 'nav' | 'widget' | 'table';

export default function AdminExperience() {
  const [activeSpot, setActiveSpot] = createSignal<HotspotId | null>(null);

  const getCodeSnippet = () => {
    switch (activeSpot()) {
      case 'nav':
        return `// Registering a new nav item from a plugin
import { Registry } from "@blitzpress/ui";

Registry.addNav({
  id: "plugin-x-dashboard",
  label: "Analytics",
  icon: ChartIcon,
  path: "/admin/analytics"
});`;
      case 'widget':
        return `// Injecting a dashboard widget dynamically
import { createSignal } from "solid-js";
import { Registry } from "@blitzpress/ui";

function RevenueWidget() {
  const [rev] = createSignal("$12,450");
  return <div class="card">{rev()}</div>;
}

Registry.addWidget("dashboard-top", RevenueWidget);`;
      case 'table':
        return `// Extending a core data table with a custom column
import { Registry } from "@blitzpress/ui";

Registry.addTableColumn("users-list", {
  id: "loyalty-tier",
  header: "Tier",
  cell: (row) => <Badge>{row.tier}</Badge>
});`;
      default:
        return "";
    }
  };

  return (
    <main class="bg-[#050505] min-h-screen text-white relative overflow-hidden">
      
      {/* Intro Header */}
      <div class="absolute top-0 left-0 w-full z-20 pointer-events-none p-12 bg-gradient-to-b from-black/80 to-transparent h-48">
        <h1 class="text-3xl md:text-5xl font-bold tracking-tight">The Product Illusion</h1>
        <p class="text-white/60 mt-2 max-w-xl text-sm md:text-base">
          To the editor, it's one seamless CMS. To the developer, it's a deeply extensible runtime. Click the glowing hotspots to see how plugins inject UI components.
        </p>
      </div>

      {/* Immersive Admin Mockup (Takes up full viewport) */}
      <div class="w-full h-screen flex items-center justify-center p-4 md:p-12 pt-32">
        <div class="w-full max-w-[1400px] h-full max-h-[800px] bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden relative">
          
          {/* Sidebar Nav */}
          <aside class="w-64 border-r border-white/5 p-6 flex flex-col gap-8 relative group">
            <div class="text-xl font-bold text-white tracking-tight">BlitzPress</div>
            <nav class="space-y-2">
              <div class="h-8 bg-white/10 rounded w-3/4"></div>
              <div class="h-8 bg-white/5 rounded w-full"></div>
              <div class="h-8 bg-white/5 rounded w-5/6"></div>
              
              {/* Plugin Injected Nav Item */}
              <div class="h-8 bg-indigo-500/20 border border-indigo-500/50 rounded w-full mt-8 relative">
                {/* Hotspot */}
                <button 
                  onClick={() => setActiveSpot('nav')}
                  class={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-transform ${activeSpot() === 'nav' ? 'scale-125 bg-indigo-500' : 'bg-indigo-400 animate-pulse'}`}
                >
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div class="flex-1 p-10 bg-[#0b0f19] overflow-y-auto">
            <header class="mb-10 flex justify-between items-center">
              <h2 class="text-3xl font-semibold">Dashboard</h2>
              <div class="w-10 h-10 bg-white/10 rounded-full"></div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div class="bg-[#1e293b] p-6 rounded-xl border border-white/5 h-32"></div>
              <div class="bg-[#1e293b] p-6 rounded-xl border border-white/5 h-32"></div>
              
              {/* Plugin Injected Widget */}
              <div class="bg-gradient-to-br from-emerald-900/40 to-[#1e293b] p-6 rounded-xl border border-emerald-500/30 h-32 relative">
                {/* Hotspot */}
                <button 
                  onClick={() => setActiveSpot('widget')}
                  class={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-transform ${activeSpot() === 'widget' ? 'scale-125 bg-emerald-500' : 'bg-emerald-400 animate-pulse'}`}
                >
                  <div class="w-3 h-3 bg-white rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Core Data Table */}
            <div class="bg-[#1e293b] rounded-xl border border-white/5 overflow-hidden">
              <div class="p-6 border-b border-white/5">
                <div class="w-32 h-6 bg-white/10 rounded"></div>
              </div>
              <div class="p-6 space-y-4 relative">
                {/* Plugin Injected Column in Table */}
                <div class="absolute right-12 top-0 bottom-0 w-32 bg-amber-500/5 border-x border-amber-500/20 z-0"></div>
                
                {/* Hotspot */}
                <button 
                  onClick={() => setActiveSpot('table')}
                  class={`absolute right-24 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-transform ${activeSpot() === 'table' ? 'scale-125 bg-amber-500' : 'bg-amber-400 animate-pulse'}`}
                >
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </button>

                <div class="flex items-center justify-between relative z-10">
                  <div class="w-48 h-4 bg-white/10 rounded"></div>
                  <div class="w-24 h-6 bg-amber-500/20 border border-amber-500/50 rounded-full"></div>
                </div>
                <div class="flex items-center justify-between relative z-10">
                  <div class="w-56 h-4 bg-white/10 rounded"></div>
                  <div class="w-24 h-6 bg-amber-500/20 border border-amber-500/50 rounded-full"></div>
                </div>
                <div class="flex items-center justify-between relative z-10">
                  <div class="w-40 h-4 bg-white/10 rounded"></div>
                  <div class="w-24 h-6 bg-amber-500/20 border border-amber-500/50 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Reveal Overlay (Slides in from right when hotspot clicked) */}
          <div 
            class={`absolute top-0 right-0 w-full md:w-96 h-full bg-[#0a0a0a] border-l border-white/10 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ease-out flex flex-col ${activeSpot() ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
              <h3 class="text-lg font-mono text-white/80">extension.tsx</h3>
              <button onClick={() => setActiveSpot(null)} class="text-white/40 hover:text-white">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 flex-1 bg-black overflow-y-auto">
              <pre class="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                <code>{getCodeSnippet()}</code>
              </pre>
            </div>
            <div class="p-6 bg-[#111] border-t border-white/10">
              <p class="text-sm text-white/50 leading-relaxed">
                Plugins register SolidJS components at runtime. The core UI provides the slots; the plugins provide the renders. No `iframe`s.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}