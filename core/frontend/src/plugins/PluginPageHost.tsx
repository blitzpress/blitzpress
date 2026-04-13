import { Show, createMemo, createResource } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { RegisteredPage } from "../plugin-runtime/types";

export default function PluginPageHost(props: { page: RegisteredPage; routeParams?: Record<string, string> }) {
  const [module] = createResource(() => props.page.component, async (loadPage) => loadPage());
  const Page = createMemo(() => module()?.default);

  return (
    <Show when={Page()} fallback={<p class="text-sm text-slate-400">Loading page module...</p>}>
      <Dynamic component={Page()!} routeParams={props.routeParams ?? {}} />
    </Show>
  );
}
