import {
  createContext,
  createMemo,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type Component,
  type JSX,
} from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { loadPlugins } from "../../plugin-runtime/loader";
import type { PluginFrontendDescriptor, PluginLoadSummary, RegisteredPage, RegisteredWidget } from "../../plugin-runtime/types";

export type LoadStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; summary: PluginLoadSummary }
  | { state: "error"; message: string };

interface AdminRuntimeContextValue {
  loadStatus: Accessor<LoadStatus>;
  discoveredPlugins: Accessor<PluginFrontendDescriptor[]>;
  pluginPages: Accessor<RegisteredPage[]>;
  widgets: Accessor<RegisteredWidget[]>;
}

const AdminRuntimeContext = createContext<AdminRuntimeContextValue>();

export const AdminRuntimeProvider: Component<{ children: JSX.Element }> = (props) => {
  const [loadStatus, setLoadStatus] = createSignal<LoadStatus>({ state: "idle" });

  onMount(async () => {
    setLoadStatus({ state: "loading" });

    try {
      const summary = await loadPlugins();
      setLoadStatus({ state: "ready", summary });
    } catch (error) {
      setLoadStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const discoveredPlugins = createMemo<PluginFrontendDescriptor[]>(() => {
    const status = loadStatus();
    return status.state === "ready" ? status.summary.plugins : [];
  });

  const value: AdminRuntimeContextValue = {
    loadStatus,
    discoveredPlugins,
    pluginPages: createMemo(() => runtimeState.pages),
    widgets: createMemo(() => runtimeState.widgets),
  };

  return <AdminRuntimeContext.Provider value={value}>{props.children}</AdminRuntimeContext.Provider>;
};

export function useAdminRuntime(): AdminRuntimeContextValue {
  const context = useContext(AdminRuntimeContext);
  if (!context) {
    throw new Error("useAdminRuntime must be used inside AdminRuntimeProvider");
  }

  return context;
}
