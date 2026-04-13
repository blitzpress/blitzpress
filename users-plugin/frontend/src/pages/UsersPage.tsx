import { For, createResource, Show } from "solid-js";
import { DataTable, PluginPageLayout, createColumnHelper, http } from "@blitzpress/plugin-sdk";
import type { ColumnDef } from "@blitzpress/plugin-sdk";

interface UserItem {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  roles: string[];
}

const columnHelper = createColumnHelper<UserItem>();

const roleBadgeClass = (role: string) => {
  const normalized = role.toLowerCase();

  if (normalized.includes("admin")) return "bp-badge bp-badge-blue";
  if (normalized.includes("editor")) return "bp-badge bp-badge-violet";
  if (normalized.includes("author")) return "bp-badge bp-badge-emerald";
  if (normalized.includes("contributor")) return "bp-badge bp-badge-amber";

  return "bp-badge bp-badge-slate";
};

const columns: ColumnDef<UserItem, any>[] = [
  columnHelper.accessor("display_name", {
    header: "Name",
    cell: (info) => <span class="font-medium text-slate-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("roles", {
    header: "Roles",
    cell: (info) => (
      <div class="flex flex-wrap gap-1.5">
        <For each={info.getValue()}>
          {(role) => <span class={roleBadgeClass(role)}>{role}</span>}
        </For>
      </div>
    ),
  }),
  columnHelper.accessor("is_active", {
    header: "Status",
    cell: (info) => (
      <span class={`bp-badge ${info.getValue() ? "bp-badge-emerald" : "bp-badge-amber"}`}>
        {info.getValue() ? "Active" : "Inactive"}
      </span>
    ),
  }),
];

async function fetchUsers(): Promise<UserItem[]> {
  const res = await http().asJson().get("/api/plugins/users-plugin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.users ?? [];
}

const UsersPage = () => {
  const [users] = createResource(fetchUsers);

  return (
    <PluginPageLayout title="Users" pluginId="users-plugin">
      <div class="space-y-6">
        <Show when={users.error}>
          {(error) => (
            <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error() instanceof Error ? error().message : "Failed to load users"}
            </p>
          )}
        </Show>
        <DataTable
          columns={columns}
          data={users() ?? []}
          loading={users.loading}
          emptyMessage="No users found"
          selectable
          getRowId={(user) => user.id}
        />
      </div>
    </PluginPageLayout>
  );
};

export default UsersPage;
