import { insert, createComponent, effect, setAttribute, template } from 'solid-js/web';
import { createResource, createMemo, Show, For } from 'solid-js';
import { hooks } from '@blitzpress/plugin-sdk';

var _tmpl$ = /* @__PURE__ */ template(`<div class=example-plugin-home><section class=example-plugin-hero><div><p class=eyebrow>Example plugin frontend</p><h3>Runtime-loaded SolidJS page</h3><p>This page is registered from <code>example-plugin/frontend/src/index.ts</code> and loaded through the shared BlitzPress import map.</p></div><span class=status-badge>Shared ESM module</span></section><div class=example-plugin-grid><section class=example-plugin-panel><h4>Backend status</h4></section><section class=example-plugin-panel><h4>Frontend filter preview</h4><p>The example plugin appends its route to the <code>admin.menu.items</code> frontend filter hook.</p><ul class=menu-preview>`), _tmpl$2 = /* @__PURE__ */ template(`<p>Loading plugin status…`), _tmpl$3 = /* @__PURE__ */ template(`<dl class=status-list><div><dt>Name</dt><dd></dd></div><div><dt>Greeting</dt><dd></dd></div><div><dt>Mode</dt><dd></dd></div><div><dt>Items per page</dt><dd></dd></div><div><dt>Static asset</dt><dd><a target=_blank rel=noreferrer>`), _tmpl$4 = /* @__PURE__ */ template(`<p>`), _tmpl$5 = /* @__PURE__ */ template(`<li><strong></strong><span>`);
const defaultMenuItems = [{
  id: "dashboard",
  label: "Dashboard",
  path: "/",
  description: "Core dashboard route."
}, {
  id: "settings",
  label: "Settings",
  path: "/admin/settings",
  description: "Illustrative admin settings route."
}];
async function fetchStatus() {
  const response = await fetch("/api/plugins/example-plugin/status");
  if (!response.ok) {
    throw new Error(`Failed to load example plugin status: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}
function Home() {
  const [status] = createResource(fetchStatus);
  const menuItems = createMemo(() => hooks.applyFilters("admin.menu.items", defaultMenuItems.map((item) => ({
    ...item
  }))));
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.firstChild; _el$4.firstChild; var _el$6 = _el$4.nextSibling, _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling;
    insert(_el$4, createComponent(Show, {
      get when() {
        return status();
      },
      get fallback() {
        return _tmpl$2();
      },
      children: (loadedStatus) => (() => {
        var _el$1 = _tmpl$3(), _el$10 = _el$1.firstChild, _el$11 = _el$10.firstChild, _el$12 = _el$11.nextSibling, _el$13 = _el$10.nextSibling, _el$14 = _el$13.firstChild, _el$15 = _el$14.nextSibling, _el$16 = _el$13.nextSibling, _el$17 = _el$16.firstChild, _el$18 = _el$17.nextSibling, _el$19 = _el$16.nextSibling, _el$20 = _el$19.firstChild, _el$21 = _el$20.nextSibling, _el$22 = _el$19.nextSibling, _el$23 = _el$22.firstChild, _el$24 = _el$23.nextSibling, _el$25 = _el$24.firstChild;
        insert(_el$12, () => loadedStatus().name);
        insert(_el$15, () => loadedStatus().greeting);
        insert(_el$18, () => loadedStatus().mode);
        insert(_el$21, () => loadedStatus().items_per_page);
        insert(_el$25, () => loadedStatus().static_asset);
        effect(() => setAttribute(_el$25, "href", loadedStatus().static_asset));
        return _el$1;
      })()
    }), null);
    insert(_el$9, createComponent(For, {
      get each() {
        return menuItems();
      },
      children: (item) => (() => {
        var _el$26 = _tmpl$5(), _el$27 = _el$26.firstChild, _el$28 = _el$27.nextSibling;
        insert(_el$27, () => item.label);
        insert(_el$28, () => item.path);
        insert(_el$26, createComponent(Show, {
          get when() {
            return item.description;
          },
          get children() {
            var _el$29 = _tmpl$4();
            insert(_el$29, () => item.description);
            return _el$29;
          }
        }), null);
        return _el$26;
      })()
    }));
    return _el$;
  })();
}

export { Home as default };
