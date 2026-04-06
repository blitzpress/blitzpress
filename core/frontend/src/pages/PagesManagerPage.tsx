import { For, createSignal } from "solid-js";

import Icon from "../base/icons/Icon";

const pages = [
  { id: "1", title: "Home", author: "Admin", template: "Default", date: "Apr 5, 2026", status: "published" },
  { id: "2", title: "About Us", author: "Admin", template: "Full Width", date: "Apr 3, 2026", status: "published" },
  { id: "3", title: "Contact", author: "Admin", template: "Default", date: "Apr 1, 2026", status: "published" },
  { id: "4", title: "Privacy Policy", author: "Admin", template: "Default", date: "Mar 28, 2026", status: "published" },
  { id: "5", title: "Terms of Service", author: "Admin", template: "Default", date: "Mar 28, 2026", status: "published" },
  { id: "6", title: "Blog", author: "Admin", template: "Blog", date: "Mar 25, 2026", status: "published" },
  { id: "7", title: "Pricing", author: "Editor", template: "Full Width", date: "Mar 20, 2026", status: "draft" },
  { id: "8", title: "Documentation", author: "Admin", template: "Sidebar", date: "Mar 15, 2026", status: "published" },
];

export default function PagesManagerPage() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const filteredPages = () => searchQuery()
    ? pages.filter((page) => page.title.toLowerCase().includes(searchQuery().toLowerCase()))
    : pages;

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <button class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]">
          <Icon name="plus" size={16} />
          Add New Page
        </button>
        <div class="relative w-64">
          <Icon name="search" size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery()}
            onInput={(event) => setSearchQuery(event.currentTarget.value)}
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80">
              <th class="w-10 px-4 py-3"><input type="checkbox" class="cursor-pointer rounded border-slate-300" /></th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Author</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Template</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <For each={filteredPages()}>
              {(page) => (
                <tr class="group transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent">
                  <td class="px-4 py-3"><input type="checkbox" class="cursor-pointer rounded border-slate-300" /></td>
                  <td class="px-4 py-3">
                    <div>
                      <span class="cursor-pointer text-sm font-medium text-slate-900 transition-colors hover:text-blue-600">{page.title}</span>
                      <div class="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button class="cursor-pointer text-xs text-blue-600 hover:text-blue-700">Edit</button>
                        <span class="text-slate-300">|</span>
                        <button class="cursor-pointer text-xs text-red-600 hover:text-red-700">Trash</button>
                        <span class="text-slate-300">|</span>
                        <button class="cursor-pointer text-xs text-slate-500 hover:text-slate-700">View</button>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{page.author}</td>
                  <td class="px-4 py-3 text-sm text-slate-600">{page.template}</td>
                  <td class="px-4 py-3 text-sm text-slate-500">{page.date}</td>
                  <td class="px-4 py-3">
                    <span class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${page.status === "published" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20" : "bg-amber-50 text-amber-700 ring-1 ring-amber-500/20"}`}>
                      {page.status}
                    </span>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
