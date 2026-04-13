import { Show, createMemo } from "solid-js";
import { useLocation } from "@solidjs/router";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { useAdminRuntime } from "../base/app/AdminRuntimeProvider";
import NotFoundPage from "../base/pages/NotFoundPage";
import { matchPluginPage } from "../base/routes/navigation";
import PluginPageHost from "./PluginPageHost";

export default function RuntimeRoutePage() {
  const location = useLocation();
  const { loadStatus } = useAdminRuntime();

  const activePage = createMemo(() => matchPluginPage(location.pathname, runtimeState.pages));

  return (
    <Show
      when={activePage()}
      fallback={
        loadStatus().state === "idle" || loadStatus().state === "loading"
          ? <div class="rounded-2xl border border-slate-200/60 bg-white p-6 text-sm text-slate-400 shadow-sm shadow-slate-200/50">Loading page…</div>
          : <NotFoundPage />
      }
    >
      {(match) => <PluginPageHost page={match().page} routeParams={match().routeParams} />}
    </Show>
  );
}
