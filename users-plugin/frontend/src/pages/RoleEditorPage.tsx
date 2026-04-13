import { For, Show, createEffect, createMemo, createResource, createSignal } from "solid-js";
import { http, type PageRouteProps } from "@blitzpress/plugin-sdk";

import {
  groupCapabilities,
  type CapabilityGroup,
  type CapabilityItem,
  type RoleItem,
} from "../roleUtils";

const iconPaths: Record<string, string[]> = {
  arrowLeft: ["M19 12H5", "M12 19l-7-7 7-7"],
  check: ["M20 6 9 17l-5-5"],
  minus: ["M5 12h14"],
};

type IconName = keyof typeof iconPaths;
type CheckboxState = "on" | "off" | "partial";

const Icon = (props: { name: IconName; size?: number; class?: string }) => (
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

function CapabilityCheckboxIndicator(props: { state: CheckboxState }) {
  return (
    <span
      class={`role-checkbox ${props.state === "on" ? "is-on" : ""} ${props.state === "partial" ? "is-partial" : ""}`}
      aria-hidden="true"
    >
      <Show when={props.state !== "off"}>
        <Icon name={props.state === "partial" ? "minus" : "check"} size={14} class="role-checkbox-icon" />
      </Show>
    </span>
  );
}

async function fetchRole(id: string): Promise<RoleItem | undefined> {
  if (id === "new") return undefined;

  const res = await http().asJson().get(`/api/plugins/users-plugin/roles/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to fetch role");
  const data = await res.json();
  return data.role;
}

async function fetchCapabilities(): Promise<CapabilityItem[]> {
  const res = await http().asJson().get("/api/plugins/users-plugin/capabilities");
  if (!res.ok) throw new Error("Failed to fetch capabilities");
  const data = await res.json();
  return data.capabilities ?? [];
}

function errorMessageFromResponse(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

function CapabilityGroupCard(props: {
  group: CapabilityGroup;
  selected: Set<string>;
  onToggle: (slug: string) => void;
  onToggleGroup: (slugs: string[], state: CheckboxState) => void;
}) {
  const slugs = () => props.group.capabilities.map((capability) => capability.slug);
  const selectedCount = () => slugs().filter((slug) => props.selected.has(slug)).length;
  const groupState = createMemo<CheckboxState>(() => {
    const count = selectedCount();
    if (count === 0) return "off";
    if (count === slugs().length) return "on";
    return "partial";
  });

  return (
    <section class="role-capabilities-card rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
      <header class="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <div class="h-4 w-1.5 rounded-full bg-indigo-500" />
            <h3 class="text-sm font-semibold text-slate-900">{props.group.label}</h3>
          </div>
          <Show when={props.group.provider}>
            {(provider) => <p class="mt-1 text-xs text-slate-400">{provider()}</p>}
          </Show>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="role-group-toggle"
            role="checkbox"
            aria-checked={groupState() === "partial" ? "mixed" : groupState() === "on"}
            aria-label={`${groupState() === "on" ? "Clear" : "Select"} ${props.group.label} capabilities`}
            onClick={() => props.onToggleGroup(slugs(), groupState())}
          >
            <CapabilityCheckboxIndicator state={groupState()} />
          </button>
          <span class="bp-badge bp-badge-slate">{selectedCount()}/{slugs().length}</span>
        </div>
      </header>
      <div class="space-y-3 p-4">
        <div class="space-y-2">
          <For each={props.group.capabilities}>
            {(capability) => (
              <button
                type="button"
                class="role-capability-option"
                role="checkbox"
                aria-checked={props.selected.has(capability.slug)}
                aria-label={capability.actionLabel}
                onClick={() => props.onToggle(capability.slug)}
              >
                <CapabilityCheckboxIndicator state={props.selected.has(capability.slug) ? "on" : "off"} />
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-slate-700">{capability.actionLabel}</span>
                  <span class="block break-all text-xs text-slate-400">{capability.slug}</span>
                </span>
              </button>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}

const RoleEditorPage = (props: PageRouteProps) => {
  const roleID = () => props.routeParams?.id ?? "new";
  const isNew = createMemo(() => roleID() === "new");
  const [role] = createResource(roleID, fetchRole);
  const [capabilities] = createResource(fetchCapabilities);
  const [name, setName] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [selectedCapabilities, setSelectedCapabilities] = createSignal<string[]>([]);
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal("");

  createEffect(() => {
    if (isNew()) return;
    const currentRole = role();
    if (!currentRole) return;

    setName(currentRole.label);
    setSlug(currentRole.slug);
    setSelectedCapabilities([...currentRole.capabilities]);
  });

  const selectedSet = createMemo(() => new Set(selectedCapabilities()));
  const capabilityGroups = createMemo(() => groupCapabilities(capabilities() ?? []));

  const toggleCapability = (capabilitySlug: string) => {
    setSelectedCapabilities((current) =>
      current.includes(capabilitySlug)
        ? current.filter((item) => item !== capabilitySlug)
        : [...current, capabilitySlug].sort((left, right) => left.localeCompare(right)),
    );
  };

  const selectAll = (slugs: string[]) => {
    setSelectedCapabilities((current) => [...new Set([...current, ...slugs])].sort((left, right) => left.localeCompare(right)));
  };

  const clearAll = (slugs: string[]) => {
    const remove = new Set(slugs);
    setSelectedCapabilities((current) => current.filter((slugValue) => !remove.has(slugValue)));
  };

  const toggleGroup = (slugs: string[], state: CheckboxState) => {
    if (state === "on") {
      clearAll(slugs);
      return;
    }

    selectAll(slugs);
  };

  const saveRole = async () => {
    setSaving(true);
    setSaveError("");

    const body = {
      label: name().trim(),
      slug: slug().trim(),
      capabilities: selectedCapabilities(),
    };

    try {
      const client = http().asJson();
      const res = isNew()
        ? await client.post("/api/plugins/users-plugin/roles", body)
        : await client.put(`/api/plugins/users-plugin/roles/${encodeURIComponent(roleID())}`, body);

      if (!res.ok) {
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          data = undefined;
        }
        throw new Error(errorMessageFromResponse(data, "Failed to save role"));
      }

      window.location.assign("/roles");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      class="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void saveRole();
      }}
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <a href="/roles" class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <Icon name="arrowLeft" size={20} />
          </a>
          <div>
            <h2 class="text-xl font-semibold text-slate-900">{isNew() ? "Add Role" : "Edit Role"}</h2>
            <p class="mt-1 text-sm text-slate-500">Choose role details and permissions.</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="/roles"
            class="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-slate-50"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={saving()}
            class="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving() ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>

      <Show when={role.error || capabilities.error || saveError()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError()
            || (role.error instanceof Error ? role.error.message : "")
            || (capabilities.error instanceof Error ? capabilities.error.message : "")
            || "Failed to load role editor"}
        </p>
      </Show>

      <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
        <div class="border-b border-slate-100 p-5">
          <div class="flex items-center gap-2">
            <div class="h-5 w-1.5 rounded-full bg-indigo-500" />
            <h3 class="text-sm font-semibold text-slate-900">Role Details</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name()}
              onInput={(event) => setName(event.currentTarget.value)}
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Administrator"
              required
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Slug</span>
            <input
              type="text"
              value={slug()}
              onInput={(event) => setSlug(event.currentTarget.value)}
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="administrator"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
            <span class="mt-1 block text-xs text-slate-400">Lowercase letters, numbers, and hyphens.</span>
          </label>
        </div>
      </div>

      <section class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Capabilities</h3>
          <p class="mt-1 text-sm text-slate-500">Select the permissions this role can use.</p>
        </div>

        <Show
          when={!capabilities.loading && (!role.loading || isNew())}
          fallback={
            <div class="role-capabilities-masonry">
              <For each={[0, 1, 2]}>
                {() => (
                  <div class="role-capabilities-skeleton h-48 animate-pulse rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50" />
                )}
              </For>
            </div>
          }
        >
          <div class="role-capabilities-masonry">
            <For each={capabilityGroups()}>
              {(group) => (
                <CapabilityGroupCard
                  group={group}
                  selected={selectedSet()}
                  onToggle={toggleCapability}
                  onToggleGroup={toggleGroup}
                />
              )}
            </For>
          </div>
        </Show>
      </section>
    </form>
  );
};

export default RoleEditorPage;
