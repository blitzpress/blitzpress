import { registerPlugin } from "@blitzpress/plugin-sdk";

registerPlugin(
  {
    id: "users-plugin",
    name: "Users & Authentication",
    version: "0.1.0",
  },
  (registrar) => {
    registrar.pages.add({
      id: "users-plugin.users",
      path: "/users",
      title: "Users",
      component: () => import("./pages/UsersPage"),
    });
  },
);
