export interface RoleItem {
  slug: string;
  label: string;
  capabilities: string[];
}

export interface CapabilityItem {
  slug: string;
  description?: string;
}

export interface CapabilityGroup {
  key: string;
  provider?: string;
  moduleName: string;
  label: string;
  capabilities: Array<CapabilityItem & { action: string; actionLabel: string }>;
}

export function titleFromSlug(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseCapabilitySlug(slug: string): {
  groupKey: string;
  provider?: string;
  moduleName: string;
  action: string;
} {
  const dotIndex = slug.indexOf(".");
  const groupKey = dotIndex >= 0 ? slug.slice(0, dotIndex) : "other";
  const action = dotIndex >= 0 ? slug.slice(dotIndex + 1) : slug;
  const providerIndex = groupKey.indexOf(":");

  if (providerIndex >= 0) {
    return {
      groupKey,
      provider: groupKey.slice(0, providerIndex),
      moduleName: groupKey.slice(providerIndex + 1) || "other",
      action,
    };
  }

  return {
    groupKey,
    moduleName: groupKey,
    action,
  };
}

export function groupCapabilities(capabilities: CapabilityItem[]): CapabilityGroup[] {
  const groups = new Map<string, CapabilityGroup>();

  for (const capability of capabilities) {
    const parsed = parseCapabilitySlug(capability.slug);
    const group = groups.get(parsed.groupKey) ?? {
      key: parsed.groupKey,
      provider: parsed.provider,
      moduleName: parsed.moduleName,
      label: titleFromSlug(parsed.moduleName),
      capabilities: [],
    };

    group.capabilities.push({
      ...capability,
      action: parsed.action,
      actionLabel: titleFromSlug(parsed.action),
    });
    groups.set(parsed.groupKey, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      capabilities: [...group.capabilities].sort((left, right) => left.action.localeCompare(right.action)),
    }))
    .sort((left, right) => {
      const byLabel = left.label.localeCompare(right.label);
      if (byLabel !== 0) return byLabel;
      return (left.provider ?? "").localeCompare(right.provider ?? "");
    });
}

export function roleGroupLabels(capabilities: string[]): string[] {
  const groups = new Set<string>();
  for (const slug of capabilities) {
    groups.add(parseCapabilitySlug(slug).groupKey);
  }

  return [...groups]
    .map((groupKey) => {
      const providerIndex = groupKey.indexOf(":");
      const moduleName = providerIndex >= 0 ? groupKey.slice(providerIndex + 1) : groupKey;
      return titleFromSlug(moduleName);
    })
    .sort((left, right) => left.localeCompare(right));
}
