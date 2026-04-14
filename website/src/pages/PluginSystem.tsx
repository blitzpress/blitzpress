import { createSignal, onMount, onCleanup } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";

export default function PluginSystem() {
  const [scrollProgress, setScrollProgress] = createSignal(0);

  onMount(() => {
    const handleScroll = () => {
      // Calculate progress across a massive vertical scroll container (e.g. 400vh)
      const container = document.getElementById('assembly-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far through the container we are (0 to 1)
      const maxScroll = rect.height - windowHeight;
      const progress = Math.min(Math.max(-rect.top / maxScroll, 0), 1);
      
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    onCleanup(() => window.removeEventListener("scroll", handleScroll));
  });

  return (
    <main class="bg-[#0a0a0a] text-white">
      {/* Intro Section */}
      <section class="py-32 page-shell min-h-[50vh] flex flex-col justify-center">
        <AnimateOnView animation="fade-up">
          <h1 class="text-hero leading-tight mb-6">
            The Assembly Line
          </h1>
          <p class="text-subhead max-w-2xl">
            From code to compiled binary to dynamic admin interface. Watch how a BlitzPress plugin moves through the system. Scroll to begin.
          </p>
        </AnimateOnView>
      </section>

      {/* Horizontal Scroll Container */}
      <div id="assembly-container" class="h-[400vh] relative">
        <div class="sticky top-0 h-screen w-full overflow-hidden bg-[#111] border-y border-white/10 flex items-center">
          
          {/* Track Line (Background) */}
          <div class="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>

          {/* The scrolling track */}
          <div 
            class="flex items-center gap-32 px-[10vw] transition-transform duration-100 ease-linear z-10 w-max"
            style={{ transform: `translateX(-${scrollProgress() * 75}vw)` }}
          >
            
            {/* Step 1: Code */}
            <div class="w-[40vw] max-w-lg shrink-0">
              <div class="bg-black border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl">
                <pre class="font-mono text-sm text-white/70 overflow-hidden">
                  <span class="text-emerald-400">package</span> main<br/><br/>
                  <span class="text-emerald-400">import</span> "github.com/blitzpress/sdk"<br/><br/>
                  <span class="text-white/30">// The origin</span>
                </pre>
              </div>
              <h2 class="text-2xl font-bold mb-2 text-white">1. Authoring</h2>
              <p class="text-white/50 text-sm">Write standard Go code against a stable, typed SDK. No messy global hooks.</p>
            </div>

            {/* Step 2: Compile */}
            <div class="w-[40vw] max-w-lg shrink-0">
              <div class="bg-[#1a1a1a] border border-amber-500/20 rounded-2xl p-8 mb-8 flex items-center justify-center h-48 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent animate-pulse"></div>
                <div class="font-mono text-xl text-amber-400 font-bold tracking-widest relative z-10">
                  go build -buildmode=plugin
                </div>
              </div>
              <h2 class="text-2xl font-bold mb-2 text-white">2. Compilation</h2>
              <p class="text-white/50 text-sm">The Go compiler turns your code into a self-contained `.so` file. Safe, fast, immutable.</p>
            </div>

            {/* Step 3: Core Load */}
            <div class="w-[40vw] max-w-lg shrink-0">
              <div class="bg-[#0f172a] border border-indigo-500/30 rounded-2xl p-8 mb-8 h-48 flex items-center justify-center relative">
                <div class="absolute w-16 h-16 border-4 border-indigo-500 rounded-full animate-[spin_3s_linear_infinite]"></div>
                <div class="font-mono text-indigo-300 font-bold z-10 bg-[#0f172a] px-4 py-2 rounded-lg border border-indigo-500/50">Core Binary</div>
              </div>
              <h2 class="text-2xl font-bold mb-2 text-white">3. Core Mounting</h2>
              <p class="text-white/50 text-sm">BlitzPress discovers the `.so` file, validates its manifest, and mounts its API routes natively.</p>
            </div>

            {/* Step 4: Frontend UI */}
            <div class="w-[40vw] max-w-lg shrink-0">
              <div class="bg-white border border-white/20 rounded-2xl p-8 mb-8 h-48 flex flex-col relative overflow-hidden">
                <div class="w-full h-6 bg-gray-200 rounded mb-4"></div>
                <div class="flex-1 flex gap-4">
                  <div class="w-1/3 h-full bg-gray-200 rounded"></div>
                  <div class="w-2/3 h-full bg-emerald-100 border-2 border-emerald-500 border-dashed rounded flex items-center justify-center">
                    <span class="text-emerald-700 font-bold text-xs uppercase tracking-widest">New Widget</span>
                  </div>
                </div>
              </div>
              <h2 class="text-2xl font-bold mb-2 text-white">4. Admin Extension</h2>
              <p class="text-white/50 text-sm">SolidJS modules load at runtime. Your plugin's UI injects directly into the admin dashboard seamlessly.</p>
            </div>

          </div>

          {/* Animated .so block following the track */}
          <div 
            class="absolute top-1/2 left-[10vw] w-12 h-12 bg-white rounded-lg -translate-y-1/2 z-20 shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center font-mono text-[10px] font-bold text-black"
            style={{ transform: `translate(calc(${scrollProgress() * 65}vw), -50%)` }}
          >
            .so
          </div>

        </div>
      </div>
      
      {/* Footer Buffer */}
      <section class="py-32 page-shell flex justify-center">
        <p class="text-white/30 text-sm font-mono">End of line.</p>
      </section>
    </main>
  );
}