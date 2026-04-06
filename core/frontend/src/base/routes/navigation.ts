import type { PluginFrontendDescriptor, RegisteredPage } from "../../plugin-runtime/types";

export interface NavItem {
  icon: string;
  label: string;
  path: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface PlaceholderLink {
  label: string;
  path: string;
}

export interface PlaceholderConfig {
  title: string;
  description: string;
  links?: PlaceholderLink[];
  bullets?: string[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [{ icon: "home", label: "Dashboard", path: "/" }],
  },
  {
    label: "Content",
    items: [
      { icon: "file-text", label: "Posts", path: "/posts" },
      { icon: "image", label: "Media", path: "/media" },
      { icon: "file", label: "Pages", path: "/pages" },
      { icon: "tag", label: "Comments", path: "/comments" },
    ],
  },
  {
    label: "Extensions",
    items: [
      { icon: "puzzle", label: "Plugins", path: "/plugins" },
      { icon: "grid", label: "Appearance", path: "/appearance" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: "users", label: "Users", path: "/users" },
      { icon: "settings", label: "Settings", path: "/settings" },
      { icon: "bolt", label: "Tools", path: "/tools" },
      { icon: "trending-up", label: "Updates", path: "/updates" },
    ],
  },
];

export const placeholderPages: Record<string, PlaceholderConfig> = {
  "/comments": {
    title: "Comments",
    description: "Moderation queues, spam review, and discussion workflows will live here in the permanent CMS.",
    bullets: [
      "Inbox-style moderation views",
      "Bulk actions for approve, spam, and trash",
      "Filters for pending, approved, spam, and trash",
    ],
  },
  "/appearance": {
    title: "Appearance",
    description: "Theme, menu, and widget management are planned as WordPress-style modules in the next pass.",
    links: [
      { label: "Themes", path: "/appearance/themes" },
      { label: "Menus", path: "/appearance/menus" },
      { label: "Widgets", path: "/appearance/widgets" },
    ],
  },
  "/appearance/themes": {
    title: "Themes",
    description: "Theme browsing, activation, and preview tools will be added here.",
    links: [{ label: "Back to Appearance", path: "/appearance" }],
  },
  "/appearance/menus": {
    title: "Menus",
    description: "Navigation menu editing and assignment are planned for this section.",
    links: [{ label: "Back to Appearance", path: "/appearance" }],
  },
  "/appearance/widgets": {
    title: "Widgets",
    description: "Sidebar and block widget placement will be managed from this screen.",
    links: [{ label: "Back to Appearance", path: "/appearance" }],
  },
  "/tools": {
    title: "Tools",
    description: "Import, export, and operational maintenance screens will live here.",
    links: [
      { label: "Import", path: "/tools/import" },
      { label: "Export", path: "/tools/export" },
      { label: "Site Health", path: "/tools/site-health" },
    ],
  },
  "/tools/import": {
    title: "Import",
    description: "Source imports, migration jobs, and preview steps will be added here.",
    links: [{ label: "Back to Tools", path: "/tools" }],
  },
  "/tools/export": {
    title: "Export",
    description: "Content export formats and archive downloads will be surfaced here.",
    links: [{ label: "Back to Tools", path: "/tools" }],
  },
  "/tools/site-health": {
    title: "Site Health",
    description: "Expanded diagnostics, recommendations, and server checks will be available here.",
    links: [{ label: "Back to Tools", path: "/tools" }],
  },
  "/updates": {
    title: "Updates",
    description: "Core, plugin, and theme update management will be centralized here.",
    bullets: [
      "Pending core updates",
      "Plugin update approvals",
      "Maintenance mode controls",
    ],
  },
  "/settings/discussion": {
    title: "Discussion",
    description: "Comment defaults, moderation rules, and avatar settings will be configured here.",
    links: [{ label: "Back to Settings", path: "/settings" }],
  },
  "/settings/privacy": {
    title: "Privacy",
    description: "Privacy policy pages, consent settings, and data export options will be managed here.",
    links: [{ label: "Back to Settings", path: "/settings" }],
  },
};

const exactTitles = new Map<string, string>([
  ["/", "Dashboard"],
  ["/posts", "Posts"],
  ["/posts/new", "New Post"],
  ["/media", "Media Library"],
  ["/pages", "Pages"],
  ["/plugins", "Plugins"],
  ["/users", "Users"],
  ["/settings", "Settings"],
  ["/comments", "Comments"],
  ["/appearance", "Appearance"],
  ["/appearance/themes", "Themes"],
  ["/appearance/menus", "Menus"],
  ["/appearance/widgets", "Widgets"],
  ["/tools", "Tools"],
  ["/tools/import", "Import"],
  ["/tools/export", "Export"],
  ["/tools/site-health", "Site Health"],
  ["/updates", "Updates"],
  ["/settings/discussion", "Discussion"],
  ["/settings/privacy", "Privacy"],
]);

export function normalizePath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function pluginSettingsPath(pluginId: string): string {
  return `/admin/plugins/${encodeURIComponent(pluginId)}/settings`;
}

export function parsePluginSettingsPath(pathname: string): string | undefined {
  const match = normalizePath(pathname).match(/^\/admin\/plugins\/([^/]+)\/settings$/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function isActivePath(currentPath: string, targetPath: string): boolean {
  const current = normalizePath(currentPath);
  const target = normalizePath(targetPath);
  if (target === "/") {
    return current === "/";
  }

  return current === target || current.startsWith(target + "/");
}

export function getPageTitle(
  pathname: string,
  pluginPages: RegisteredPage[],
  plugins: PluginFrontendDescriptor[],
): string {
  const normalized = normalizePath(pathname);
  const pluginSettingsId = parsePluginSettingsPath(normalized);
  if (pluginSettingsId) {
    const plugin = plugins.find((entry) => entry.id === pluginSettingsId);
    return plugin ? `${plugin.name} Settings` : "Plugin Settings";
  }

  const exact = exactTitles.get(normalized);
  if (exact) {
    return exact;
  }

  const pluginPage = pluginPages.find((page) => normalizePath(page.path) === normalized);
  if (pluginPage) {
    return pluginPage.title;
  }

  if (normalized.startsWith("/posts/")) {
    return "Edit Post";
  }

  if (normalized.startsWith("/posts/")) {
    return "Edit Post";
  }

  return "BlitzPress";
}
