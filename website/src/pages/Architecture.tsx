import AnimateOnView from "~/components/AnimateOnView";
import InteractiveArchitecture from "~/components/InteractiveArchitecture";

export default function Architecture() {
  return (
    <main class="bg-[#030712] min-h-screen text-white pt-32 pb-40">
      <div class="page-shell flex flex-col items-center">
        
        <header class="text-center mb-16 max-w-3xl">
          <AnimateOnView animation="fade-up">
            <span class="text-blue-400 font-mono tracking-widest uppercase text-sm mb-6 block">System Design</span>
            <h1 class="text-hero leading-tight mb-6">
              The Blueprint.
            </h1>
            <p class="text-subhead">
              A comprehensive view of the BlitzPress runtime. Click on any node to dive into its specific responsibilities and lifecycle.
            </p>
          </AnimateOnView>
        </header>

        {/* The Blueprint Canvas */}
        <div class="w-full max-w-[1200px] h-[800px] bg-[#0b0f19] border border-blue-500/20 rounded-3xl p-2 relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          {/* Blueprint Grid Background */}
          <div class="absolute inset-0 opacity-10 pointer-events-none" style={{
            "background-image": "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
            "background-size": "20px 20px"
          }}></div>
          
          <div class="w-full h-full rounded-2xl overflow-hidden relative z-10">
            {/* Reuse the InteractiveArchitecture component we built earlier */}
            <InteractiveArchitecture />
          </div>

          {/* Blueprint Accents */}
          <div class="absolute bottom-6 right-6 font-mono text-[10px] text-blue-500/50 text-right pointer-events-none">
            <p>REV 1.0 - BLITZPRESS CORE</p>
            <p>DRAWING: SYS-ARCH-001</p>
            <p>SCALE: NOT TO SCALE</p>
          </div>
          <div class="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-blue-500/30 rounded-tl-xl pointer-events-none"></div>
          <div class="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-blue-500/30 rounded-bl-xl pointer-events-none"></div>
          <div class="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-blue-500/30 rounded-tr-xl pointer-events-none"></div>
        </div>

      </div>
    </main>
  );
}