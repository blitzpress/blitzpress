import {
  createContext,
  createMemo,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type Component,
  type JSX,
} from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { loadPlugins } from "../../plugin-runtime/loader";
import type { PluginFrontendDescriptor, PluginLoadSummary, RegisteredPage, RegisteredWidget } from "../../plugin-runtime/types";

export type LoadStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; summary: PluginLoadSummary }
  | { state: "error"; message: string };

interface AuthStatus {
  enabled: boolean;
  login_url?: string;
}

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  roles: string[];
}

interface AdminRuntimeContextValue {
  loadStatus: Accessor<LoadStatus>;
  discoveredPlugins: Accessor<PluginFrontendDescriptor[]>;
  pluginPages: Accessor<RegisteredPage[]>;
  widgets: Accessor<RegisteredWidget[]>;
  authUser: Accessor<AuthUser | null>;
  logout: () => Promise<void>;
}

const AdminRuntimeContext = createContext<AdminRuntimeContextValue>();
const tokenStorageKey = "bp_auth_token";

function getStoredAuthToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(tokenStorageKey) ?? "";
}

function getAuthHeaders(): HeadersInit | undefined {
  const token = getStoredAuthToken();
  if (!token) return undefined;
  return {
    Authorization: `Bearer ${token}`,
  };
}

function applyLogoutAction(action?: string) {
  if (action === "remove-token-from-localstorage" && typeof window !== "undefined") {
    window.localStorage.removeItem(tokenStorageKey);
  }
}

async function checkAuthStatus(): Promise<AuthStatus> {
  const res = await fetch("/api/core/auth/status");
  if (!res.ok) return { enabled: false };
  return res.json();
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/core/auth/me", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export const AdminRuntimeProvider: Component<{ children: JSX.Element }> = (props) => {
  const [loadStatus, setLoadStatus] = createSignal<LoadStatus>({ state: "idle" });
  const [authUser, setAuthUser] = createSignal<AuthUser | null>(null);

  onMount(async () => {
    setLoadStatus({ state: "loading" });

    try {
      const authStatus = await checkAuthStatus();

      if (authStatus.enabled) {
        const user = await fetchCurrentUser();
        if (!user) {
          window.location.href = authStatus.login_url || "/login";
          return;
        }
        setAuthUser(user);
      }

      const summary = await loadPlugins();
      setLoadStatus({ state: "ready", summary });
    } catch (error) {
      setLoadStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const discoveredPlugins = createMemo<PluginFrontendDescriptor[]>(() => {
    const status = loadStatus();
    return status.state === "ready" ? status.summary.plugins : [];
  });

  const logout = async () => {
    const res = await fetch("/api/core/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      applyLogoutAction(data.action);
    }

    window.location.href = "/login";
  };

  const value: AdminRuntimeContextValue = {
    loadStatus,
    discoveredPlugins,
    pluginPages: createMemo(() => runtimeState.pages),
    widgets: createMemo(() => runtimeState.widgets),
    authUser,
    logout,
  };

  return <AdminRuntimeContext.Provider value={value}>{props.children}</AdminRuntimeContext.Provider>;
};

export function useAdminRuntime(): AdminRuntimeContextValue {
  const context = useContext(AdminRuntimeContext);
  if (!context) {
    throw new Error("useAdminRuntime must be used inside AdminRuntimeProvider");
  }

  return context;
}
