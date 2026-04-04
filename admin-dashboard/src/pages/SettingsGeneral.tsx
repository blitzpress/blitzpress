import { Component } from "solid-js";
import { Save } from "lucide-solid";

export const SettingsGeneral: Component = () => {
  return (
    <>
      <div class="page-header">
        <div>
          <h1 class="page-title">General Settings</h1>
          <p class="page-desc">Configure your site's main options.</p>
        </div>
        <button class="btn-primary">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div class="dashboard-grid">
        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">Site Identity</h3>
            <p class="card-desc">Basic details about your site.</p>
          </div>
          <div class="card-content" style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Site Title</label>
              <div class="search-input" style="width: 100%; max-width: 400px;">
                <input type="text" value="BlitzPress Dashboard" />
              </div>
            </div>
            
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Tagline</label>
              <div class="search-input" style="width: 100%; max-width: 400px;">
                <input type="text" value="Just another SolidJS site" />
              </div>
              <div style="font-size: 12px; color: var(--fg-muted); margin-top: 4px;">In a few words, explain what this site is about.</div>
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Administration Email Address</label>
              <div class="search-input" style="width: 100%; max-width: 400px;">
                <input type="email" value="admin@example.com" />
              </div>
            </div>
          </div>
        </div>

        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">Regional Settings</h3>
            <p class="card-desc">Timezones and date formats.</p>
          </div>
          <div class="card-content" style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Timezone</label>
              <div class="search-input" style="width: 100%; max-width: 300px; justify-content: space-between;">
                <span style="font-size: 14px; color: var(--fg-primary);">UTC+0</span>
                <span style="color: var(--fg-muted);">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
