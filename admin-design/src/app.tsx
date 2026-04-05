import { type Component, createSignal, type JSX } from 'solid-js';
import { Suspense } from 'solid-js/web';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

const App: Component<{ children: JSX.Element }> = (props) => {
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <div class="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed()} onToggle={() => setCollapsed(!collapsed())} />
      <div class={`transition-all duration-300 ${collapsed() ? 'ml-16' : 'ml-64'}`}>
        <TopBar onMenuToggle={() => setCollapsed(!collapsed())} />
        <main class="p-6">
          <Suspense
            fallback={
              <div class="flex items-center justify-center h-64">
                <div class="text-slate-400 text-sm">Loading...</div>
              </div>
            }
          >
            {props.children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
