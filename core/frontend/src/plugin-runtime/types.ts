import type { Component } from "solid-js";

export interface PluginManifest {
  id: string;
  name: string;
  version?: string;
}

export interface PluginFrontendDescriptor {
  id: string;
  name: string;
  version: string;
  has_frontend: boolean;
  frontend_entry?: string;
  frontend_style?: string;
}

export interface PluginListResponse {
  plugins: PluginFrontendDescriptor[];
}

export type ComponentLoader<TProps extends object = Record<string, never>> = () => Promise<{
  default: Component<TProps>;
}>;

export interface FieldComponentProps<TValue = unknown> {
  value: TValue;
  onChange: (value: TValue) => void;
}

export type FieldComponent<TValue = any> = Component<FieldComponentProps<TValue>>;

export interface SettingsSelectOption {
  value: string;
  label: string;
}

export interface SettingsFieldDefinition {
  id: string;
  type: string;
  label: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  min?: number;
  max?: number;
  options?: SettingsSelectOption[];
  component?: string;
}

export interface SettingsSectionDefinition {
  id: string;
  title: string;
  fields: SettingsFieldDefinition[];
}

export interface SettingsSchema {
  sections: SettingsSectionDefinition[];
}

export type SettingsValues = Record<string, unknown>;
export type SaveSettingsHandler = (values: SettingsValues) => void | Promise<void>;

export interface SettingsComponentProps {
  values: SettingsValues;
  onSave: SaveSettingsHandler;
}

export interface SettingsFormProps extends SettingsComponentProps {
  pluginId: string;
  schema: SettingsSchema;
}

export interface PluginSettingsResponse {
  schema: SettingsSchema | null;
  values: SettingsValues;
}

export interface PageDefinition {
  id: string;
  path: string;
  title: string;
  component: ComponentLoader;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  component: ComponentLoader;
}

export interface RegisteredPage extends PageDefinition {
  pluginId: string;
}

export interface RegisteredWidget extends WidgetDefinition {
  pluginId: string;
}

export interface RegisteredPlugin {
  manifest: PluginManifest;
  pageIds: string[];
  widgetIds: string[];
}

export interface FrontendHookOptions {
  priority?: number;
}

export type FrontendAction = (...args: unknown[]) => void;
export type FrontendFilter<TValue = unknown> = (value: TValue, ...args: unknown[]) => TValue;

export interface FrontendHookEngine {
  addAction(name: string, fn: FrontendAction, opts?: FrontendHookOptions): string;
  addFilter<TValue>(name: string, fn: FrontendFilter<TValue>, opts?: FrontendHookOptions): string;
  doAction(name: string, ...args: unknown[]): void;
  applyFilters<TValue>(name: string, value: TValue, ...args: unknown[]): TValue;
  removeAction(name: string, id: string): boolean;
  removeFilter(name: string, id: string): boolean;
}

export interface FrontendEvent<TPayload = unknown> {
  name: string;
  payload: TPayload;
  timestamp: number;
}

export type FrontendEventHandler<TPayload = unknown> = (
  event: FrontendEvent<TPayload>,
) => void;

export interface FrontendEventBus {
  publish<TPayload>(name: string, payload: TPayload): void;
  subscribe<TPayload>(
    name: string,
    handler: FrontendEventHandler<TPayload>,
  ): string;
  unsubscribe(id: string): boolean;
}

export interface FrontendRegistrar {
  pages: {
    add(page: PageDefinition): void;
  };
  widgets: {
    add(widget: WidgetDefinition): void;
  };
  hooks: FrontendHookEngine;
  events: FrontendEventBus;
  settings: {
    setCustomComponent(loader: ComponentLoader<SettingsComponentProps>): void;
    addFieldComponent(id: string, component: FieldComponent): void;
  };
}

export interface PluginRuntimeState {
  plugins: RegisteredPlugin[];
  pages: RegisteredPage[];
  widgets: RegisteredWidget[];
  settingsComponents: Record<string, ComponentLoader<SettingsComponentProps>>;
  fieldComponents: Record<string, FieldComponent>;
}

export interface PluginLoadFailure {
  pluginId: string;
  error: string;
}

export interface PluginLoadSummary {
  plugins: PluginFrontendDescriptor[];
  discovered: number;
  loaded: string[];
  failed: PluginLoadFailure[];
}
