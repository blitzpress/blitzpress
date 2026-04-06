import type { Component, JSX } from "solid-js";

import { AdminRuntimeProvider } from "./AdminRuntimeProvider";
import AdminShell from "../layout/AdminShell";

const App: Component<{ children: JSX.Element }> = (props) => (
  <AdminRuntimeProvider>
    <AdminShell>{props.children}</AdminShell>
  </AdminRuntimeProvider>
);

export default App;
