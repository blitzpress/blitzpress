import { type Component, For, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import Icon from '../components/Icon';

const posts = [
  { id: '1', title: 'Getting Started with BlitzPress', author: 'Admin', category: 'Tutorials', date: 'Apr 5, 2026', status: 'published' },
  { id: '2', title: 'How to Build Custom Plugins', author: 'Admin', category: 'Development', date: 'Apr 4, 2026', status: 'published' },
  { id: '3', title: 'Advanced Theme Customization', author: 'Editor', category: 'Design', date: 'Apr 3, 2026', status: 'draft' },
  { id: '4', title: 'Performance Optimization Guide', author: 'Admin', category: 'Tutorials', date: 'Apr 2, 2026', status: 'published' },
  { id: '5', title: 'SEO Best Practices for CMS', author: 'Author', category: 'Marketing', date: 'Apr 1, 2026', status: 'draft' },
  { id: '6', title: 'Understanding the Plugin API', author: 'Admin', category: 'Development', date: 'Mar 30, 2026', status: 'published' },
  { id: '7', title: 'Database Migration Strategies', author: 'Admin', category: 'Development', date: 'Mar 28, 2026', status: 'published' },
  { id: '8', title: 'User Authentication Deep Dive', author: 'Editor', category: 'Security', date: 'Mar 25, 2026', status: 'published' },
];

type Filter = 'all' | 'published' | 'draft' | 'trash';

const filters: { label: string; value: Filter; count: number }[] = [
  { label: 'All', value: 'all', count: 24 },
  { label: 'Published', value: 'published', count: 18 },
  { label: 'Draft', value: 'draft', count: 4 },
  { label: 'Trash', value: 'trash', count: 2 },
];

const Posts: Component = () => {
  const [activeFilter, setActiveFilter] = createSignal<Filter>('all');
  const [selectedPosts, setSelectedPosts] = createSignal<string[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');

  const filteredPosts = () => {
    let result = posts;
    if (activeFilter() !== 'all') {
      result = result.filter((p) => p.status === activeFilter());
    }
    if (searchQuery()) {
      result = result.filter((p) => p.title.toLowerCase().includes(searchQuery().toLowerCase()));
    }
    return result;
  };

  const togglePost = (id: string) => {
    setSelectedPosts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedPosts().length === filteredPosts().length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts().map((p) => p.id));
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <A
            href="/posts/new"
            class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]"
          >
            <Icon name="plus" size={16} />
            Add New
          </A>
        </div>
        <div class="relative w-64">
          <Icon name="search" size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200"
          />
        </div>
      </div>

      <div class="flex items-center gap-1 border-b border-slate-200">
        <For each={filters}>
          {(filter) => (
            <button
              onClick={() => setActiveFilter(filter.value)}
              class={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeFilter() === filter.value
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {filter.label} <span class="text-slate-400 font-normal">({filter.count})</span>
            </button>
          )}
        </For>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80">
              <th class="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedPosts().length === filteredPosts().length && filteredPosts().length > 0}
                  onChange={toggleAll}
                  class="rounded border-slate-300 cursor-pointer"
                />
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <For each={filteredPosts()}>
              {(post) => (
                <tr class="hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-colors group">
                  <td class="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts().includes(post.id)}
                      onChange={() => togglePost(post.id)}
                      class="rounded border-slate-300 cursor-pointer"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <A
                        href={`/posts/${post.id}`}
                        class="text-sm font-medium text-slate-900 hover:text-blue-600 group-hover:text-indigo-600 transition-colors"
                      >
                        {post.title}
                      </A>
                      <div class="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <A href={`/posts/${post.id}`} class="text-xs text-blue-600 hover:text-blue-700">
                          Edit
                        </A>
                        <span class="text-slate-300">|</span>
                        <button class="text-xs text-red-600 hover:text-red-700 cursor-pointer">Trash</button>
                        <span class="text-slate-300">|</span>
                        <button class="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">View</button>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{post.author}</td>
                  <td class="px-4 py-3">
                    <span class="text-sm text-blue-600">{post.category}</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-500">{post.date}</td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
                        post.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20' : 'bg-amber-50 text-amber-700 ring-amber-500/20'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <div class="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/80">
          <div class="text-sm text-slate-500">Showing {filteredPosts().length} of {posts.length} posts</div>
          <div class="flex items-center gap-1">
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-colors cursor-pointer">
              Previous
            </button>
            <button class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg cursor-pointer">1</button>
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-colors cursor-pointer">
              2
            </button>
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-colors cursor-pointer">
              3
            </button>
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-colors cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Posts;
