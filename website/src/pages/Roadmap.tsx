import { createSignal, onMount, onCleanup, For } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";

interface Milestone {
  title: string;
  status: 'past' | 'current' | 'future';
  description: string;
}

const milestones: Milestone[] = [
  { title: "Core Plugin Runtime", status: "past", description: "Dynamic loading of Go .so files via `plugin` package. Basic routing." },
  { title: "SolidJS Embed", status: "past", description: "Embedding the compiled frontend directly into the Go binary." },
  { title: "Plugin Manifests", status: "past", description: "JSON validation for extension contracts and dependencies." },
  { title: "Dynamic Admin UI", status: "current", description: "Plugins registering frontend widgets at runtime without rebuilding the core app." },
  { title: "Database Layer", status: "future", description: "Shared ORM/DB connections between core and loaded plugins." },
  { title: "Manager CLI", status: "future", description: "Scaffolding new plugins and managing updates from the terminal." },
  { title: "v1.0 Release", status: "future", description: "Stable API contracts and public launch." },
];

export default function Roadmap() {
  const [scrollProgress, setScrollProgress] = createSignal(0);

  onMount(() => {
    const handleScroll = () => {
      const container = document.getElementById('roadmap-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // We want progress based on how far the container is scrolled through the viewport
      const start = rect.top - windowHeight / 2; // When container hits middle of screen
      const total = rect.height;
      const rawProgress = -start / total;
      
      setScrollProgress(Math.min(Math.max(rawProgress, 0), 1));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    onCleanup(() => window.removeEventListener("scroll", handleScroll));
  });

  return (
    <main class="bg-[#0f0f0f] min-h-screen text-white pt-32 pb-60">
      <div class="page-shell max-w-4xl">
        
        <header class="text-center mb-32">
          <AnimateOnView animation="fade-up">
            <h1 class="text-hero leading-tight mb-6">
              The Living Journey.
            </h1>
            <p class="text-subhead max-w-2xl mx-auto">
              Our transparent roadmap from initial prototype to v1.0. We build in the open.
            </p>
          </AnimateOnView>
        </header>

        <div id="roadmap-container" class="relative">
          
          {/* Vertical SVG Line (Background) */}
          <div class="absolute top-0 bottom-0 left-4 md:left-1/2 md:-ml-0.5 w-1 bg-white/10 z-0"></div>
          
          {/* Vertical SVG Line (Foreground/Scroll animated) */}
          <div 
            class="absolute top-0 left-4 md:left-1/2 md:-ml-0.5 w-1 bg-emerald-500 z-10 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ height: `${scrollProgress() * 100}%` }}
          ></div>

          <div class="space-y-32 relative z-20">
            <For each={milestones}>
              {(item, index) => {
                const isLeft = index() % 2 === 0;
                
                return (
                  <div class={`flex flex-col md:flex-row items-center w-full ${isLeft ? 'md:justify-start' : 'md:justify-end'}`}>
                    
                    {/* Content Box */}
                    <div class={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'} relative`}>
                      
                      {/* Node Circle */}
                      <div class={`absolute left-2 md:left-auto ${isLeft ? 'md:-right-3' : 'md:-left-3'} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-20
                        ${item.status === 'past' ? 'bg-emerald-500' : 
                          item.status === 'current' ? 'bg-[#0f0f0f] border-2 border-emerald-500' : 
                          'bg-[#0f0f0f] border-2 border-white/20 border-dashed'}
                      `}>
                        {/* Current Node Radar Sweep */}
                        {item.status === 'current' && (
                          <>
                            <div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          </>
                        )}
                        {/* Past Node Check */}
                        {item.status === 'past' && (
                          <svg class="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <AnimateOnView animation={isLeft ? 'slide-right' : 'slide-left'}>
                        <div class={`p-8 rounded-2xl border transition-colors duration-500
                          ${item.status === 'past' ? 'bg-[#121212] border-emerald-500/20' : 
                            item.status === 'current' ? 'bg-gradient-to-br from-emerald-900/20 to-[#121212] border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 
                            'bg-transparent border-white/10 border-dashed opacity-50'}
                        `}>
                          <div class="text-xs font-mono tracking-widest uppercase mb-3">
                            {item.status === 'past' ? <span class="text-emerald-500">Shipped</span> : 
                             item.status === 'current' ? <span class="text-emerald-400 animate-pulse">In Progress</span> : 
                             <span class="text-white/40">Planned</span>}
                          </div>
                          <h3 class={`text-2xl font-bold mb-3 ${item.status === 'future' ? 'text-white/60' : 'text-white'}`}>
                            {item.title}
                          </h3>
                          <p class={`${item.status === 'future' ? 'text-white/40' : 'text-white/70'} leading-relaxed`}>
                            {item.description}
                          </p>
                        </div>
                      </AnimateOnView>

                    </div>
                  </div>
                );
              }}
            </For>
          </div>

        </div>

      </div>
    </main>
  );
}