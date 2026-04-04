import type { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { PluginsList } from './pages/PluginsList';
import { PluginArchetype } from './pages/PluginArchetype';
import { SeoSettings } from './pages/SeoSettings';
import { GlobalSettings } from './pages/GlobalSettings';

const Layout: Component<any> = (props) => {
  return (
    <>
      <Sidebar />
      <main class="ml-64 min-h-screen relative">
        <Topbar />
        {props.children}
      </main>
    </>
  );
};

const App: Component = () => {
  return (
    <Router root={Layout}>
      <Route path="/" component={Dashboard} />
      <Route path="/plugins" component={PluginsList} />
      <Route path="/plugin-archetype" component={PluginArchetype} />
      <Route path="/seo-settings" component={SeoSettings} />
      <Route path="/settings" component={GlobalSettings} />
    </Router>
  );
};

export default App;
