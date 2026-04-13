import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import { DataTable, createColumnHelper, http } from "@blitzpress/plugin-sdk";
import type { ColumnDef } from "@blitzpress/plugin-sdk";

interface UserItem {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  roles: string[];
}

type Filter = "all" | "active" | "inactive";

const columnHelper = createColumnHelper<UserItem>();

const iconPaths: Record<string, string[]> = {
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"],
};

const Icon = (props: { name: "plus" | "search"; size?: number; class?: string }) => (
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

const avatarColors = ["bg-indigo-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-pink-600"];

const getInitial = (user: UserItem) => (user.display_name || user.email || "?").charAt(0).toUpperCase();
const avatarClass = (index: number) =>
  `flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColors[index % avatarColors.length]}`;

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
    cell: (info) => (
      <div class="flex items-center gap-3">
        <div class={avatarClass(info.row.index)}>
          {getInitial(info.row.original)}
        </div>
        <div>
          <div class="font-medium text-slate-900">{info.getValue()}</div>
          <div class="mt-0.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" class="cursor-pointer text-xs text-blue-600 hover:text-blue-700">Edit</button>
            <span class="text-slate-300">|</span>
            <button type="button" class="cursor-pointer text-xs text-red-500 hover:text-red-600">Delete</button>
          </div>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("roles", {
    header: "Roles",
    cell: (info) => (
      <div class="flex flex-wrap gap-1.5">
        <For each={info.getValue()}>
          {(role) => <span class={`${roleBadgeClass(role)} capitalize`}>{role}</span>}
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
  const [activeFilter, setActiveFilter] = createSignal<Filter>("all");
  const [searchFocused, setSearchFocused] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");

  const allUsers = () => users() ?? [];
  const activeCount = () => allUsers().filter((user) => user.is_active).length;
  const inactiveCount = () => allUsers().length - activeCount();

  const filteredUsers = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    let items = allUsers();

    if (activeFilter() === "active") {
      items = items.filter((user) => user.is_active);
    }

    if (activeFilter() === "inactive") {
      items = items.filter((user) => !user.is_active);
    }

    if (!query) return items;

    return items.filter((user) => (
      user.display_name.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query)
      || user.roles.some((role) => role.toLowerCase().includes(query))
    ));
  });

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <div class="flex items-center gap-1">
          <button type="button" onClick={() => setActiveFilter("all")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "all" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            All <span class="font-normal text-slate-400">({allUsers().length})</span>
          </button>
          <button type="button" onClick={() => setActiveFilter("active")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "active" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            Active <span class="font-normal text-slate-400">({activeCount()})</span>
          </button>
          <button type="button" onClick={() => setActiveFilter("inactive")} class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium ${activeFilter() === "inactive" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            Inactive <span class="font-normal text-slate-400">({inactiveCount()})</span>
          </button>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3 pb-2">
          <div class={`relative transition-all duration-300 ${searchFocused() ? "w-80" : "w-64"}`}>
            <Icon name="search" size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery()}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              class="w-full rounded-xl border border-transparent bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-indigo-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Icon name="plus" size={16} />
            Add User
          </button>
        </div>
      </div>
      <Show when={users.error}>
        {(error) => (
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error() instanceof Error ? error().message : "Failed to load users"}
          </p>
        )}
      </Show>
      <DataTable
        columns={columns}
        data={filteredUsers()}
        loading={users.loading}
        emptyMessage="No users found"
        selectable
        getRowId={(user) => user.id}
      />
    </div>
  );
};

export default UsersPage;
