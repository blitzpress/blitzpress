import { createSignal, onMount } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";
import { A } from "@solidjs/router";

export default function GetStarted() {
  const [step, setStep] = createSignal<"initial" | "simulating" | "success">("initial");
  const [logs, setLogs] = createSignal<string[]>([]);

  const runSimulation = () => {
    setStep("simulating");
    setLogs([]);

    const simulationSteps = [
      { text: "> git clone https://github.com/blitzpress/blitzpress", delay: 500 },
      { text: "Cloning into 'blitzpress'...", delay: 1000 },
      { text: "remote: Enumerating objects: 1024, done.", delay: 1500 },
      { text: "remote: Counting objects: 100% (1024/1024), done.", delay: 1800 },
      { text: "> cd blitzpress && ./scripts/build-all.sh", delay: 2500 },
      { text: "[Go] Compiling core binary...", delay: 3000 },
      { text: "[Bun] Installing frontend dependencies...", delay: 3500 },
      { text: "[Bun] Building SolidJS admin panel...", delay: 4500 },
      { text: "[Plugin] Building example-plugin.so...", delay: 5000 },
      { text: "✨ Build complete! Starting server...", delay: 5500 },
      { text: "🚀 BlitzPress running at http://localhost:8080", delay: 6000 },
    ];

    simulationSteps.forEach(({ text, delay }, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, text]);
        // Auto scroll to bottom of logs
        const terminal = document.getElementById("terminal-logs");
        if (terminal) terminal.scrollTop = terminal.scrollHeight;

        if (index === simulationSteps.length - 1) {
          setTimeout(() => setStep("success"), 1000);
        }
      }, delay);
    });
  };

  return (
    <main class="bg-[#020617] min-h-screen text-white flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-2xl text-center">
        
        <AnimateOnView animation="fade-up">
          <h1 class="text-hero leading-tight mb-6">
            The Launchpad.
          </h1>
          <p class="text-subhead max-w-xl mx-auto mb-16">
            Ready to build? Experience the frictionless installation process right here in the browser.
          </p>
        </AnimateOnView>

        {/* Wizard Container */}
        <div class="relative w-full h-[400px] perspective-1000">
          
          {/* Step 1: Initial Prompt */}
          <div 
            class={`absolute inset-0 bg-[#0d1117] rounded-3xl border border-white/10 p-12 shadow-2xl flex flex-col items-center justify-center transition-all duration-700 ease-in-out transform-gpu origin-bottom
              ${step() === 'initial' ? 'opacity-100 scale-100 translate-y-0 rotate-x-0' : 'opacity-0 scale-95 translate-y-10 rotate-x-12 pointer-events-none'}`}
          >
            <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold mb-2">Simulate Installation</h2>
            <p class="text-white/50 mb-8">Watch the build scripts compile the Go core and SolidJS frontend.</p>
            <button 
              onClick={runSimulation}
              class="px-8 py-4 bg-white !text-black font-semibold rounded-full hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Start Simulation
            </button>
          </div>

          {/* Step 2: Simulating (Terminal) */}
          <div 
            class={`absolute inset-0 bg-black rounded-3xl border border-[#30363d] p-6 shadow-2xl flex flex-col text-left transition-all duration-700 ease-in-out transform-gpu origin-bottom
              ${step() === 'simulating' ? 'opacity-100 scale-100 translate-y-0 rotate-x-0' : 
                step() === 'initial' ? 'opacity-0 scale-105 -translate-y-10 -rotate-x-12 pointer-events-none' : 
                'opacity-0 scale-95 translate-y-10 rotate-x-12 pointer-events-none'}`}
          >
            <div class="flex items-center gap-2 mb-4 border-b border-[#30363d] pb-4">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="ml-2 text-white/40 font-mono text-xs">Terminal</span>
            </div>
            <div id="terminal-logs" class="flex-1 overflow-y-auto font-mono text-sm space-y-2 scroll-smooth">
              {logs().map(log => (
                <div class="text-white/80">
                  {log.startsWith('>') ? <span class="text-emerald-400 font-bold">{log}</span> : 
                   log.includes('✨') || log.includes('🚀') ? <span class="text-blue-400 font-bold">{log}</span> : 
                   log}
                </div>
              ))}
              <div class="w-2 h-4 bg-white/50 animate-pulse mt-2"></div>
            </div>
          </div>

          {/* Step 3: Success Card */}
          <div 
            class={`absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-[#0d1117] rounded-3xl border border-emerald-500/50 p-12 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center transition-all duration-700 ease-in-out transform-gpu origin-bottom
              ${step() === 'success' ? 'opacity-100 scale-100 translate-y-0 rotate-x-0' : 'opacity-0 scale-105 -translate-y-10 -rotate-x-12 pointer-events-none'}`}
          >
            <div class="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 relative">
              <div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
              <svg class="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold mb-2 text-white">System Ready</h2>
            <p class="text-emerald-400/80 mb-8 font-mono text-sm">The actual installation is just as fast.</p>
            
            <div class="flex gap-4 w-full max-w-md">
              <button 
                onClick={() => setStep('initial')}
                class="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
              >
                Restart
              </button>
              <a 
                href="https://github.com/blitzpress/blitzpress" 
                target="_blank" 
                rel="noreferrer"
                class="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)] flex justify-center items-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}