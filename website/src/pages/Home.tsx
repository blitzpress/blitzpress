import { A } from "@solidjs/router";
import { createSignal, onMount, onCleanup, For } from "solid-js";
import {
  homeArchitectureSteps,
  homeFeatureCards,
  homeHighlights,
} from "~/site-content";
import AnimateOnView from "~/components/AnimateOnView";
import InteractiveArchitecture from "~/components/InteractiveArchitecture";
import PeelBackLayers from "~/components/PeelBackLayers";

export default function Home() {
  const [mousePos, setMousePos] = createSignal({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = createSignal(0);

  onMount(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth) - 0.5, 
        y: (e.clientY / window.innerHeight) - 0.5 
      });
    };

    const handleScroll = () => {
      setScrollPos(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    
    onCleanup(() => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    });
  });

  return (
    <main class="bg-[#050505] min-h-screen text-white selection:bg-emerald-500/30 overflow-hidden">
      
      {/* 1. HERO SECTION: Immersive, Parallax, Typography-First */}
      <section class="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        
        {/* Dynamic Gradient Backgrounds (Item 1) */}
        <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Ambient Mesh Glow */}
          <div 
            class="absolute top-1/4 left-[10%] w-[40vw] h-[40vw] bg-emerald-500/10 rounded-full blur-[120px] transition-transform duration-1000 ease-out mix-blend-screen"
            style={{ transform: `translate(${mousePos().x * -100}px, ${mousePos().y * -100}px)` }}
          ></div>
          <div 
            class="absolute bottom-1/4 right-[10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[150px] transition-transform duration-1000 ease-out mix-blend-screen"
            style={{ transform: `translate(${mousePos().x * 100}px, ${mousePos().y * 100}px)` }}
          ></div>
          
          {/* Interactive Particle/Circuit System (Item 2) */}
          <svg class="absolute inset-0 w-full h-full opacity-20" style={{ transform: `translateY(${scrollPos() * 0.2}px)` }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Floating connecting lines */}
            <path d="M 20% 80% Q 50% 50% 80% 20%" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="4 8" class="animate-[dash_20s_linear_infinite]" />
            <path d="M 10% 30% C 30% 90%, 70% 90%, 90% 30%" fill="none" stroke="#6366f1" stroke-width="1" stroke-dasharray="4 8" class="animate-[dash_20s_linear_infinite_reverse]" />
            
            {/* Orbiting Nodes */}
            <circle cx="50%" cy="50%" r="200" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
            <circle cx="20%" cy="80%" r="4" fill="#10b981" class="animate-pulse" />
            <circle cx="80%" cy="20%" r="4" fill="#10b981" class="animate-pulse" style="animation-delay: 1s;" />
            <circle cx="90%" cy="30%" r="4" fill="#6366f1" class="animate-pulse" style="animation-delay: 0.5s;" />
          </svg>
        </div>

        {/* Hero Content */}
        <div class="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">
          <AnimateOnView animation="fade-up">
            <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 text-sm font-mono tracking-widest uppercase text-white/60">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              WordPress-style extensibility, rebuilt for Go
            </div>
          </AnimateOnView>

          <AnimateOnView animation="fade-up" delay={100}>
            {/* Typing animation effect (Item 3) */}
            <h1 class="text-[clamp(48px,8vw,100px)] font-bold leading-[1.05] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              A Go-powered CMS <br/> with compiled plugins.
            </h1>
          </AnimateOnView>

          <AnimateOnView animation="fade-up" delay={200}>
            <p class="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light">
              BlitzPress keeps the plugin mindset teams already understand, then rebuilds the
              platform around typed contracts, runtime-loaded extensions, and a cleaner system
              model.
            </p>
          </AnimateOnView>

          <AnimateOnView animation="fade-up" delay={300}>
            {/* Magnetic Buttons (Item 3) - Simulated with CSS transforms on hover */}
            <div class="flex flex-wrap justify-center gap-6 pt-12">
              <A 
                class="group relative px-8 py-4 bg-white !text-black text-lg font-medium rounded-2xl overflow-hidden transition-transform hover:scale-105 active:scale-95" 
                href="/features"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span class="relative z-10 flex items-center gap-2 !text-black">
                  Explore platform
                  <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </A>
              <A 
                class="px-8 py-4 border border-white/20 text-white hover:bg-white/5 text-lg font-medium rounded-2xl backdrop-blur-md transition-all hover:border-white/40" 
                href="/plugin-system"
              >
                View architecture
              </A>
            </div>
          </AnimateOnView>
        </div>

        {/* Scroll Indicator */}
        <div class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
          <span class="text-xs font-mono tracking-widest uppercase">Scroll</span>
          <div class="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* 2. THE HOOK: Peel Back the Layers (Item 8) */}
      <section class="py-32 md:py-48 relative z-20 border-t border-white/5 bg-[#0a0a0a]">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        <AnimateOnView animation="fade-up">
          <PeelBackLayers />
        </AnimateOnView>
      </section>

      {/* 3. VALUE PROP: Sticky Scroll Storytelling (Item 11) */}
      <section class="py-32 md:py-48 relative border-t border-white/5 bg-black">
        <div class="page-shell">
          <div class="flex flex-col lg:flex-row gap-20">
            
            {/* Sticky Left Column */}
            <div class="lg:w-5/12 lg:sticky top-32 h-fit space-y-8">
              <AnimateOnView animation="fade-up">
                <h2 class="text-[clamp(40px,5vw,64px)] font-bold leading-[1.1] tracking-tight">
                  Keep the flexibility. <br/>
                  <span class="text-white/40">Replace the assumptions.</span>
                </h2>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={100}>
                <p class="text-xl text-white/50 leading-relaxed">
                  Traditional CMS platforms proved the value of hooks and ecosystems. BlitzPress keeps
                  that insight while modernizing the runtime, extension boundaries, and admin model.
                </p>
              </AnimateOnView>
            </div>

            {/* Scrolling Right Column */}
            <div class="lg:w-7/12 space-y-32 pt-16 lg:pt-0">
              <For each={homeHighlights}>
                {(item, index) => (
                  <AnimateOnView animation="fade-up">
                    <div class="relative pl-8 md:pl-12 border-l border-white/10 group">
                      {/* Animated border glow on hover */}
                      <div class="absolute left-[-1px] top-0 w-[2px] h-0 bg-emerald-500 group-hover:h-full transition-all duration-500 ease-out"></div>
                      
                      <div class="text-emerald-400 font-mono text-sm tracking-widest uppercase mb-4">{item.eyebrow}</div>
                      <h3 class="text-3xl font-semibold mb-6">{item.title}</h3>
                      <p class="text-white/60 text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </AnimateOnView>
                )}
              </For>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DEEP DIVE: Interactive Architecture Diagram (Item 12) */}
      <section class="py-32 md:py-48 relative border-t border-white/5 bg-[#050505] overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>
        
        <div class="page-shell relative z-10">
          <div class="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <AnimateOnView animation="fade-up">
              <h2 class="text-5xl font-bold tracking-tight">Architecture Preview</h2>
            </AnimateOnView>
            <AnimateOnView animation="fade-up" delay={100}>
              <p class="text-xl text-white/50">
                The core binary, plugin runtime, embedded admin, and shared frontend modules fit
                together cleanly. Interact with the map below to see the data flow.
              </p>
            </AnimateOnView>
          </div>
          
          <AnimateOnView animation="fade-up" delay={200}>
            {/* Glass Morphism Effects (Item 10) applied inside the architecture wrapper */}
            <div class="p-2 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.02)]">
              <InteractiveArchitecture />
            </div>
          </AnimateOnView>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pt-20">
            <For each={homeArchitectureSteps}>
              {(item, index) => (
                <AnimateOnView animation="fade-up" delay={(index() * 100) as 0 | 100 | 200 | 300 | 400 | 500 | 600}>
                  <div class="space-y-4">
                    <div class="text-white/20 font-mono text-3xl font-bold">{item.eyebrow}</div>
                    <h3 class="text-xl font-semibold text-white/90">{item.title}</h3>
                    <p class="text-white/50 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </AnimateOnView>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* 5. THE PROOF: Feature Cards (Bento style, Glass Morphism) */}
      <section class="py-32 md:py-48 relative border-t border-white/5 bg-[#0a0a0a]">
        <div class="page-shell">
          <div class="max-w-3xl mb-24 space-y-6">
            <AnimateOnView animation="fade-up">
              <h2 class="text-5xl font-bold tracking-tight">Four reasons it feels different.</h2>
            </AnimateOnView>
            <AnimateOnView animation="fade-up" delay={100}>
              <p class="text-xl text-white/50">
                The point is not one isolated feature. It is the way the core, plugin runtime,
                frontend extensibility, and developer workflow reinforce each other.
              </p>
            </AnimateOnView>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <For each={homeFeatureCards}>
              {(item, index) => (
                <AnimateOnView animation="fade-up" delay={(index() * 100) as 0 | 100 | 200 | 300 | 400 | 500 | 600}>
                  {/* Glass Morphism Cards (Item 10) */}
                  <article class="h-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] overflow-hidden group hover:bg-white/[0.04] transition-colors duration-500 relative flex flex-col">
                    {/* Ambient glow behind the text */}
                    <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors duration-500"></div>
                    
                    <div class="p-10 md:p-12 space-y-6 flex-1 relative z-10">
                      <div class="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 font-mono text-xs uppercase tracking-widest">
                        {item.eyebrow}
                      </div>
                      <h3 class="text-3xl font-semibold text-white/90">{item.title}</h3>
                      <p class="text-white/50 text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </article>
                </AnimateOnView>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* 6. CTA: Clean, Massive, Unignorable */}
      <section class="py-40 relative border-t border-white/5 bg-black overflow-hidden flex justify-center">
        {/* Radial gradient burst */}
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        
        <div class="relative z-10 text-center max-w-4xl px-6 space-y-10">
          <AnimateOnView animation="fade-up">
            <h2 class="text-[clamp(48px,6vw,80px)] font-bold tracking-tight leading-[1.1]">
              Start with the product story.
            </h2>
          </AnimateOnView>
          <AnimateOnView animation="fade-up" delay={100}>
            <p class="text-2xl text-white/50 font-light">
              BlitzPress makes the most sense when you see how the CMS surface, plugin runtime,
              and developer workflow connect into one platform.
            </p>
          </AnimateOnView>
          <AnimateOnView animation="fade-up" delay={200}>
            <div class="flex flex-wrap justify-center gap-6 pt-8">
              <A 
                class="px-10 py-5 bg-white !text-black text-xl font-medium rounded-2xl transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]" 
                href="/get-started"
              >
                Get started
              </A>
              <A 
                class="px-10 py-5 border-2 border-white/20 text-white hover:bg-white/10 text-xl font-medium rounded-2xl transition-colors" 
                href="/developer-experience"
              >
                See developer experience
              </A>
            </div>
          </AnimateOnView>
        </div>
      </section>

    </main>
  );
}