import { registerPlugin, type HttpClient } from "@blitzpress/plugin-sdk";

const tokenStorageKey = "bp_auth_token";

function getStoredAuthToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(tokenStorageKey) ?? "";
}

registerPlugin(
  {
    id: "users-plugin",
    name: "Users & Authentication",
    version: "0.1.0",
  },
  (registrar) => {
    registrar.hooks.addFilter<HttpClient>(
      "core.http:request.after.process",
      (client, _url, _requestInit) => {
        const token = getStoredAuthToken();
        if (!token) {
          return client;
        }

        return client.withBearerToken(token);
      },
      { priority: 5 },
    );

    registrar.pages.add({
      id: "users-plugin.users",
      path: "/users",
      title: "Users",
      component: () => import("./pages/UsersPage"),
    });
  },
);
