import { type Component, For, createSignal } from 'solid-js';
import Icon from '../components/Icon';

const pages = [
  { id: '1', title: 'Home', author: 'Admin', template: 'Default', date: 'Apr 5, 2026', status: 'published' },
  { id: '2', title: 'About Us', author: 'Admin', template: 'Full Width', date: 'Apr 3, 2026', status: 'published' },
  { id: '3', title: 'Contact', author: 'Admin', template: 'Default', date: 'Apr 1, 2026', status: 'published' },
  { id: '4', title: 'Privacy Policy', author: 'Admin', template: 'Default', date: 'Mar 28, 2026', status: 'published' },
  { id: '5', title: 'Terms of Service', author: 'Admin', template: 'Default', date: 'Mar 28, 2026', status: 'published' },
  { id: '6', title: 'Blog', author: 'Admin', template: 'Blog', date: 'Mar 25, 2026', status: 'published' },
  { id: '7', title: 'Pricing', author: 'Editor', template: 'Full Width', date: 'Mar 20, 2026', status: 'draft' },
  { id: '8', title: 'Documentation', author: 'Admin', template: 'Sidebar', date: 'Mar 15, 2026', status: 'published' },
];

const PagesManager: Component = () => {
  const [searchQuery, setSearchQuery] = createSignal('');

  const filteredPages = () => {
    if (!searchQuery()) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(searchQuery().toLowerCase()));
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <button class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]">
          <Icon name="plus" size={16} />
          Add New Page
        </button>
        <div class="relative w-64">
          <Icon name="search" size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80">
              <th class="w-10 px-4 py-3">
                <input type="checkbox" class="rounded border-slate-300 cursor-pointer" />
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Template
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <For each={filteredPages()}>
              {(page) => (
                <tr class="hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-200 group">
                  <td class="px-4 py-3">
                    <input type="checkbox" class="rounded border-slate-300 cursor-pointer" />
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <span class="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {page.title}
                      </span>
                      <div class="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">Edit</button>
                        <span class="text-slate-300">|</span>
                        <button class="text-xs text-red-600 hover:text-red-700 cursor-pointer">Trash</button>
                        <span class="text-slate-300">|</span>
                        <button class="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">View</button>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{page.author}</td>
                  <td class="px-4 py-3 text-sm text-slate-600">{page.template}</td>
                  <td class="px-4 py-3 text-sm text-slate-500">{page.date}</td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20'
                      }`}
                    >
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
};

export default PagesManager;
