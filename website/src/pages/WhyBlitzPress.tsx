import { createSignal, onMount, onCleanup } from "solid-js";
import AnimateOnView from "~/components/AnimateOnView";

export default function WhyBlitzPress() {
  const [scrollProgress, setScrollProgress] = createSignal(0);

  onMount(() => {
    const handleScroll = () => {
      // Calculate how far down the user has scrolled
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate progress between 0 and 1
      const maxScroll = documentHeight - windowHeight;
      const progress = Math.min(Math.max(scrollPos / maxScroll, 0), 1);
      
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Init

    onCleanup(() => window.removeEventListener("scroll", handleScroll));
  });

  return (
    <main class="bg-[#0f0f0f] min-h-screen text-white">
      <div class="page-shell flex flex-col md:flex-row relative">
        
        {/* Left Column: Sticky Manifesto */}
        <div class="w-full md:w-1/2 md:h-screen md:sticky top-0 flex flex-col justify-center py-20 md:py-0 pr-0 md:pr-16">
          <AnimateOnView animation="fade-up">
            <span class="text-emerald-400 font-mono tracking-widest uppercase text-sm mb-6 block">The Manifesto</span>
            <h1 class="text-hero leading-tight mb-8">
              The legacy CMS model is broken. <br/>
              <span class="text-white/40">We rebuilt it for Go.</span>
            </h1>
            <p class="text-subhead max-w-md">
              BlitzPress is not a clone. It's a new platform that respects the extensibility philosophy of classic CMSs while giving teams a cleaner architecture.
            </p>
          </AnimateOnView>

          {/* SVG Illustration that transforms based on scroll */}
          <div class="mt-16 w-full max-w-sm aspect-square relative opacity-80 mix-blend-screen">
            {/* Tangled Wires (Legacy) */}
            <svg class="absolute inset-0 w-full h-full transition-opacity duration-1000" style={{ opacity: 1 - scrollProgress() * 2 }} viewBox="0 0 100 100">
              <path d="M10,50 Q30,10 50,50 T90,50" stroke="#ef4444" stroke-width="2" fill="none" class="animate-pulse"/>
              <path d="M20,20 Q50,90 80,20 T90,80" stroke="#f59e0b" stroke-width="2" fill="none" class="animate-pulse" style="animation-delay: 0.2s"/>
              <path d="M10,80 Q40,10 60,80 T90,10" stroke="#ec4899" stroke-width="2" fill="none" class="animate-pulse" style="animation-delay: 0.4s"/>
            </svg>
            
            {/* Clean Grid (BlitzPress) */}
            <svg class="absolute inset-0 w-full h-full transition-opacity duration-1000" style={{ opacity: scrollProgress() * 2 }} viewBox="0 0 100 100">
              <rect x="10" y="10" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              <rect x="40" y="10" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              <rect x="70" y="10" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              
              <rect x="10" y="40" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              <rect x="40" y="40" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              <rect x="70" y="40" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              
              <rect x="10" y="70" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              <rect x="40" y="70" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              <rect x="70" y="70" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"/>
              
              <path d="M30,20 L40,20 M60,20 L70,20 M30,50 L40,50 M60,50 L70,50 M30,80 L40,80 M60,80 L70,80" stroke="#34d399" stroke-width="1" class="animate-pulse"/>
              <path d="M20,30 L20,40 M20,60 L20,70 M50,30 L50,40 M50,60 L50,70 M80,30 L80,40 M80,60 L80,70" stroke="#34d399" stroke-width="1" class="animate-pulse" style="animation-delay: 0.5s"/>
            </svg>
          </div>
        </div>

        {/* Right Column: Scrollable Arguments */}
        <div class="w-full md:w-1/2 py-28 md:py-[50vh]">
          
          <section class="mb-[40vh]">
            <AnimateOnView animation="fade-up">
              <h2 class="text-section mb-8">The Gap</h2>
              <div class="space-y-12">
                <article>
                  <h3 class="text-headline mb-4 text-red-400">Runtime Structure</h3>
                  <p class="text-white/70 text-lg leading-relaxed">
                    Older extension models make it harder to reason about boundaries, packaging, and lifecycle behavior. Code executes unpredictably across hundreds of global hooks.
                  </p>
                </article>
                <article>
                  <h3 class="text-headline mb-4 text-red-400">Type Guarantees</h3>
                  <p class="text-white/70 text-lg leading-relaxed">
                    Loose contracts slow down teams that want safer integrations and more predictable extension points.
                  </p>
                </article>
              </div>
            </AnimateOnView>
          </section>

          <section>
            <AnimateOnView animation="fade-up">
              <h2 class="text-section mb-8">The Answer</h2>
              <div class="space-y-12">
                <article>
                  <h3 class="text-headline mb-4 text-emerald-400">Go Core</h3>
                  <p class="text-white/70 text-lg leading-relaxed">
                    Performance, concurrency, and explicit application structure become platform defaults. Your CMS is a compiled binary.
                  </p>
                </article>
                <article>
                  <h3 class="text-headline mb-4 text-emerald-400">Stable SDK</h3>
                  <p class="text-white/70 text-lg leading-relaxed">
                    Plugin authors build against a public contract instead of reaching into internal implementation details. Interfaces enforce the law.
                  </p>
                </article>
                <article>
                  <h3 class="text-headline mb-4 text-emerald-400">Runtime-loaded Admin</h3>
                  <p class="text-white/70 text-lg leading-relaxed">
                    Backend and frontend extensibility evolve together rather than living in separate worlds. SolidJS widgets load dynamically.
                  </p>
                </article>
              </div>
            </AnimateOnView>
          </section>

        </div>
      </div>
    </main>
  );
}