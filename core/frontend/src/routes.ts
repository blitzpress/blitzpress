import { lazy } from "solid-js";
import type { RouteDefinition } from "@solidjs/router";

const DashboardPage = lazy(() => import("./dashboard/DashboardPage"));
const PostsPage = lazy(() => import("./posts/PostsPage"));
const PostEditorPage = lazy(() => import("./posts/PostEditorPage"));
const MediaLibraryPage = lazy(() => import("./media/MediaLibraryPage"));
const PagesManagerPage = lazy(() => import("./pages/PagesManagerPage"));
const PluginsPage = lazy(() => import("./plugins/PluginsPage"));
const UsersPage = lazy(() => import("./users/UsersPage"));
const SettingsPage = lazy(() => import("./settings/SettingsPage"));
const PlaceholderPage = lazy(() => import("./base/pages/PlaceholderPage"));
const PluginSettingsPage = lazy(() => import("./plugins/PluginSettingsPage"));
const RuntimeRoutePage = lazy(() => import("./plugins/RuntimeRoutePage"));

export const routes: RouteDefinition[] = [
  { path: "/", component: DashboardPage },
  { path: "/posts", component: PostsPage },
  { path: "/posts/new", component: PostEditorPage },
  { path: "/posts/:id", component: PostEditorPage },
  { path: "/media", component: MediaLibraryPage },
  { path: "/pages", component: PagesManagerPage },
  { path: "/plugins", component: PluginsPage },
  { path: "/users", component: UsersPage },
  { path: "/settings", component: SettingsPage },
  { path: "/comments", component: PlaceholderPage },
  { path: "/appearance", component: PlaceholderPage },
  { path: "/appearance/themes", component: PlaceholderPage },
  { path: "/appearance/menus", component: PlaceholderPage },
  { path: "/appearance/widgets", component: PlaceholderPage },
  { path: "/tools", component: PlaceholderPage },
  { path: "/tools/import", component: PlaceholderPage },
  { path: "/tools/export", component: PlaceholderPage },
  { path: "/tools/site-health", component: PlaceholderPage },
  { path: "/updates", component: PlaceholderPage },
  { path: "/settings/discussion", component: PlaceholderPage },
  { path: "/settings/privacy", component: PlaceholderPage },
  { path: "/admin/plugins/:id/settings", component: PluginSettingsPage },
  { path: "**", component: RuntimeRoutePage },
];
