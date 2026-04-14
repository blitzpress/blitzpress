import { createSignal, For } from "solid-js";

type LayerId = 'frontend' | 'plugins' | 'backend';

interface Layer {
  id: LayerId;
  title: string;
  subtitle: string;
  description: string;
  colorClass: string;
  codeSnippet: string;
}

const layers: Layer[] = [
  {
    id: 'frontend',
    title: 'SolidJS Admin UI',
    subtitle: 'The Presentation Layer',
    description: 'Dynamic frontend that composes UI widgets from both core and loaded plugins without requiring a build step.',
    colorClass: 'from-blue-600/20 to-blue-900/40 border-blue-500/30',
    codeSnippet: `import { render } from "solid-js/web";\nimport { PluginRegistry } from "@blitzpress/sdk";\n\n// Load plugin modules at runtime\nPluginRegistry.loadAll();\n\nrender(() => <AdminApp />, document.getElementById("app"));`
  },
  {
    id: 'plugins',
    title: 'Compiled Plugins (.so)',
    subtitle: 'The Extension Layer',
    description: 'Go plugins loaded at runtime. They mount routes, add database models, and hook into core events natively.',
    colorClass: 'from-purple-600/20 to-purple-900/40 border-purple-500/30',
    codeSnippet: `package main\n\nimport "github.com/blitzpress/sdk"\n\n// Plugin entry point\nfunc InitPlugin(api sdk.API) {\n    api.RegisterRoute("/custom", myHandler)\n    api.AddAdminWidget("dashboard", MyWidget)\n}`
  },
  {
    id: 'backend',
    title: 'Go Core Binary',
    subtitle: 'The Foundation',
    description: 'High-performance Go server managing the database, authentication, and the plugin lifecycle.',
    colorClass: 'from-emerald-600/20 to-emerald-900/40 border-emerald-500/30',
    codeSnippet: `package main\n\nimport "github.com/blitzpress/core"\n\nfunc main() {\n    app := core.New()\n    \n    // Discover and load .so files\n    app.LoadPlugins("./plugins")\n    \n    app.Start(":8080")\n}`
  }
];

export default function PeelBackLayers() {
  const [peeledLayers, setPeeledLayers] = createSignal<LayerId[]>([]);

  const toggleLayer = (id: LayerId) => {
    setPeeledLayers(prev => {
      if (prev.includes(id)) {
        // Unpeel this and any layers below it
        const index = layers.findIndex(l => l.id === id);
        const layersToUnpeel = layers.slice(index).map(l => l.id);
        return prev.filter(p => !layersToUnpeel.includes(p));
      } else {
        // Peel this and any layers above it
        const index = layers.findIndex(l => l.id === id);
        const layersToPeel = layers.slice(0, index + 1).map(l => l.id);
        return [...new Set([...prev, ...layersToPeel])];
      }
    });
  };

  const reset = () => setPeeledLayers([]);

  return (
    <div class="relative w-full max-w-4xl mx-auto py-12 px-4">
      <div class="text-center mb-16 space-y-4">
        <h2 class="text-section">Peel Back the Layers</h2>
        <p class="text-subhead max-w-2xl mx-auto">
          Click the layers to reveal the underlying technology stack.
        </p>
        <button 
          onClick={reset}
          class="text-sm text-white/50 hover:text-white transition-colors underline underline-offset-4"
        >
          Reset Stack
        </button>
      </div>

      <div class="relative h-[600px] perspective-1000">
        <For each={layers}>
          {(layer, index) => {
            const isPeeled = () => peeledLayers().includes(layer.id);
            const zIndex = layers.length - index();
            
            // Calculate stacking offsets when not peeled
            const baseTranslateY = index() * 40;
            const baseScale = 1 - (index() * 0.05);
            
            // Peeled state transforms
            const peeledTranslateY = -200 - (index() * 20);
            const peeledTranslateX = index() % 2 === 0 ? 100 : -100;
            const peeledRotateZ = index() % 2 === 0 ? 15 : -15;

            return (
              <div 
                class={`absolute inset-x-0 mx-auto w-full max-w-2xl cursor-pointer transition-all duration-700 ease-out transform-gpu`}
                style={{
                  "z-index": zIndex,
                  "transform": isPeeled() 
                    ? `translate3d(${peeledTranslateX}px, ${peeledTranslateY}px, -200px) rotateZ(${peeledRotateZ}deg) scale(0.9)`
                    : `translate3d(0, ${baseTranslateY}px, 0) scale(${baseScale})`,
                  "opacity": isPeeled() ? 0 : 1,
                  "pointer-events": isPeeled() ? "none" : "auto"
                }}
                onClick={() => toggleLayer(layer.id)}
              >
                <div class={`
                  bg-gradient-to-br ${layer.colorClass} backdrop-blur-xl border rounded-2xl p-8 shadow-2xl
                  flex flex-col md:flex-row gap-8 items-center md:items-start min-h-[320px]
                  group hover:-translate-y-4 transition-transform duration-300
                `}>
                  <div class="flex-1 space-y-4">
                    <div class="text-xs font-mono tracking-widest uppercase text-white/60">
                      Layer {index() + 1} • {layer.subtitle}
                    </div>
                    <h3 class="text-3xl font-semibold text-white">{layer.title}</h3>
                    <p class="text-white/80 leading-relaxed">
                      {layer.description}
                    </p>
                    <div class="pt-4 text-sm text-white/40 group-hover:text-white/80 transition-colors flex items-center gap-2">
                      <span>Click to peel back</span>
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div class="flex-1 w-full bg-black/50 rounded-xl p-4 border border-white/10 font-mono text-sm overflow-hidden relative">
                    <div class="absolute top-0 left-0 w-full h-8 bg-black/40 border-b border-white/5 flex items-center px-4 gap-2">
                      <div class="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <pre class="pt-8 text-white/70 overflow-x-auto">
                      <code>{layer.codeSnippet}</code>
                    </pre>
                  </div>
                </div>
              </div>
            );
          }}
        </For>

        {/* The bottom-most reveal (what's under everything) */}
        <div 
          class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl h-[320px] border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
          style={{ "z-index": 0, "transform": `translateY(${layers.length * 40}px) scale(${1 - layers.length * 0.05})` }}
        >
          <div class="text-emerald-500 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">The Bare Metal</h3>
          <p class="text-white/50 max-w-md">
            Underneath it all, BlitzPress is just clean Go interfaces and simple SolidJS primitives. No magic, just solid engineering.
          </p>
          <button 
            onClick={reset}
            class="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors text-sm font-medium"
          >
            Rebuild Stack
          </button>
        </div>
      </div>
    </div>
  );
}