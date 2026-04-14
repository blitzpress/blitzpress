import { createSignal, For, Show } from "solid-js";

type NodeId = 'frontend' | 'core' | 'db' | 'plugin-a' | 'plugin-b';

interface SystemNode {
  id: NodeId;
  title: string;
  description: string;
  status: 'active' | 'standby' | 'connected';
  details: string[];
  x: number; // percentage
  y: number; // percentage
}

const nodes: SystemNode[] = [
  {
    id: 'frontend',
    title: 'Admin UI (SolidJS)',
    description: 'Dynamic frontend that loads plugin modules at runtime without rebuilds.',
    status: 'connected',
    details: ['Shared UI modules', 'Runtime page registration', 'API consumer'],
    x: 50,
    y: 15,
  },
  {
    id: 'core',
    title: 'BlitzPress Core',
    description: 'The main Go binary managing state, API, and plugin lifecycle.',
    status: 'active',
    details: ['Hook registry', 'Route multiplexer', 'Plugin manager'],
    x: 50,
    y: 50,
  },
  {
    id: 'db',
    title: 'Database Layer',
    description: 'Persistent storage for core CMS and plugin data.',
    status: 'connected',
    details: ['SQLite / Postgres', 'Schema migrations', 'Shared transactions'],
    x: 50,
    y: 85,
  },
  {
    id: 'plugin-a',
    title: 'Example Plugin (.so)',
    description: 'Compiled Go plugin adding custom business logic.',
    status: 'active',
    details: ['Custom API routes', 'Hook implementations', 'Admin UI widgets'],
    x: 15,
    y: 50,
  },
  {
    id: 'plugin-b',
    title: 'Analytics Plugin (.so)',
    description: 'Another isolated plugin loaded dynamically at runtime.',
    status: 'active',
    details: ['Background workers', 'Event listeners', 'Custom tables'],
    x: 85,
    y: 50,
  },
];

interface Connection {
  from: NodeId;
  to: NodeId;
  label: string;
}

const connections: Connection[] = [
  { from: 'frontend', to: 'core', label: 'REST API & WebSocket' },
  { from: 'core', to: 'db', label: 'SQL Queries' },
  { from: 'plugin-a', to: 'core', label: 'Go SDK & Hooks' },
  { from: 'plugin-b', to: 'core', label: 'Go SDK & Hooks' },
];

export default function InteractiveArchitecture() {
  const [activeNode, setActiveNode] = createSignal<NodeId | null>(null);
  const [hoveredNode, setHoveredNode] = createSignal<NodeId | null>(null);

  const getNode = (id: NodeId) => nodes.find(n => n.id === id)!;

  return (
    <div class="relative w-full rounded-2xl border border-white/10 bg-[#0a0f1c] overflow-hidden min-h-[600px] flex flex-col md:flex-row shadow-2xl">
      {/* Diagram Area */}
      <div class="relative flex-1 min-h-[450px] p-8">
        {/* SVG Connections */}
        <svg class="absolute inset-0 w-full h-full pointer-events-none" style={{ "z-index": 0 }}>
          <defs>
            <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(79, 70, 229, 0.1)" />
              <stop offset="50%" stop-color="rgba(129, 140, 248, 0.8)" />
              <stop offset="100%" stop-color="rgba(79, 70, 229, 0.1)" />
            </linearGradient>
          </defs>
          <For each={connections}>
            {(conn) => {
              const fromNode = getNode(conn.from);
              const toNode = getNode(conn.to);
              
              const isHighlighted = () => 
                hoveredNode() === conn.from || hoveredNode() === conn.to ||
                activeNode() === conn.from || activeNode() === conn.to;

              return (
                <g class={`transition-opacity duration-500 ${isHighlighted() ? 'opacity-100' : 'opacity-20'}`}>
                  {/* Base line */}
                  <line 
                    x1={`${fromNode.x}%`} 
                    y1={`${fromNode.y}%`} 
                    x2={`${toNode.x}%`} 
                    y2={`${toNode.y}%`}
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="2"
                  />
                  {/* Animated dash line for data flow */}
                  <line 
                    x1={`${fromNode.x}%`} 
                    y1={`${fromNode.y}%`} 
                    x2={`${toNode.x}%`} 
                    y2={`${toNode.y}%`}
                    stroke="url(#flow-gradient)"
                    stroke-width="3"
                    stroke-dasharray="8 8"
                    class="animate-[dash_1s_linear_infinite]"
                  />
                  {/* Label (only show if highlighted) */}
                  <g 
                    class={`transition-opacity duration-300 ${isHighlighted() ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <rect x={`${(fromNode.x + toNode.x) / 2}%`} y={`calc(${(fromNode.y + toNode.y) / 2}% - 12px)`} width="160" height="24" rx="12" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255,255,255,0.1)" transform="translate(-80, 0)" />
                    <text x={`${(fromNode.x + toNode.x) / 2}%`} y={`calc(${(fromNode.y + toNode.y) / 2}% + 4px)`} fill="rgba(255,255,255,0.7)" font-size="10" font-family="monospace" text-anchor="middle">
                      {conn.label}
                    </text>
                  </g>
                </g>
              );
            }}
          </For>
        </svg>

        {/* Nodes */}
        <For each={nodes}>
          {(node) => {
            const isActive = () => activeNode() === node.id;
            const isHovered = () => hoveredNode() === node.id;
            const isDimmed = () => (activeNode() || hoveredNode()) && !isActive() && !isHovered();

            return (
              <button
                class={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-4 rounded-xl border backdrop-blur-md transition-all duration-300 z-10 w-40
                  ${isActive() || isHovered()
                    ? 'border-indigo-500/50 bg-indigo-500/10 scale-105 shadow-[0_0_30px_rgba(79,70,229,0.15)]' 
                    : 'border-white/10 bg-white/5 hover:border-white/30'}
                  ${isDimmed() ? 'opacity-40 grayscale' : 'opacity-100'}
                `}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setActiveNode(node.id)}
              >
                <div class="flex items-center gap-2 mb-2">
                  <div class={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`} />
                  <span class="text-[10px] font-mono text-white/50 uppercase tracking-widest">{node.status}</span>
                </div>
                <h4 class="font-medium text-center text-sm mb-1 text-white">{node.title}</h4>
              </button>
            );
          }}
        </For>
      </div>

      {/* Details Panel */}
      <div class="w-full md:w-80 bg-white/5 border-t md:border-t-0 md:border-l border-white/10 p-8 flex flex-col justify-center transition-all min-h-[250px] relative overflow-hidden">
        {/* Background glow for details panel */}
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50 pointer-events-none" />
        
        <Show 
          when={activeNode() ? getNode(activeNode()!) : null} 
          fallback={
            <div class="text-center text-white/40 italic flex flex-col items-center gap-4">
              <svg class="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Click a component to dive deeper into the architecture.
            </div>
          }
        >
          {(selectedNode) => (
            <div class="space-y-6 relative z-10 animate-[fade-in_0.3s_ease-out]">
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <div class={`w-2.5 h-2.5 rounded-full ${selectedNode().status === 'active' ? 'bg-green-400' : 'bg-blue-400'}`} />
                  <span class="text-xs font-mono text-white/50 uppercase tracking-widest">{selectedNode().id}</span>
                </div>
                <h3 class="text-2xl font-medium text-white">{selectedNode().title}</h3>
              </div>
              
              <p class="text-white/70 text-sm leading-relaxed">
                {selectedNode().description}
              </p>

              <div class="space-y-4 pt-4 border-t border-white/10">
                <h4 class="text-xs font-mono text-white/40 uppercase tracking-widest">Capabilities</h4>
                <ul class="space-y-3">
                  <For each={selectedNode().details}>
                    {(detail) => (
                      <li class="flex items-start gap-3 text-sm text-white/80">
                        <svg class="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {detail}
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
