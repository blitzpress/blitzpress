import {
  For,
  Show,
  createMemo,
  createResource,
} from "solid-js";
import { hooks } from "@blitzpress/plugin-sdk";

type ExamplePluginStatus = {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  greeting: string;
  mode: string;
  items_per_page: number;
  static_asset: string;
};

type AdminMenuItem = {
  id: string;
  label: string;
  path: string;
  description?: string;
};

const defaultMenuItems: AdminMenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    description: "Core dashboard route.",
  },
  {
    id: "settings",
    label: "Settings",
    path: "/admin/settings",
    description: "Illustrative admin settings route.",
  },
];

async function fetchStatus(): Promise<ExamplePluginStatus> {
  const response = await fetch("/api/plugins/example-plugin/status");
  if (!response.ok) {
    throw new Error(`Failed to load example plugin status: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as ExamplePluginStatus;
}

export default function Home() {
  const [status] = createResource(fetchStatus);
  const menuItems = createMemo(() =>
    hooks.applyFilters<AdminMenuItem[]>(
      "admin.menu.items",
      defaultMenuItems.map((item) => ({ ...item })),
    ),
  );

  return (
    <div class="example-plugin-home">
      <section class="example-plugin-hero">
        <div>
          <p class="eyebrow">Example plugin frontend</p>
          <h3>Runtime-loaded SolidJS page</h3>
          <p>
            This page is registered from <code>example-plugin/frontend/src/index.ts</code> and loaded through the
            shared BlitzPress import map.
          </p>
        </div>
        <span class="status-badge">Shared ESM module</span>
      </section>

      <div class="example-plugin-grid">
        <section class="example-plugin-panel">
          <h4>Backend status</h4>
          <Show when={status()} fallback={<p>Loading plugin status…</p>}>
            {(loadedStatus) => (
              <dl class="status-list">
                <div>
                  <dt>Name</dt>
                  <dd>{loadedStatus().name}</dd>
                </div>
                <div>
                  <dt>Greeting</dt>
                  <dd>{loadedStatus().greeting}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>{loadedStatus().mode}</dd>
                </div>
                <div>
                  <dt>Items per page</dt>
                  <dd>{loadedStatus().items_per_page}</dd>
                </div>
                <div>
                  <dt>Static asset</dt>
                  <dd>
                    <a href={loadedStatus().static_asset} target="_blank" rel="noreferrer">
                      {loadedStatus().static_asset}
                    </a>
                  </dd>
                </div>
              </dl>
            )}
          </Show>
        </section>

        <section class="example-plugin-panel">
          <h4>Frontend filter preview</h4>
          <p>
            The example plugin appends its route to the <code>admin.menu.items</code> frontend filter hook.
          </p>
          <ul class="menu-preview">
            <For each={menuItems()}>
              {(item) => (
                <li>
                  <strong>{item.label}</strong>
                  <span>{item.path}</span>
                  <Show when={item.description}>
                    <p>{item.description}</p>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </section>
      </div>
    </div>
  );
}
