import { Show, createMemo, createResource } from "solid-js";

import type { PluginSettingsResponse, SettingsValues } from "../plugin-runtime/types";
import SettingsForm from "./SettingsForm";

export type SettingsFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface PluginSettingsViewProps {
  pluginId: string;
  pluginName?: string;
  fetch?: SettingsFetch;
}

type SettingsSaveResponse = {
  values?: SettingsValues;
  error?: string;
  fields?: Record<string, string>;
  message?: string;
};

function buildSettingsEndpoint(pluginId: string): string {
  return `/api/admin/plugins/${encodeURIComponent(pluginId)}/settings`;
}

async function parseJSON<TValue>(response: Response): Promise<TValue | undefined> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as TValue;
}

function formatSettingsRequestError(
  response: Response,
  payload?: { error?: string; message?: string; fields?: Record<string, string> },
): string {
  const fieldErrors = payload?.fields
    ? Object.entries(payload.fields).map(([field, message]) => `${field}: ${message}`)
    : [];
  const baseMessage =
    payload?.error ||
    payload?.message ||
    `plugin settings request failed: ${response.status} ${response.statusText}`;

  return fieldErrors.length > 0 ? `${baseMessage} (${fieldErrors.join(", ")})` : baseMessage;
}

export async function fetchPluginSettings(
  pluginId: string,
  fetchImpl: SettingsFetch = fetch,
): Promise<PluginSettingsResponse> {
  const response = await fetchImpl(buildSettingsEndpoint(pluginId));
  const payload = await parseJSON<PluginSettingsResponse & SettingsSaveResponse>(response);

  if (!response.ok) {
    throw new Error(formatSettingsRequestError(response, payload));
  }

  return {
    schema: payload?.schema ?? null,
    values: payload?.values ?? {},
  };
}

export async function savePluginSettings(
  pluginId: string,
  values: SettingsValues,
  fetchImpl: SettingsFetch = fetch,
): Promise<SettingsValues> {
  const response = await fetchImpl(buildSettingsEndpoint(pluginId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  const payload = await parseJSON<SettingsSaveResponse>(response);

  if (!response.ok) {
    throw new Error(formatSettingsRequestError(response, payload));
  }

  return payload?.values ?? { ...values };
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function PluginSettingsView(props: PluginSettingsViewProps) {
  const pluginLabel = createMemo(() => props.pluginName?.trim() || props.pluginId);
  const fetchImpl = () => props.fetch ?? fetch;
  const [settings, { mutate, refetch }] = createResource(
    () => props.pluginId,
    (pluginId) => fetchPluginSettings(pluginId, fetchImpl()),
  );

  const handleSave = async (values: SettingsValues) => {
    const savedValues = await savePluginSettings(props.pluginId, values, fetchImpl());
    mutate((current) =>
      current
        ? {
            ...current,
            values: { ...savedValues },
          }
        : {
            schema: null,
            values: { ...savedValues },
          },
    );
  };

  return (
    <section class="panel plugin-settings-view">
      <header class="plugin-settings-header">
        <div>
          <p>Plugin settings</p>
          <h2>{pluginLabel()}</h2>
        </div>
        <code>{props.pluginId}</code>
      </header>

      <Show when={!settings.loading} fallback={<p>Loading plugin settings…</p>}>
        <Show
          when={!settings.error}
          fallback={
            <div class="settings-state">
              <p>{formatUnknownError(settings.error)}</p>
              <button type="button" onClick={() => void refetch()}>
                Retry
              </button>
            </div>
          }
        >
          <Show when={settings()?.schema} fallback={<p>This plugin does not expose a settings schema.</p>}>
            {(schema) => (
              <SettingsForm
                pluginId={props.pluginId}
                schema={schema()}
                values={settings()?.values ?? {}}
                onSave={handleSave}
              />
            )}
          </Show>
        </Show>
      </Show>
    </section>
  );
}
