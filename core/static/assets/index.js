import { delegateEvents, createComponent, insert, effect, template, setAttribute, Dynamic, className, render } from 'solid-js/web';
import { createMemo, createSignal, createEffect, createResource, Show, For, onMount, onCleanup } from 'solid-js';
import { runtimeState } from '@blitzpress/plugin-sdk';

true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload"))
    return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]'))
    processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList")
        continue;
      for (const node of mutation.addedNodes)
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity)
      fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy)
      fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

var _tmpl$$2 = /* @__PURE__ */ template(`<p class=settings-field-help>Field component <code></code> is not registered.`), _tmpl$2$2 = /* @__PURE__ */ template(`<textarea rows=4>`), _tmpl$3$2 = /* @__PURE__ */ template(`<input type=number>`), _tmpl$4$2 = /* @__PURE__ */ template(`<input type=checkbox>`), _tmpl$5$1 = /* @__PURE__ */ template(`<option value>Select an option`), _tmpl$6$1 = /* @__PURE__ */ template(`<select>`), _tmpl$7$1 = /* @__PURE__ */ template(`<option>`), _tmpl$8$1 = /* @__PURE__ */ template(`<input>`), _tmpl$9$1 = /* @__PURE__ */ template(`<span aria-hidden=true> *`), _tmpl$0$1 = /* @__PURE__ */ template(`<p class=settings-field-help>`), _tmpl$1$1 = /* @__PURE__ */ template(`<div class=settings-field><label><span class=settings-field-label>`), _tmpl$10$1 = /* @__PURE__ */ template(`<form class="panel settings-form"><button type=submit>`), _tmpl$11$1 = /* @__PURE__ */ template(`<fieldset class=settings-section><legend>`), _tmpl$12$1 = /* @__PURE__ */ template(`<p class=settings-form-error>`), _tmpl$13$1 = /* @__PURE__ */ template(`<section class="panel settings-form"><p>Loading custom settings component…`);
function hasOwnValue(values, key) {
  return Object.prototype.hasOwnProperty.call(values, key);
}
function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }
  return value;
}
function cloneSettingsValues(values) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, cloneValue(value)]));
}
function buildSettingsValues(schema, values = {}) {
  const merged = cloneSettingsValues(values);
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!hasOwnValue(merged, field.id) && field.default !== void 0) {
        merged[field.id] = cloneValue(field.default);
      }
    }
  }
  return merged;
}
function asString(value) {
  return value == null ? "" : String(value);
}
function asNumberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}
function inputType(field) {
  switch (field.type) {
    case "color":
    case "email":
    case "url":
      return field.type;
    default:
      return "text";
  }
}
function formatSaveError(error) {
  return error instanceof Error ? error.message : String(error);
}
function CustomFieldControl(props) {
  const component = createMemo(() => props.field.component ? runtimeState.fieldComponents[props.field.component] : void 0);
  return createComponent(Show, {
    get when() {
      return component();
    },
    get fallback() {
      return (() => {
        var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
        insert(_el$3, () => props.field.component || "unknown");
        return _el$;
      })();
    },
    children: (resolvedComponent) => createComponent(Dynamic, {
      get component() {
        return resolvedComponent();
      },
      get value() {
        return props.value();
      },
      get onChange() {
        return props.onChange;
      }
    })
  });
}
function StandardFieldControl(props) {
  const currentValue = () => props.value();
  if (props.field.type === "text") {
    return (() => {
      var _el$4 = _tmpl$2$2();
      _el$4.$$input = (event) => props.onChange(event.currentTarget.value);
      effect((_p$) => {
        var _v$ = props.field.id, _v$2 = props.field.id, _v$3 = props.field.required;
        _v$ !== _p$.e && setAttribute(_el$4, "id", _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$4, "name", _p$.t = _v$2);
        _v$3 !== _p$.a && (_el$4.required = _p$.a = _v$3);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      });
      effect(() => _el$4.value = asString(currentValue()));
      return _el$4;
    })();
  }
  if (props.field.type === "number") {
    return (() => {
      var _el$5 = _tmpl$3$2();
      _el$5.$$input = (event) => {
        const {
          value
        } = event.currentTarget;
        if (value.trim() === "") {
          props.onChange(void 0);
          return;
        }
        const parsed = Number(value);
        props.onChange(Number.isNaN(parsed) ? void 0 : parsed);
      };
      effect((_p$) => {
        var _v$4 = props.field.id, _v$5 = props.field.id, _v$6 = props.field.min, _v$7 = props.field.max, _v$8 = props.field.required;
        _v$4 !== _p$.e && setAttribute(_el$5, "id", _p$.e = _v$4);
        _v$5 !== _p$.t && setAttribute(_el$5, "name", _p$.t = _v$5);
        _v$6 !== _p$.a && setAttribute(_el$5, "min", _p$.a = _v$6);
        _v$7 !== _p$.o && setAttribute(_el$5, "max", _p$.o = _v$7);
        _v$8 !== _p$.i && (_el$5.required = _p$.i = _v$8);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0
      });
      effect(() => _el$5.value = asNumberValue(currentValue()));
      return _el$5;
    })();
  }
  if (props.field.type === "boolean") {
    return (() => {
      var _el$6 = _tmpl$4$2();
      _el$6.addEventListener("change", (event) => props.onChange(event.currentTarget.checked));
      effect((_p$) => {
        var _v$9 = props.field.id, _v$0 = props.field.id;
        _v$9 !== _p$.e && setAttribute(_el$6, "id", _p$.e = _v$9);
        _v$0 !== _p$.t && setAttribute(_el$6, "name", _p$.t = _v$0);
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      effect(() => _el$6.checked = Boolean(currentValue()));
      return _el$6;
    })();
  }
  if (props.field.type === "select") {
    const selectValue = () => asString(currentValue());
    return (() => {
      var _el$7 = _tmpl$6$1();
      _el$7.addEventListener("change", (event) => props.onChange(event.currentTarget.value));
      insert(_el$7, createComponent(Show, {
        get when() {
          return selectValue() === "";
        },
        get children() {
          return _tmpl$5$1();
        }
      }), null);
      insert(_el$7, createComponent(For, {
        get each() {
          return props.field.options || [];
        },
        children: (option) => (() => {
          var _el$9 = _tmpl$7$1();
          insert(_el$9, () => option.label);
          effect(() => _el$9.value = option.value);
          return _el$9;
        })()
      }), null);
      effect((_p$) => {
        var _v$1 = props.field.id, _v$10 = props.field.id, _v$11 = props.field.required;
        _v$1 !== _p$.e && setAttribute(_el$7, "id", _p$.e = _v$1);
        _v$10 !== _p$.t && setAttribute(_el$7, "name", _p$.t = _v$10);
        _v$11 !== _p$.a && (_el$7.required = _p$.a = _v$11);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      });
      effect(() => _el$7.value = selectValue());
      return _el$7;
    })();
  }
  return (() => {
    var _el$0 = _tmpl$8$1();
    _el$0.$$input = (event) => props.onChange(event.currentTarget.value);
    effect((_p$) => {
      var _v$12 = props.field.id, _v$13 = props.field.id, _v$14 = inputType(props.field), _v$15 = props.field.required;
      _v$12 !== _p$.e && setAttribute(_el$0, "id", _p$.e = _v$12);
      _v$13 !== _p$.t && setAttribute(_el$0, "name", _p$.t = _v$13);
      _v$14 !== _p$.a && setAttribute(_el$0, "type", _p$.a = _v$14);
      _v$15 !== _p$.o && (_el$0.required = _p$.o = _v$15);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    effect(() => _el$0.value = asString(currentValue()));
    return _el$0;
  })();
}
function SettingsField(props) {
  return (() => {
    var _el$1 = _tmpl$1$1(), _el$10 = _el$1.firstChild, _el$11 = _el$10.firstChild;
    insert(_el$11, () => props.field.label, null);
    insert(_el$11, createComponent(Show, {
      get when() {
        return props.field.required;
      },
      get children() {
        return _tmpl$9$1();
      }
    }), null);
    insert(_el$1, createComponent(Show, {
      get when() {
        return props.field.description;
      },
      get children() {
        var _el$13 = _tmpl$0$1();
        insert(_el$13, () => props.field.description);
        return _el$13;
      }
    }), null);
    insert(_el$1, createComponent(Show, {
      get when() {
        return props.field.type === "custom";
      },
      get fallback() {
        return createComponent(StandardFieldControl, {
          get field() {
            return props.field;
          },
          get value() {
            return props.value;
          },
          get onChange() {
            return props.onChange;
          }
        });
      },
      get children() {
        return createComponent(CustomFieldControl, {
          get field() {
            return props.field;
          },
          get value() {
            return props.value;
          },
          get onChange() {
            return props.onChange;
          }
        });
      }
    }), null);
    effect(() => setAttribute(_el$10, "for", props.field.id));
    return _el$1;
  })();
}
function CustomSettingsOverride(props) {
  const CustomSettingsComponent = props.component;
  return createComponent(CustomSettingsComponent, {
    get values() {
      return props.values;
    },
    get onSave() {
      return props.onSave;
    }
  });
}
function SettingsForm(props) {
  const initialValues = createMemo(() => buildSettingsValues(props.schema, props.values));
  const [values, setValues] = createSignal(initialValues());
  const [isSaving, setIsSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal();
  createEffect(() => {
    setValues(initialValues());
    setSaveError(void 0);
  });
  const [customSettingsModule] = createResource(() => runtimeState.settingsComponents[props.pluginId], async (loader) => loader ? loader() : null);
  const updateValue = (fieldID, value) => {
    setValues((currentValues) => ({
      ...currentValues,
      [fieldID]: cloneValue(value)
    }));
  };
  const saveValues = async (nextValues) => {
    const snapshot = cloneSettingsValues(nextValues);
    setIsSaving(true);
    setSaveError(void 0);
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
  return createComponent(Show, {
    get when() {
      return runtimeState.settingsComponents[props.pluginId];
    },
    get fallback() {
      return (() => {
        var _el$14 = _tmpl$10$1(), _el$15 = _el$14.firstChild;
        _el$14.addEventListener("submit", (event) => {
          event.preventDefault();
          void saveValues(values());
        });
        insert(_el$14, createComponent(For, {
          get each() {
            return props.schema.sections;
          },
          children: (section) => (() => {
            var _el$16 = _tmpl$11$1(), _el$17 = _el$16.firstChild;
            insert(_el$17, () => section.title);
            insert(_el$16, createComponent(For, {
              get each() {
                return section.fields;
              },
              children: (field) => createComponent(SettingsField, {
                field,
                value: () => values()[field.id],
                onChange: (value) => updateValue(field.id, value)
              })
            }), null);
            return _el$16;
          })()
        }), _el$15);
        insert(_el$14, createComponent(Show, {
          get when() {
            return saveError();
          },
          children: (message) => (() => {
            var _el$18 = _tmpl$12$1();
            insert(_el$18, message);
            return _el$18;
          })()
        }), _el$15);
        insert(_el$15, () => isSaving() ? "Saving…" : "Save settings");
        effect(() => _el$15.disabled = isSaving());
        return _el$14;
      })();
    },
    get children() {
      return createComponent(Show, {
        get when() {
          return customSettingsModule();
        },
        get fallback() {
          return _tmpl$13$1();
        },
        children: (loadedModule) => createComponent(CustomSettingsOverride, {
          get component() {
            return loadedModule().default;
          },
          get values() {
            return values();
          },
          onSave: saveValues
        })
      });
    }
  });
}
delegateEvents(["input"]);

var _tmpl$$1 = /* @__PURE__ */ template(`<section class="panel plugin-settings-view"><header class=plugin-settings-header><div><p>Plugin settings</p><h2></h2></div><code>`), _tmpl$2$1 = /* @__PURE__ */ template(`<p>Loading plugin settings…`), _tmpl$3$1 = /* @__PURE__ */ template(`<div class=settings-state><p></p><button type=button>Retry`), _tmpl$4$1 = /* @__PURE__ */ template(`<p>This plugin does not expose a settings schema.`);
function buildSettingsEndpoint(pluginId) {
  return `/api/admin/plugins/${encodeURIComponent(pluginId)}/settings`;
}
async function parseJSON(response) {
  const text = await response.text();
  if (!text) {
    return void 0;
  }
  return JSON.parse(text);
}
function formatSettingsRequestError(response, payload) {
  const fieldErrors = payload?.fields ? Object.entries(payload.fields).map(([field, message]) => `${field}: ${message}`) : [];
  const baseMessage = payload?.error || payload?.message || `plugin settings request failed: ${response.status} ${response.statusText}`;
  return fieldErrors.length > 0 ? `${baseMessage} (${fieldErrors.join(", ")})` : baseMessage;
}
async function fetchPluginSettings(pluginId, fetchImpl = fetch) {
  const response = await fetchImpl(buildSettingsEndpoint(pluginId));
  const payload = await parseJSON(response);
  if (!response.ok) {
    throw new Error(formatSettingsRequestError(response, payload));
  }
  return {
    schema: payload?.schema ?? null,
    values: payload?.values ?? {}
  };
}
async function savePluginSettings(pluginId, values, fetchImpl = fetch) {
  const response = await fetchImpl(buildSettingsEndpoint(pluginId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values
    })
  });
  const payload = await parseJSON(response);
  if (!response.ok) {
    throw new Error(formatSettingsRequestError(response, payload));
  }
  return payload?.values ?? {
    ...values
  };
}
function formatUnknownError(error) {
  return error instanceof Error ? error.message : String(error);
}
function PluginSettingsView(props) {
  const pluginLabel = createMemo(() => props.pluginName?.trim() || props.pluginId);
  const fetchImpl = () => props.fetch ?? fetch;
  const [settings, {
    mutate,
    refetch
  }] = createResource(() => props.pluginId, (pluginId) => fetchPluginSettings(pluginId, fetchImpl()));
  const handleSave = async (values) => {
    const savedValues = await savePluginSettings(props.pluginId, values, fetchImpl());
    mutate((current) => current ? {
      ...current,
      values: {
        ...savedValues
      }
    } : {
      schema: null,
      values: {
        ...savedValues
      }
    });
  };
  return (() => {
    var _el$ = _tmpl$$1(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$6 = _el$3.nextSibling;
    insert(_el$5, pluginLabel);
    insert(_el$6, () => props.pluginId);
    insert(_el$, createComponent(Show, {
      get when() {
        return !settings.loading;
      },
      get fallback() {
        return _tmpl$2$1();
      },
      get children() {
        return createComponent(Show, {
          get when() {
            return !settings.error;
          },
          get fallback() {
            return (() => {
              var _el$8 = _tmpl$3$1(), _el$9 = _el$8.firstChild, _el$0 = _el$9.nextSibling;
              insert(_el$9, () => formatUnknownError(settings.error));
              _el$0.$$click = () => void refetch();
              return _el$8;
            })();
          },
          get children() {
            return createComponent(Show, {
              get when() {
                return settings()?.schema;
              },
              get fallback() {
                return _tmpl$4$1();
              },
              children: (schema) => createComponent(SettingsForm, {
                get pluginId() {
                  return props.pluginId;
                },
                get schema() {
                  return schema();
                },
                get values() {
                  return settings()?.values ?? {};
                },
                onSave: handleSave
              })
            });
          }
        });
      }
    }), null);
    return _el$;
  })();
}
delegateEvents(["click"]);

const defaultImporter = (specifier) => import(
  /* @vite-ignore */
  specifier
);
function ensureStylesheet(documentRef, href) {
  if (!href) {
    return;
  }
  if (documentRef.head.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    return;
  }
  const link = documentRef.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  documentRef.head.appendChild(link);
}
function validateFrontendDescriptor(descriptor) {
  if (!descriptor.has_frontend) {
    return null;
  }
  if (!descriptor.frontend_entry) {
    return "plugin manifest is missing frontend_entry";
  }
  if (!descriptor.frontend_style) {
    return "plugin manifest is missing frontend_style";
  }
  return null;
}
async function fetchPluginDescriptors(fetchImpl) {
  const response = await fetchImpl("/api/cms/plugins");
  if (!response.ok) {
    throw new Error(`failed to load plugin manifest: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  return payload.plugins ?? [];
}
async function loadPlugins(options = {}) {
  const fetchImpl = options.fetch ?? fetch;
  const importer = options.importer ?? defaultImporter;
  const documentRef = options.document ?? document;
  const descriptors = await fetchPluginDescriptors(fetchImpl);
  const summary = {
    plugins: descriptors.map((descriptor) => ({ ...descriptor })),
    discovered: descriptors.length,
    loaded: [],
    failed: []
  };
  for (const descriptor of descriptors) {
    if (!descriptor.has_frontend) {
      continue;
    }
    const validationError = validateFrontendDescriptor(descriptor);
    if (validationError) {
      summary.failed.push({
        pluginId: descriptor.id,
        error: validationError
      });
      console.error(`invalid plugin frontend manifest: ${descriptor.id}`, validationError);
      continue;
    }
    const frontendEntry = descriptor.frontend_entry;
    const frontendStyle = descriptor.frontend_style;
    ensureStylesheet(documentRef, frontendStyle);
    try {
      await importer(frontendEntry);
      summary.loaded.push(descriptor.id);
    } catch (error) {
      summary.failed.push({
        pluginId: descriptor.id,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`failed to load plugin frontend: ${descriptor.id}`, error);
    }
  }
  return summary;
}

var _tmpl$ = /* @__PURE__ */ template(`<section class=widget-card><header><div><h3></h3><small></small></div><span class=pill>Widget`), _tmpl$2 = /* @__PURE__ */ template(`<p>Loading widget module…`), _tmpl$3 = /* @__PURE__ */ template(`<section class="page-frame panel"><header><div><small>Plugin page</small><h2></h2></div><span class=pill>`), _tmpl$4 = /* @__PURE__ */ template(`<p>Loading page module…`), _tmpl$5 = /* @__PURE__ */ template(`<section class=nav-section><h2>Plugin settings`), _tmpl$6 = /* @__PURE__ */ template(`<p>Discovered <!> plugin(s) and loaded <!> frontend bundle(s).`), _tmpl$7 = /* @__PURE__ */ template(`<p>`), _tmpl$8 = /* @__PURE__ */ template(`<div class=app-shell><aside class=sidebar><div class=brand><p>Plugin-driven CMS runtime</p><h1>BlitzPress Admin</h1><p>SolidJS core frontend that discovers plugin pages, widgets, hooks, and shared frontend modules at runtime.</p></div><section class=nav-section><h2>Navigation</h2><a href=/>Dashboard</a></section><section class=status-card><h2>Runtime status</h2><ul class=status-list><li> registered plugin runtime(s)</li><li> plugin page(s)</li><li> dashboard widget(s)</li></ul></section></aside><main class=main-content>`), _tmpl$9 = /* @__PURE__ */ template(`<a>`), _tmpl$0 = /* @__PURE__ */ template(`<a> settings`), _tmpl$1 = /* @__PURE__ */ template(`<p>Loading plugin frontends…`), _tmpl$10 = /* @__PURE__ */ template(`<section class=hero><p>Core frontend shell</p><h2>Runtime-loaded extensions</h2><p>The embedded SolidJS app now exposes frontend hooks, an event bus, plugin registries, and shared ESM modules that plugin frontends can consume without rebuilding the core.`), _tmpl$11 = /* @__PURE__ */ template(`<section class=metrics><article class=metric><strong></strong><span>Registered plugins</span></article><article class=metric><strong></strong><span>Plugin pages</span></article><article class=metric><strong></strong><span>Dashboard widgets`), _tmpl$12 = /* @__PURE__ */ template(`<section class=panel><h2>Extension lifecycle</h2><ol class=extension-list><li>Fetch plugin manifests from <code>/api/cms/plugins</code>.</li><li>Inject plugin stylesheets before each frontend module import.</li><li>Load plugin ES modules through the browser import map.</li><li>Let plugins register pages, widgets, hooks, events, and settings extensions.</li><li>Auto-render plugin settings from schema or a plugin-provided custom settings component.`), _tmpl$13 = /* @__PURE__ */ template(`<section class=grid>`), _tmpl$14 = /* @__PURE__ */ template(`<section class=empty-state><h2>No plugin widgets registered yet</h2><p>Install a plugin frontend and call <code>registerPlugin()</code> to populate the dashboard with widgets and routes.`), _tmpl$15 = /* @__PURE__ */ template(`<ul class=status-list>`), _tmpl$16 = /* @__PURE__ */ template(`<li>: `);
function normalizePath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
function pluginSettingsPath(pluginId) {
  return `/admin/plugins/${pluginId}/settings`;
}
function parsePluginSettingsPath(pathname) {
  const match = normalizePath(pathname).match(/^\/admin\/plugins\/([^/]+)\/settings$/);
  return match ? decodeURIComponent(match[1]) : void 0;
}
function createLocationSignal() {
  const [pathname, setPathname] = createSignal(normalizePath(window.location.pathname));
  const sync = () => setPathname(normalizePath(window.location.pathname));
  onMount(() => {
    window.addEventListener("popstate", sync);
  });
  onCleanup(() => {
    window.removeEventListener("popstate", sync);
  });
  const navigate = (nextPath) => {
    const normalized = normalizePath(nextPath);
    if (normalized === pathname()) {
      return;
    }
    window.history.pushState({}, "", normalized);
    setPathname(normalized);
  };
  return [pathname, navigate];
}
function WidgetCard(props) {
  const [module] = createResource(() => props.widget.id, async () => props.widget.component());
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling;
    insert(_el$4, () => props.widget.title);
    insert(_el$5, () => props.widget.pluginId);
    insert(_el$, createComponent(Show, {
      get when() {
        return module();
      },
      get fallback() {
        return _tmpl$2();
      },
      children: (loadedModule) => {
        const Widget = loadedModule().default;
        return createComponent(Widget, {});
      }
    }), null);
    return _el$;
  })();
}
function PluginPage(props) {
  const [module] = createResource(() => props.page.id, async () => props.page.component());
  return (() => {
    var _el$7 = _tmpl$3(), _el$8 = _el$7.firstChild, _el$9 = _el$8.firstChild, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling, _el$10 = _el$9.nextSibling;
    insert(_el$1, () => props.page.title);
    insert(_el$10, () => props.page.pluginId);
    insert(_el$7, createComponent(Show, {
      get when() {
        return module();
      },
      get fallback() {
        return _tmpl$4();
      },
      children: (loadedModule) => {
        const Page = loadedModule().default;
        return createComponent(Page, {});
      }
    }), null);
    return _el$7;
  })();
}
function App() {
  const [pathname, navigate] = createLocationSignal();
  const [loadStatus, setLoadStatus] = createSignal({
    state: "idle"
  });
  onMount(async () => {
    setLoadStatus({
      state: "loading"
    });
    try {
      const summary = await loadPlugins();
      setLoadStatus({
        state: "ready",
        summary
      });
    } catch (error) {
      setLoadStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  const pages = createMemo(() => runtimeState.pages);
  const widgets = createMemo(() => runtimeState.widgets);
  const discoveredPlugins = createMemo(() => {
    const status = loadStatus();
    return status.state === "ready" ? status.summary.plugins : [];
  });
  const activePage = createMemo(() => pages().find((page) => normalizePath(page.path) === pathname()));
  const activeSettingsPluginID = createMemo(() => parsePluginSettingsPath(pathname()));
  const activeSettingsPlugin = createMemo(() => activeSettingsPluginID() ? discoveredPlugins().find((plugin) => plugin.id === activeSettingsPluginID()) : void 0);
  const activePath = createMemo(() => pathname());
  return (() => {
    var _el$12 = _tmpl$8(), _el$13 = _el$12.firstChild, _el$14 = _el$13.firstChild, _el$15 = _el$14.nextSibling, _el$16 = _el$15.firstChild, _el$17 = _el$16.nextSibling, _el$20 = _el$15.nextSibling, _el$21 = _el$20.firstChild, _el$29 = _el$21.nextSibling, _el$30 = _el$29.firstChild, _el$31 = _el$30.firstChild, _el$32 = _el$30.nextSibling, _el$33 = _el$32.firstChild, _el$34 = _el$32.nextSibling, _el$35 = _el$34.firstChild, _el$36 = _el$13.nextSibling;
    _el$17.$$click = (event) => {
      event.preventDefault();
      navigate("/");
    };
    insert(_el$15, createComponent(For, {
      get each() {
        return pages();
      },
      children: (page) => (() => {
        var _el$37 = _tmpl$9();
        _el$37.$$click = (event) => {
          event.preventDefault();
          navigate(page.path);
        };
        insert(_el$37, () => page.title);
        effect((_p$) => {
          var _v$ = `nav-link${activePath() === normalizePath(page.path) ? " active" : ""}`, _v$2 = page.path;
          _v$ !== _p$.e && className(_el$37, _p$.e = _v$);
          _v$2 !== _p$.t && setAttribute(_el$37, "href", _p$.t = _v$2);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$37;
      })()
    }), null);
    insert(_el$13, createComponent(Show, {
      get when() {
        return discoveredPlugins().length > 0;
      },
      get children() {
        var _el$18 = _tmpl$5(); _el$18.firstChild;
        insert(_el$18, createComponent(For, {
          get each() {
            return discoveredPlugins();
          },
          children: (plugin) => (() => {
            var _el$38 = _tmpl$0(), _el$39 = _el$38.firstChild;
            _el$38.$$click = (event) => {
              event.preventDefault();
              navigate(pluginSettingsPath(plugin.id));
            };
            insert(_el$38, () => plugin.name, _el$39);
            effect((_p$) => {
              var _v$3 = `nav-link${activePath() === pluginSettingsPath(plugin.id) ? " active" : ""}`, _v$4 = pluginSettingsPath(plugin.id);
              _v$3 !== _p$.e && className(_el$38, _p$.e = _v$3);
              _v$4 !== _p$.t && setAttribute(_el$38, "href", _p$.t = _v$4);
              return _p$;
            }, {
              e: void 0,
              t: void 0
            });
            return _el$38;
          })()
        }), null);
        return _el$18;
      }
    }), _el$20);
    insert(_el$20, createComponent(Show, {
      get when() {
        return loadStatus().state === "ready";
      },
      get fallback() {
        return _tmpl$1();
      },
      get children() {
        var _el$22 = _tmpl$6(), _el$23 = _el$22.firstChild, _el$26 = _el$23.nextSibling, _el$24 = _el$26.nextSibling, _el$27 = _el$24.nextSibling; _el$27.nextSibling;
        insert(_el$22, () => loadStatus().summary.plugins.length, _el$26);
        insert(_el$22, () => loadStatus().summary.loaded.length, _el$27);
        return _el$22;
      }
    }), _el$29);
    insert(_el$20, createComponent(Show, {
      get when() {
        return loadStatus().state === "error";
      },
      get children() {
        var _el$28 = _tmpl$7();
        insert(_el$28, () => loadStatus().message);
        return _el$28;
      }
    }), _el$29);
    insert(_el$20, createComponent(PluginLoadFailures, {
      get status() {
        return loadStatus();
      }
    }), _el$29);
    insert(_el$30, () => runtimeState.plugins.length, _el$31);
    insert(_el$32, () => pages().length, _el$33);
    insert(_el$34, () => widgets().length, _el$35);
    insert(_el$36, createComponent(Show, {
      get when() {
        return activeSettingsPluginID();
      },
      get fallback() {
        return createComponent(Show, {
          get when() {
            return activePage();
          },
          get fallback() {
            return createComponent(Dashboard, {
              get status() {
                return loadStatus();
              },
              get widgets() {
                return widgets();
              }
            });
          },
          children: (page) => createComponent(PluginPage, {
            get page() {
              return page();
            }
          })
        });
      },
      children: (pluginId) => createComponent(PluginSettingsView, {
        get pluginId() {
          return pluginId();
        },
        get pluginName() {
          return activeSettingsPlugin()?.name;
        }
      })
    }));
    effect(() => className(_el$17, `nav-link${activePath() === "/" ? " active" : ""}`));
    return _el$12;
  })();
}
function Dashboard(props) {
  return [_tmpl$10(), (() => {
    var _el$42 = _tmpl$11(), _el$43 = _el$42.firstChild, _el$44 = _el$43.firstChild, _el$45 = _el$43.nextSibling, _el$46 = _el$45.firstChild, _el$47 = _el$45.nextSibling, _el$48 = _el$47.firstChild;
    insert(_el$44, () => runtimeState.plugins.length);
    insert(_el$46, () => runtimeState.pages.length);
    insert(_el$48, () => runtimeState.widgets.length);
    return _el$42;
  })(), _tmpl$12(), createComponent(Show, {
    get when() {
      return props.widgets.length > 0;
    },
    get fallback() {
      return createComponent(EmptyState, {
        get status() {
          return props.status;
        }
      });
    },
    get children() {
      var _el$50 = _tmpl$13();
      insert(_el$50, createComponent(For, {
        get each() {
          return props.widgets;
        },
        children: (widget) => createComponent(WidgetCard, {
          widget
        })
      }));
      return _el$50;
    }
  })];
}
function EmptyState(props) {
  return (() => {
    var _el$51 = _tmpl$14(), _el$52 = _el$51.firstChild; _el$52.nextSibling;
    insert(_el$51, createComponent(PluginLoadFailures, {
      get status() {
        return props.status;
      }
    }), null);
    return _el$51;
  })();
}
function PluginLoadFailures(props) {
  const failures = () => props.status.state === "ready" ? props.status.summary.failed : [];
  return createComponent(Show, {
    get when() {
      return failures().length > 0;
    },
    get children() {
      var _el$54 = _tmpl$15();
      insert(_el$54, createComponent(For, {
        get each() {
          return failures();
        },
        children: (failure) => (() => {
          var _el$55 = _tmpl$16(), _el$56 = _el$55.firstChild;
          insert(_el$55, () => failure.pluginId, _el$56);
          insert(_el$55, () => failure.error, null);
          return _el$55;
        })()
      }));
      return _el$54;
    }
  });
}
delegateEvents(["click"]);

const mountNode = document.getElementById("app");
if (!mountNode) {
  throw new Error("BlitzPress frontend mount node '#app' was not found");
}
render(() => createComponent(App, {}), mountNode);
