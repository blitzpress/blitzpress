import { Component } from "solid-js";
import { Save } from "lucide-solid";

export const PluginSettings: Component = () => {
  return (
    <>
      <div class="page-header">
        <div>
          <h1 class="page-title">Plugin Settings</h1>
          <p class="page-desc">Configure the options for your plugin.</p>
        </div>
        <button class="btn-primary">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div class="dashboard-grid">
        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">General Options</h3>
            <p class="card-desc">Basic configuration.</p>
          </div>
          <div class="card-content" style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">API Key</label>
              <div class="search-input" style="width: 100%; max-width: 400px;">
                <input type="text" placeholder="Enter your API key" value="sk_test_123456789" />
              </div>
              <div style="font-size: 12px; color: var(--fg-muted); margin-top: 4px;">Get this from your provider dashboard.</div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 22px; background: var(--accent-primary); border-radius: 999px; position: relative;">
                <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; right: 3px; top: 3px;"></div>
              </div>
              <span style="font-size: 14px; font-weight: 500;">Enable advanced mode</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
