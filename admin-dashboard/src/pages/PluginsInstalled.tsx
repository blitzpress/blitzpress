import { Component, For } from "solid-js";
import { Plus } from "lucide-solid";

const plugins = [
  { name: "BlitzPress SEO", desc: "Advanced SEO optimization tools.", status: "Active", auto: "On" },
  { name: "Forms Builder", desc: "Drag and drop form creator.", status: "Inactive", auto: "Off" },
  { name: "Security Pro", desc: "Firewall and malware scanner.", status: "Active", auto: "On" },
];

export const PluginsInstalled: Component = () => {
  return (
    <>
      <div class="page-header">
        <div>
          <h1 class="page-title">Installed Plugins</h1>
          <p class="page-desc">Manage your active and inactive plugins.</p>
        </div>
        <button class="btn-primary">
          <Plus size={16} />
          Add New
        </button>
      </div>

      <div style="margin-bottom: 24px; border-bottom: 1px solid var(--border-default); display: flex; gap: 24px;">
        <div style="padding-bottom: 12px; border-bottom: 2px solid var(--accent-primary); color: var(--accent-primary); font-weight: 500;">All (3)</div>
        <div style="padding-bottom: 12px; color: var(--fg-secondary);">Active (2)</div>
        <div style="padding-bottom: 12px; color: var(--fg-secondary);">Inactive (1)</div>
        <div style="padding-bottom: 12px; color: var(--fg-secondary);">Update Available (0)</div>
      </div>

      <div class="card">
        <div style="display: flex; background: var(--bg-secondary); padding: 12px 20px; font-weight: 600; color: var(--fg-secondary); font-size: 12px; border-bottom: 1px solid var(--border-default);">
          <div style="flex: 2;">Plugin</div>
          <div style="flex: 3;">Description</div>
          <div style="flex: 1;">Auto-updates</div>
        </div>
        <For each={plugins}>
          {(plugin) => (
            <div style="display: flex; padding: 16px 20px; border-bottom: 1px solid var(--border-default); align-items: center;">
              <div style="flex: 2;">
                <div class="text-strong">{plugin.name}</div>
                <div style="display: flex; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: var(--accent-primary); cursor: pointer;">{plugin.status === "Active" ? "Deactivate" : "Activate"}</span>
                  <span style="color: var(--color-danger); cursor: pointer;">Delete</span>
                </div>
              </div>
              <div style="flex: 3;" class="text-muted">{plugin.desc}</div>
              <div style="flex: 1;" class="text-muted">{plugin.auto}</div>
            </div>
          )}
        </For>
      </div>
    </>
  );
};
