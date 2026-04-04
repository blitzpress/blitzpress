import { Component } from "solid-js";
import { Save } from "lucide-solid";

export const SettingsWriting: Component = () => {
  return (
    <>
      <div class="page-header">
        <div>
          <h1 class="page-title">Writing Settings</h1>
          <p class="page-desc">Configure your writing options and defaults.</p>
        </div>
        <button class="btn-primary">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div class="dashboard-grid">
        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">Publishing Defaults</h3>
            <p class="card-desc">Default formats applied to new content.</p>
          </div>
          <div class="card-content" style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Default Post Category</label>
              <div class="search-input" style="width: 100%; max-width: 300px; justify-content: space-between;">
                <span style="font-size: 14px; color: var(--fg-primary);">Uncategorized</span>
                <span style="color: var(--fg-muted);">▼</span>
              </div>
            </div>
            
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Default Post Format</label>
              <div class="search-input" style="width: 100%; max-width: 300px; justify-content: space-between;">
                <span style="font-size: 14px; color: var(--fg-primary);">Standard</span>
                <span style="color: var(--fg-muted);">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">Formatting</h3>
            <p class="card-desc">Content editor formatting behaviors.</p>
          </div>
          <div class="card-content" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 18px; height: 18px; background: var(--accent-primary); border-radius: var(--radius-sm); display: flex; justify-content: center; align-items: center; color: white; font-size: 10px;">✓</div>
              <span style="font-size: 14px;">Convert emoticons like :-) and :-P to graphics on display</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 18px; height: 18px; background: transparent; border: 1px solid var(--border-default); border-radius: var(--radius-sm);"></div>
              <span style="font-size: 14px;">Automatically correct invalidly nested XHTML automatically</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
