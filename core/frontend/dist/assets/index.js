import { delegateEvents, insert, createComponent, effect, className, setAttribute, template, render } from 'solid-js/web';
import { createSignal, onMount, createMemo, For, Show, onCleanup, createResource } from 'solid-js';
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
    discovered: descriptors.length,
    loaded: [],
    failed: []
  };
  for (const descriptor of descriptors) {
    if (!descriptor.has_frontend || !descriptor.frontend_entry) {
      continue;
    }
    ensureStylesheet(documentRef, descriptor.frontend_style);
    try {
      await importer(descriptor.frontend_entry);
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

var _tmpl$ = /* @__PURE__ */ template(`<section class=widget-card><header><div><h3></h3><small></small></div><span class=pill>Widget`), _tmpl$2 = /* @__PURE__ */ template(`<p>Loading widget module…`), _tmpl$3 = /* @__PURE__ */ template(`<section class="page-frame panel"><header><div><small>Plugin page</small><h2></h2></div><span class=pill>`), _tmpl$4 = /* @__PURE__ */ template(`<p>Loading page module…`), _tmpl$5 = /* @__PURE__ */ template(`<p>Loaded <!> frontend bundle(s).`), _tmpl$6 = /* @__PURE__ */ template(`<p>`), _tmpl$7 = /* @__PURE__ */ template(`<div class=app-shell><aside class=sidebar><div class=brand><p>Plugin-driven CMS runtime</p><h1>BlitzPress Admin</h1><p>SolidJS core frontend that discovers plugin pages, widgets, hooks, and shared frontend modules at runtime.</p></div><section class=nav-section><h2>Navigation</h2><a href=/>Dashboard</a></section><section class=status-card><h2>Runtime status</h2><ul class=status-list><li> registered plugin runtime(s)</li><li> plugin page(s)</li><li> dashboard widget(s)</li></ul></section></aside><main class=main-content>`), _tmpl$8 = /* @__PURE__ */ template(`<a>`), _tmpl$9 = /* @__PURE__ */ template(`<p>Loading plugin frontends…`), _tmpl$0 = /* @__PURE__ */ template(`<section class=hero><p>Core frontend shell</p><h2>Runtime-loaded extensions</h2><p>The embedded SolidJS app now exposes frontend hooks, an event bus, plugin registries, and shared ESM modules that plugin frontends can consume without rebuilding the core.`), _tmpl$1 = /* @__PURE__ */ template(`<section class=metrics><article class=metric><strong></strong><span>Registered plugins</span></article><article class=metric><strong></strong><span>Plugin pages</span></article><article class=metric><strong></strong><span>Dashboard widgets`), _tmpl$10 = /* @__PURE__ */ template(`<section class=panel><h2>Extension lifecycle</h2><ol class=extension-list><li>Fetch plugin manifests from <code>/api/cms/plugins</code>.</li><li>Inject plugin stylesheets before each frontend module import.</li><li>Load plugin ES modules through the browser import map.</li><li>Let plugins register pages, widgets, hooks, events, and settings extensions.`), _tmpl$11 = /* @__PURE__ */ template(`<section class=grid>`), _tmpl$12 = /* @__PURE__ */ template(`<ul class=status-list>`), _tmpl$13 = /* @__PURE__ */ template(`<section class=empty-state><h2>No plugin widgets registered yet</h2><p>Install a plugin frontend and call <code>registerPlugin()</code> to populate the dashboard with widgets and routes.`), _tmpl$14 = /* @__PURE__ */ template(`<li>: `);
function normalizePath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
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
  const activePage = createMemo(() => pages().find((page) => normalizePath(page.path) === pathname()));
  const activePath = createMemo(() => pathname());
  return (() => {
    var _el$12 = _tmpl$7(), _el$13 = _el$12.firstChild, _el$14 = _el$13.firstChild, _el$15 = _el$14.nextSibling, _el$16 = _el$15.firstChild, _el$17 = _el$16.nextSibling, _el$18 = _el$15.nextSibling, _el$19 = _el$18.firstChild, _el$25 = _el$19.nextSibling, _el$26 = _el$25.firstChild, _el$27 = _el$26.firstChild, _el$28 = _el$26.nextSibling, _el$29 = _el$28.firstChild, _el$30 = _el$28.nextSibling, _el$31 = _el$30.firstChild, _el$32 = _el$13.nextSibling;
    _el$17.$$click = (event) => {
      event.preventDefault();
      navigate("/");
    };
    insert(_el$15, createComponent(For, {
      get each() {
        return pages();
      },
      children: (page) => (() => {
        var _el$33 = _tmpl$8();
        _el$33.$$click = (event) => {
          event.preventDefault();
          navigate(page.path);
        };
        insert(_el$33, () => page.title);
        effect((_p$) => {
          var _v$ = `nav-link${activePath() === normalizePath(page.path) ? " active" : ""}`, _v$2 = page.path;
          _v$ !== _p$.e && className(_el$33, _p$.e = _v$);
          _v$2 !== _p$.t && setAttribute(_el$33, "href", _p$.t = _v$2);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$33;
      })()
    }), null);
    insert(_el$18, createComponent(Show, {
      get when() {
        return loadStatus().state === "ready";
      },
      get fallback() {
        return _tmpl$9();
      },
      get children() {
        var _el$20 = _tmpl$5(), _el$21 = _el$20.firstChild, _el$23 = _el$21.nextSibling; _el$23.nextSibling;
        insert(_el$20, () => loadStatus().summary.loaded.length, _el$23);
        return _el$20;
      }
    }), _el$25);
    insert(_el$18, createComponent(Show, {
      get when() {
        return loadStatus().state === "error";
      },
      get children() {
        var _el$24 = _tmpl$6();
        insert(_el$24, () => loadStatus().message);
        return _el$24;
      }
    }), _el$25);
    insert(_el$26, () => runtimeState.plugins.length, _el$27);
    insert(_el$28, () => pages().length, _el$29);
    insert(_el$30, () => widgets().length, _el$31);
    insert(_el$32, createComponent(Show, {
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
    }));
    effect(() => className(_el$17, `nav-link${activePath() === "/" ? " active" : ""}`));
    return _el$12;
  })();
}
function Dashboard(props) {
  return [_tmpl$0(), (() => {
    var _el$36 = _tmpl$1(), _el$37 = _el$36.firstChild, _el$38 = _el$37.firstChild, _el$39 = _el$37.nextSibling, _el$40 = _el$39.firstChild, _el$41 = _el$39.nextSibling, _el$42 = _el$41.firstChild;
    insert(_el$38, () => runtimeState.plugins.length);
    insert(_el$40, () => runtimeState.pages.length);
    insert(_el$42, () => runtimeState.widgets.length);
    return _el$36;
  })(), _tmpl$10(), createComponent(Show, {
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
      var _el$44 = _tmpl$11();
      insert(_el$44, createComponent(For, {
        get each() {
          return props.widgets;
        },
        children: (widget) => createComponent(WidgetCard, {
          widget
        })
      }));
      return _el$44;
    }
  })];
}
function EmptyState(props) {
  const failures = () => props.status.state === "ready" ? props.status.summary.failed : [];
  return (() => {
    var _el$45 = _tmpl$13(), _el$46 = _el$45.firstChild; _el$46.nextSibling;
    insert(_el$45, createComponent(Show, {
      get when() {
        return failures().length > 0;
      },
      get children() {
        var _el$48 = _tmpl$12();
        insert(_el$48, createComponent(For, {
          get each() {
            return failures();
          },
          children: (failure) => (() => {
            var _el$49 = _tmpl$14(), _el$50 = _el$49.firstChild;
            insert(_el$49, () => failure.pluginId, _el$50);
            insert(_el$49, () => failure.error, null);
            return _el$49;
          })()
        }));
        return _el$48;
      }
    }), null);
    return _el$45;
  })();
}
delegateEvents(["click"]);

const mountNode = document.getElementById("app");
if (!mountNode) {
  throw new Error("BlitzPress frontend mount node '#app' was not found");
}
render(() => createComponent(App, {}), mountNode);
