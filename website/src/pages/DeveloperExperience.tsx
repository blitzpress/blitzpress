import { createSignal, onMount } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";

export default function DeveloperExperience() {
  const [terminalText, setTerminalText] = createSignal("");
  const [isBuilding, setIsBuilding] = createSignal(false);
  const [buildComplete, setBuildComplete] = createSignal(false);

  const command = "go build -buildmode=plugin -o myplugin.so ./backend.go\nbun run build-frontend";

  onMount(() => {
    // Simulate terminal typing
    let i = 0;
    setIsBuilding(true);
    
    const typeChar = () => {
      if (i < command.length) {
        setTerminalText(command.substring(0, i + 1));
        i++;
        setTimeout(typeChar, Math.random() * 50 + 20); // Random typing speed
      } else {
        // Typing finished, simulate build process
        setTimeout(() => {
          setTerminalText(prev => prev + "\n\n> compiling go code...");
          setTimeout(() => {
            setTerminalText(prev => prev + "\n> generating typescript types...");
            setTimeout(() => {
              setTerminalText(prev => prev + "\n> building solidjs bundle...");
              setTimeout(() => {
                setTerminalText(prev => prev + "\n\n✨ Plugin built successfully in 1.2s.");
                setIsBuilding(false);
                setBuildComplete(true);
              }, 600);
            }, 400);
          }, 500);
        }, 300);
      }
    };

    setTimeout(typeChar, 1000); // Start after 1s
  });

  return (
    <main class="bg-[#020617] min-h-screen text-white pt-32 pb-40">
      <div class="page-shell max-w-6xl">
        
        <header class="text-center mb-24 max-w-3xl mx-auto">
          <AnimateOnView animation="fade-up">
            <h1 class="text-hero leading-tight mb-6">
              Terminal First.
            </h1>
            <p class="text-subhead">
              Built by developers, for developers. Monorepo tools, hot-reloading, and generated type definitions.
            </p>
          </AnimateOnView>
        </header>

        {/* IDE Mockup */}
        <div class="bg-[#0d1117] rounded-xl border border-[#30363d] shadow-2xl overflow-hidden flex flex-col h-[700px] relative">
          
          {/* IDE Header */}
          <div class="bg-[#161b22] border-b border-[#30363d] flex items-center px-4 h-10 gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <div class="ml-4 flex gap-1">
              <div class="bg-[#0d1117] text-white/70 text-xs px-4 py-1.5 rounded-t-md border-t border-x border-[#30363d]">backend.go</div>
              <div class="bg-[#0d1117] text-white/70 text-xs px-4 py-1.5 rounded-t-md border-t border-x border-[#30363d]">frontend.tsx</div>
            </div>
          </div>

          {/* IDE Content */}
          <div class="flex-1 flex relative">
            
            {/* Left Pane: Go */}
            <div class="w-1/2 border-r border-[#30363d] p-6 overflow-y-auto bg-[#0d1117]">
              <pre class="font-mono text-sm leading-relaxed">
                <span class="text-pink-400">package</span> main<br/><br/>
                <span class="text-pink-400">import</span> (<br/>
                &nbsp;&nbsp;<span class="text-blue-300">"github.com/blitzpress/sdk"</span><br/>
                )<br/><br/>
                <span class="text-white/40">// Define the shared contract</span><br/>
                <span class="text-pink-400">type</span> <span class="text-emerald-300">StatsResponse</span> <span class="text-pink-400">struct</span> {'{'}<br/>
                &nbsp;&nbsp;Users <span class="text-pink-400">int</span> <span class="text-amber-300">`json:"users"`</span><br/>
                &nbsp;&nbsp;Revenue <span class="text-pink-400">float64</span> <span class="text-amber-300">`json:"revenue"`</span><br/>
                {'}'}<br/><br/>
                <span class="text-pink-400">func</span> <span class="text-blue-400">GetStats</span>(api sdk.API) {'{'}<br/>
                &nbsp;&nbsp;<span class="text-white/40">// Logic here...</span><br/>
                {'}'}
              </pre>
            </div>

            {/* Right Pane: TSX */}
            <div class="w-1/2 p-6 overflow-y-auto bg-[#0d1117]">
              <pre class="font-mono text-sm leading-relaxed">
                <span class="text-pink-400">import</span> {'{'} createResource {'}'} <span class="text-pink-400">from</span> <span class="text-blue-300">"solid-js"</span>;<br/>
                <span class="text-white/40">// Types auto-generated from Go structs</span><br/>
                <span class="text-pink-400">import type</span> {'{'} StatsResponse {'}'} <span class="text-pink-400">from</span> <span class="text-blue-300">"../types"</span>;<br/><br/>
                <span class="text-pink-400">export default function</span> <span class="text-emerald-300">StatsWidget</span>() {'{'}<br/>
                &nbsp;&nbsp;<span class="text-pink-400">const</span> [stats] = createResource&lt;<span class="text-emerald-300">StatsResponse</span>&gt;(fetchStats);<br/><br/>
                &nbsp;&nbsp;<span class="text-pink-400">return</span> (<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span class="text-blue-400">div</span> class=<span class="text-amber-300">"card"</span>&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Users: {'{'}stats()?.users{'}'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span class="text-blue-400">div</span>&gt;<br/>
                &nbsp;&nbsp;);<br/>
                {'}'}
              </pre>
            </div>

            {/* Glowing Connection Line (SVG) */}
            <svg 
              class={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${buildComplete() ? 'opacity-100' : 'opacity-0'}`}
              style="z-index: 10;"
            >
              {/* Line from Go struct to TS type */}
              <path 
                d="M 350 180 C 450 180, 450 110, 550 110" 
                fill="none" 
                stroke="#10b981" 
                stroke-width="2" 
                stroke-dasharray="6 6"
                class="animate-[dash_1s_linear_infinite]"
              />
              <circle cx="350" cy="180" r="4" fill="#10b981" class="animate-pulse" />
              <circle cx="550" cy="110" r="4" fill="#10b981" class="animate-pulse" />
              
              <rect x="400" y="130" width="100" height="24" rx="12" fill="#10b981" opacity="0.2" />
              <text x="450" y="146" fill="#34d399" font-family="monospace" font-size="10" text-anchor="middle">Types Synced</text>
            </svg>

          </div>

          {/* Terminal Pane (Bottom) */}
          <div class="h-[250px] bg-[#010409] border-t border-[#30363d] p-4 flex flex-col relative">
            <div class="text-white/40 text-xs font-mono uppercase tracking-widest mb-2 flex justify-between">
              <span>Terminal</span>
              {isBuilding() && <span class="text-emerald-500 animate-pulse">Building...</span>}
            </div>
            <div class="flex-1 font-mono text-sm overflow-y-auto">
              <span class="text-emerald-400">~/blitzpress</span> <span class="text-blue-400">$</span> 
              <span class="text-white whitespace-pre-wrap ml-2">{terminalText()}<span class="animate-pulse font-bold">_</span></span>
            </div>
            
            {/* Success Glow Overlay on Terminal */}
            <div class={`absolute inset-0 bg-emerald-500/5 transition-opacity duration-1000 pointer-events-none ${buildComplete() ? 'opacity-100' : 'opacity-0'}`}></div>
          </div>

        </div>

      </div>
    </main>
  );
}