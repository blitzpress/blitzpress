import { Show, createResource } from "solid-js";

import type { RegisteredPage } from "../plugin-runtime/types";

export default function PluginPageHost(props: { page: RegisteredPage }) {
  const [module] = createResource(() => props.page.id, async () => props.page.component());

  return (
    <Show when={module()} fallback={<p class="text-sm text-slate-400">Loading page module...</p>}>
      {(loadedModule) => {
        const Page = loadedModule().default;
        return <Page />;
      }}
    </Show>
  );
}
