import { type Component, type JSX, Show } from "solid-js";
import { useLocation } from "@solidjs/router";

import { AdminRuntimeProvider } from "./AdminRuntimeProvider";
import AdminShell from "../layout/AdminShell";

const App: Component<{ children: JSX.Element }> = (props) => {
  const location = useLocation();
  const isLoginPage = () => location.pathname === "/login";

  return (
    <Show when={!isLoginPage()} fallback={props.children}>
      <AdminRuntimeProvider>
        <AdminShell>{props.children}</AdminShell>
      </AdminRuntimeProvider>
    </Show>
  );
};

export default App;
