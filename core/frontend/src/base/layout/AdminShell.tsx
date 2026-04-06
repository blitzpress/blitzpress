import { Suspense, createSignal, type Component, type JSX } from "solid-js";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AdminShell: Component<{ children: JSX.Element }> = (props) => {
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <div class="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed()} onToggle={() => setCollapsed(!collapsed())} />
      <div class={`transition-all duration-300 ${collapsed() ? "ml-16" : "ml-64"}`}>
        <TopBar onMenuToggle={() => setCollapsed(!collapsed())} />
        <main class="p-6">
          <Suspense
            fallback={
              <div class="flex h-64 items-center justify-center">
                <div class="text-sm text-slate-400">Loading...</div>
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

export default AdminShell;
