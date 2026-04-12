import { http } from "@blitzpress/plugin-sdk";

export interface AdminPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: string;
  enabled: boolean;
  has_frontend: boolean;
  errors?: string[];
}

interface AdminPluginListResponse {
  plugins: AdminPlugin[];
}

interface ToggleResponse {
  plugin: AdminPlugin;
  restart_required: boolean;
}

export async function fetchAdminPlugins(): Promise<AdminPlugin[]> {
  const response = await http().asJson().get("/api/core/plugins/all");
  if (!response.ok) {
    throw new Error(`Failed to load plugins: ${response.status} ${response.statusText}`);
  }
  const data: AdminPluginListResponse = await response.json();
  return data.plugins ?? [];
}

export async function togglePluginEnabled(id: string, enabled: boolean): Promise<ToggleResponse> {
  const response = await http().asJson().put(`/api/core/plugins/${encodeURIComponent(id)}/enabled`, { enabled });
  if (!response.ok) {
    throw new Error(`Failed to toggle plugin: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
