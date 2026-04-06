import { Dynamic } from "solid-js/web";
import { For, Show, createEffect, createMemo, createResource, createSignal, type Component } from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import type {
  SaveSettingsHandler,
  SettingsComponentProps,
  SettingsFieldDefinition,
  SettingsFormProps,
  SettingsSchema,
  SettingsValues,
} from "../../plugin-runtime/types";

function hasOwnValue(values: SettingsValues, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(values, key);
}

function cloneValue<TValue>(value: TValue): TValue {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as TValue;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, cloneValue(entry)]),
    ) as TValue;
  }

  return value;
}

function cloneSettingsValues(values: SettingsValues): SettingsValues {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, cloneValue(value)]));
}

export function buildSettingsValues(schema: SettingsSchema, values: SettingsValues = {}): SettingsValues {
  const merged = cloneSettingsValues(values);

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!hasOwnValue(merged, field.id) && field.default !== undefined) {
        merged[field.id] = cloneValue(field.default);
      }
    }
  }

  return merged;
}

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asNumberValue(value: unknown): string | number {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function inputType(field: SettingsFieldDefinition): string {
  switch (field.type) {
    case "color":
    case "email":
    case "url":
      return field.type;
    default:
      return "text";
  }
}

function formatSaveError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function CustomFieldControl(props: {
  field: SettingsFieldDefinition;
  value: () => unknown;
  onChange: (value: unknown) => void;
}) {
  const component = createMemo(() =>
    props.field.component ? runtimeState.fieldComponents[props.field.component] : undefined,
  );

  return (
    <Show
      when={component()}
      fallback={
        <p class="text-sm text-slate-400">
          Field component <code>{props.field.component || "unknown"}</code> is not registered.
        </p>
      }
    >
      {(resolvedComponent) => (
        <Dynamic component={resolvedComponent()} value={props.value()} onChange={props.onChange} />
      )}
    </Show>
  );
}

function StandardFieldControl(props: {
  field: SettingsFieldDefinition;
  value: () => unknown;
  onChange: (value: unknown) => void;
}) {
  const currentValue = () => props.value();
  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  if (props.field.type === "text") {
    return (
      <textarea
        id={props.field.id}
        name={props.field.id}
        rows={4}
        value={asString(currentValue())}
        required={props.field.required}
        onInput={(event) => props.onChange(event.currentTarget.value)}
        class={`${inputClass} resize-none`}
      />
    );
  }

  if (props.field.type === "number") {
    return (
      <input
        id={props.field.id}
        name={props.field.id}
        type="number"
        value={asNumberValue(currentValue())}
        min={props.field.min}
        max={props.field.max}
        required={props.field.required}
        onInput={(event) => {
          const { value } = event.currentTarget;
          if (value.trim() === "") {
            props.onChange(undefined);
            return;
          }

          const parsed = Number(value);
          props.onChange(Number.isNaN(parsed) ? undefined : parsed);
        }}
        class={inputClass}
      />
    );
  }

  if (props.field.type === "boolean") {
    return (
      <input
        id={props.field.id}
        name={props.field.id}
        type="checkbox"
        checked={Boolean(currentValue())}
        onChange={(event) => props.onChange(event.currentTarget.checked)}
        class="h-4 w-4 rounded border-slate-300 text-indigo-600"
      />
    );
  }

  if (props.field.type === "select") {
    const selectValue = () => asString(currentValue());

    return (
      <select
        id={props.field.id}
        name={props.field.id}
        value={selectValue()}
        required={props.field.required}
        onChange={(event) => props.onChange(event.currentTarget.value)}
        class={`${inputClass} cursor-pointer`}
      >
        <Show when={selectValue() === ""}>
          <option value="">Select an option</option>
        </Show>
        <For each={props.field.options || []}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
    );
  }

  return (
    <input
      id={props.field.id}
      name={props.field.id}
      type={inputType(props.field)}
      value={asString(currentValue())}
      required={props.field.required}
      onInput={(event) => props.onChange(event.currentTarget.value)}
      class={inputClass}
    />
  );
}

function SettingsField(props: {
  field: SettingsFieldDefinition;
  value: () => unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <div class="space-y-2">
      <label for={props.field.id} class="block text-sm font-medium text-slate-700">
        {props.field.label}
        <Show when={props.field.required}>
          <span aria-hidden="true"> *</span>
        </Show>
      </label>
      <Show when={props.field.description}>
        <p class="text-xs text-slate-400">{props.field.description}</p>
      </Show>
      <Show
        when={props.field.type === "custom"}
        fallback={<StandardFieldControl field={props.field} value={props.value} onChange={props.onChange} />}
      >
        <CustomFieldControl field={props.field} value={props.value} onChange={props.onChange} />
      </Show>
    </div>
  );
}

export function CustomSettingsOverride(props: {
  component: Component<SettingsComponentProps>;
  values: SettingsValues;
  onSave: SaveSettingsHandler;
}) {
  const CustomSettingsComponent = props.component;

  return <CustomSettingsComponent values={props.values} onSave={props.onSave} />;
}

export default function SettingsForm(props: SettingsFormProps) {
  const initialValues = createMemo(() => buildSettingsValues(props.schema, props.values));
  const [values, setValues] = createSignal<SettingsValues>(initialValues());
  const [isSaving, setIsSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal<string>();

  createEffect(() => {
    setValues(initialValues());
    setSaveError(undefined);
  });

  const [customSettingsModule] = createResource(
    () => runtimeState.settingsComponents[props.pluginId],
    async (loader) => (loader ? loader() : null),
  );

  const updateValue = (fieldID: string, value: unknown) => {
    setValues((currentValues) => ({
      ...currentValues,
      [fieldID]: cloneValue(value),
    }));
  };

  const saveValues = async (nextValues: SettingsValues) => {
    const snapshot = cloneSettingsValues(nextValues);
    setIsSaving(true);
    setSaveError(undefined);

    try {
      await props.onSave(snapshot);
      setValues(snapshot);
    } catch (error) {
      setSaveError(formatSaveError(error));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Show
      when={runtimeState.settingsComponents[props.pluginId]}
      fallback={
        <form
          class="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void saveValues(values());
          }}
        >
          <For each={props.schema.sections}>
            {(section) => (
              <fieldset class="space-y-4 rounded-2xl border border-slate-200/60 bg-slate-50/40 p-5">
                <legend class="px-1 text-sm font-semibold text-slate-900">{section.title}</legend>
                <For each={section.fields}>
                  {(field) => (
                    <SettingsField
                      field={field}
                      value={() => values()[field.id]}
                      onChange={(value) => updateValue(field.id, value)}
                    />
                  )}
                </For>
              </fieldset>
            )}
          </For>

          <Show when={saveError()}>
            {(message) => <p class="text-sm text-red-600">{message()}</p>}
          </Show>

          <button
            type="submit"
            disabled={isSaving()}
            class="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving() ? "Saving…" : "Save settings"}
          </button>
        </form>
      }
    >
      <Show
        when={customSettingsModule()}
        fallback={
          <section class="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-5 text-sm text-slate-500">
            <p>Loading custom settings component…</p>
          </section>
        }
      >
        {(loadedModule) => (
          <CustomSettingsOverride component={loadedModule().default} values={values()} onSave={saveValues} />
        )}
      </Show>
    </Show>
  );
}
