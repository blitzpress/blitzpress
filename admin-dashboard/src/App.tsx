import { Component, For, Show, createSignal } from "solid-js";
import { ChevronRight, Search, Bell } from "lucide-solid";
import { menuItems } from "./data";
import { Dashboard, PluginsInstalled, PluginSettings, SettingsGeneral, SettingsWriting } from "./pages";

const Sidebar: Component<{ currentPage: string; setCurrentPage: (p: string) => void }> = (props) => {
  return (
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">B</div>
        <div class="logo-text">BlitzPress</div>
      </div>
      <div class="sidebar-nav">
        <For each={menuItems}>
          {(section) => (
            <div class="nav-section">
              <div class="nav-section-label">{section.section}</div>
              <For each={section.items}>
                {(item) => {
                  const isActive = props.currentPage === item.id || item.subItems?.some(s => s.id === props.currentPage);
                  return (
                    <>
                      <div
                        class={`nav-item ${isActive ? "active" : ""}`}
                        onClick={() => {
                          if (!item.subItems) {
                            props.setCurrentPage(item.id);
                          } else if (item.subItems.length > 0) {
                            props.setCurrentPage(item.subItems[0].id);
                          }
                        }}
                      >
                        <div class="nav-item-left">
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        <Show when={item.badge}>
                          <span class="nav-badge">{item.badge}</span>
                        </Show>
                      </div>
                      <Show when={item.subItems && isActive}>
                        <div class="nav-subitems">
                          <For each={item.subItems}>
                            {(sub) => {
                              const isSubActive = props.currentPage === sub.id;
                              return (
                                <div
                                  class="nav-subitem"
                                  style={isSubActive ? "color: var(--fg-sidebar-active); font-weight: 500; background-color: var(--bg-sidebar-hover);" : ""}
                                  onClick={() => props.setCurrentPage(sub.id)}
                                >
                                  {sub.label}
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    </>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>
      <div class="sidebar-footer">
        <div class="avatar">A</div>
        <span>Admin User</span>
      </div>
    </aside>
  );
};

const Topbar: Component = () => {
  return (
    <header class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">
          <span class="bc-muted">Home</span>
          <ChevronRight size={14} class="bc-muted" />
          <span class="bc-active">Dashboard</span>
        </div>
      </div>
      <div class="topbar-right">
        <div class="search-input">
          <Search size={16} class="bc-muted" />
          <input type="text" placeholder="Search..." />
        </div>
        <Bell size={20} class="bc-muted" />
        <div class="avatar">A</div>
      </div>
    </header>
  );
};

const App: Component = () => {
  const [currentPage, setCurrentPage] = createSignal("dashboard");

  return (
    <div class="admin-shell">
      <Sidebar currentPage={currentPage()} setCurrentPage={setCurrentPage} />
      <main class="main-column">
        <Topbar />
        <div class="page-content">
          <Show when={currentPage() === "dashboard" || currentPage() === "updates"}>
            <Dashboard />
          </Show>
          <Show when={currentPage() === "plugins-installed"}>
            <PluginsInstalled />
          </Show>
          <Show when={currentPage() === "plugin-settings"}>
            <PluginSettings />
          </Show>
          <Show when={currentPage() === "settings-general"}>
            <SettingsGeneral />
          </Show>
          <Show when={currentPage() === "settings-writing"}>
            <SettingsWriting />
          </Show>
          <Show when={!["dashboard", "updates", "plugins-installed", "plugin-settings", "settings-general", "settings-writing"].includes(currentPage())}>
            <div class="page-header">
              <div>
                <h1 class="page-title">Under Construction</h1>
                <p class="page-desc">This page is not yet implemented.</p>
              </div>
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
};

export default App;
