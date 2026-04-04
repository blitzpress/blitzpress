import {
  LayoutDashboard,
  RefreshCcw,
  FileText,
  Image,
  File,
  MessageSquare,
  Paintbrush,
  Plug,
  Users,
  Wrench,
  Settings,
  LucideProps,
} from "lucide-solid";

export interface MenuSubItem {
  id: string;
  label: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: (props: LucideProps) => any;
  active?: boolean;
  subItems?: MenuSubItem[];
  badge?: string;
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

export const menuItems: MenuSection[] = [
  {
    section: "MAIN",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        active: true,
        subItems: [
          { id: "dashboard", label: "Home" },
          { id: "updates", label: "Updates" },
        ],
      },
    ],
  },
  {
    section: "CONTENT",
    items: [
      {
        id: "posts",
        label: "Posts",
        icon: FileText,
        subItems: [
          { id: "posts-all", label: "All Posts" },
          { id: "posts-new", label: "Add New" },
          { id: "posts-categories", label: "Categories" },
          { id: "posts-tags", label: "Tags" },
        ],
      },
      {
        id: "media",
        label: "Media",
        icon: Image,
        subItems: [
          { id: "media-library", label: "Library" },
          { id: "media-new", label: "Add New" },
        ],
      },
      {
        id: "pages",
        label: "Pages",
        icon: File,
        subItems: [
          { id: "pages-all", label: "All Pages" },
          { id: "pages-new", label: "Add New" },
        ],
      },
      {
        id: "comments",
        label: "Comments",
        icon: MessageSquare,
        badge: "4",
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        id: "appearance",
        label: "Appearance",
        icon: Paintbrush,
        subItems: [
          { id: "themes", label: "Themes" },
          { id: "customize", label: "Customize" },
        ],
      },
      {
        id: "plugins",
        label: "Plugins",
        icon: Plug,
        subItems: [
          { id: "plugins-installed", label: "Installed Plugins" },
          { id: "plugins-new", label: "Add New" },
          { id: "plugin-settings", label: "Plugin Settings" },
        ],
      },
      {
        id: "users",
        label: "Users",
        icon: Users,
        subItems: [
          { id: "users-all", label: "All Users" },
          { id: "users-new", label: "Add New" },
          { id: "users-profile", label: "Profile" },
        ],
      },
      {
        id: "tools",
        label: "Tools",
        icon: Wrench,
        subItems: [
          { id: "tools-available", label: "Available Tools" },
          { id: "tools-import", label: "Import" },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        subItems: [
          { id: "settings-general", label: "General" },
          { id: "settings-writing", label: "Writing" },
          { id: "settings-reading", label: "Reading" },
          { id: "settings-discussion", label: "Discussion" },
        ],
      },
    ],
  },
];

export const dashboardStats = [
  { label: "Total Users", value: "12,543", change: "+12.5%", positive: true },
  { label: "Active Sessions", value: "1,204", change: "+4.2%", positive: true },
  { label: "Bounce Rate", value: "32.4%", change: "-1.8%", positive: false },
];

export const activityFeed = [
  { user: "Alice", action: "published a post", time: "10 min ago" },
  { user: "Bob", action: "installed a plugin", time: "1 hr ago" },
  { user: "Charlie", action: "deleted a page", time: "3 hrs ago" },
];

export const topStories = [
  { title: "Announcing BlitzPress v2", views: "12.4k", date: "Oct 12, 2023" },
  { title: "The Future of SolidJS", views: "8.1k", date: "Oct 10, 2023" },
  { title: "How to Write a Plugin", views: "5.3k", date: "Oct 05, 2023" },
];
