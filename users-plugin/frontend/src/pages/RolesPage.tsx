import { For, Show, createResource } from "solid-js";
import { DataTable, createColumnHelper, http } from "@blitzpress/plugin-sdk";
import type { ColumnDef } from "@blitzpress/plugin-sdk";

import { roleGroupLabels, type RoleItem } from "../roleUtils";

const columnHelper = createColumnHelper<RoleItem>();

const iconPaths: Record<string, string[]> = {
  plus: ["M12 5v14", "M5 12h14"],
};

const Icon = (props: { name: "plus"; size?: number; class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 20}
    height={props.size ?? 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <For each={iconPaths[props.name]}>{(d) => <path d={d} />}</For>
  </svg>
);

const roleBadgeClass = (role: string) => {
  const normalized = role.toLowerCase();

  if (normalized.includes("admin")) return "bp-badge bp-badge-blue";
  if (normalized.includes("editor")) return "bp-badge bp-badge-violet";
  if (normalized.includes("author")) return "bp-badge bp-badge-emerald";
  if (normalized.includes("contributor")) return "bp-badge bp-badge-amber";

  return "bp-badge bp-badge-slate";
};

const columns: ColumnDef<RoleItem, any>[] = [
  columnHelper.accessor("label", {
    header: "Name",
    cell: (info) => (
      <div>
        <a
          href={`/roles/${encodeURIComponent(info.row.original.slug)}`}
          class="font-medium text-slate-900 transition-colors hover:text-blue-600 group-hover:text-indigo-600"
        >
          {info.getValue()}
        </a>
        <div class="mt-0.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <a href={`/roles/${encodeURIComponent(info.row.original.slug)}`} class="text-xs text-blue-600 hover:text-blue-700">Edit</a>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("slug", {
    header: "Slug",
    cell: (info) => <span class={roleBadgeClass(info.getValue())}>{info.getValue()}</span>,
  }),
  columnHelper.accessor("capabilities", {
    header: "Capabilities",
    cell: (info) => (
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="bp-badge bp-badge-slate">{info.getValue().length} total</span>
        <For each={roleGroupLabels(info.getValue()).slice(0, 4)}>
          {(group) => <span class="bp-badge bp-badge-blue">{group}</span>}
        </For>
        <Show when={roleGroupLabels(info.getValue()).length > 4}>
          <span class="text-xs text-slate-400">+{roleGroupLabels(info.getValue()).length - 4} groups</span>
        </Show>
      </div>
    ),
  }),
];

async function fetchRoles(): Promise<RoleItem[]> {
  const res = await http().asJson().get("/api/plugins/users-plugin/roles");
  if (!res.ok) throw new Error("Failed to fetch roles");
  const data = await res.json();
  return data.roles ?? [];
}

const RolesPage = () => {
  const [roles] = createResource(fetchRoles);

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Roles</h2>
          <p class="mt-1 text-sm text-slate-500">Manage role names, slugs, and capabilities.</p>
        </div>

        <a
          href="/roles/new"
          class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Icon name="plus" size={16} />
          Add Role
        </a>
      </div>
      <Show when={roles.error}>
        {(error) => (
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error() instanceof Error ? error().message : "Failed to load roles"}
          </p>
        )}
      </Show>
      <DataTable
        columns={columns}
        data={roles() ?? []}
        loading={roles.loading}
        emptyMessage="No roles found"
        selectable
        getRowId={(role) => role.slug}
      />
    </div>
  );
};

export default RolesPage;
