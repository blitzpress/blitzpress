import { useParams } from "@solidjs/router";
import { createMemo } from "solid-js";

import { useAdminRuntime } from "../base/app/AdminRuntimeProvider";
import PluginSettingsView from "./components/PluginSettingsView";

export default function PluginSettingsPage() {
  const params = useParams();
  const { discoveredPlugins } = useAdminRuntime();
  const pluginId = createMemo(() => decodeURIComponent(params.id ?? ""));
  const pluginName = createMemo(() => discoveredPlugins().find((plugin) => plugin.id === pluginId())?.name);

  return <PluginSettingsView pluginId={pluginId()} pluginName={pluginName()} />;
}
