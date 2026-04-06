import { A } from "@solidjs/router";
import { For, createSignal } from "solid-js";

import Icon from "../base/icons/Icon";

const posts = [
  { id: "1", title: "Getting Started with BlitzPress", author: "Admin", category: "Tutorials", date: "Apr 5, 2026", status: "published" },
  { id: "2", title: "How to Build Custom Plugins", author: "Admin", category: "Development", date: "Apr 4, 2026", status: "published" },
  { id: "3", title: "Advanced Theme Customization", author: "Editor", category: "Design", date: "Apr 3, 2026", status: "draft" },
  { id: "4", title: "Performance Optimization Guide", author: "Admin", category: "Tutorials", date: "Apr 2, 2026", status: "published" },
  { id: "5", title: "SEO Best Practices for CMS", author: "Author", category: "Marketing", date: "Apr 1, 2026", status: "draft" },
  { id: "6", title: "Understanding the Plugin API", author: "Admin", category: "Development", date: "Mar 30, 2026", status: "published" },
  { id: "7", title: "Database Migration Strategies", author: "Admin", category: "Development", date: "Mar 28, 2026", status: "published" },
  { id: "8", title: "User Authentication Deep Dive", author: "Editor", category: "Security", date: "Mar 25, 2026", status: "published" },
];

type Filter = "all" | "published" | "draft" | "trash";

const filters: { label: string; value: Filter; count: number }[] = [
  { label: "All", value: "all", count: 24 },
  { label: "Published", value: "published", count: 18 },
  { label: "Draft", value: "draft", count: 4 },
  { label: "Trash", value: "trash", count: 2 },
];

export default function PostsPage() {
  const [activeFilter, setActiveFilter] = createSignal<Filter>("all");
  const [selectedPosts, setSelectedPosts] = createSignal<string[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");

  const filteredPosts = () => {
    let result = posts;
    if (activeFilter() !== "all") {
      result = result.filter((post) => post.status === activeFilter());
    }
    if (searchQuery()) {
      result = result.filter((post) => post.title.toLowerCase().includes(searchQuery().toLowerCase()));
    }
    return result;
  };

  const togglePost = (id: string) => {
    setSelectedPosts((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    if (selectedPosts().length === filteredPosts().length) {
      setSelectedPosts([]);
      return;
    }

    setSelectedPosts(filteredPosts().map((post) => post.id));
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <A
          href="/posts/new"
          class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Icon name="plus" size={16} />
          Add New
        </A>
        <div class="relative w-64">
          <Icon name="search" size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery()}
            onInput={(event) => setSearchQuery(event.currentTarget.value)}
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      <div class="flex items-center gap-1 border-b border-slate-200">
        <For each={filters}>
          {(filter) => (
            <button
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              class={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeFilter() === filter.value
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {filter.label} <span class="font-normal text-slate-400">({filter.count})</span>
            </button>
          )}
        </For>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80">
              <th class="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedPosts().length === filteredPosts().length && filteredPosts().length > 0}
                  onChange={toggleAll}
                  class="cursor-pointer rounded border-slate-300"
                />
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Author</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <For each={filteredPosts()}>
              {(post) => (
                <tr class="group transition-colors hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent">
                  <td class="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts().includes(post.id)}
                      onChange={() => togglePost(post.id)}
                      class="cursor-pointer rounded border-slate-300"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <A
                        href={`/posts/${post.id}`}
                        class="text-sm font-medium text-slate-900 transition-colors hover:text-blue-600 group-hover:text-indigo-600"
                      >
                        {post.title}
                      </A>
                      <div class="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <A href={`/posts/${post.id}`} class="text-xs text-blue-600 hover:text-blue-700">Edit</A>
                        <span class="text-slate-300">|</span>
                        <button class="cursor-pointer text-xs text-red-600 hover:text-red-700">Trash</button>
                        <span class="text-slate-300">|</span>
                        <button class="cursor-pointer text-xs text-slate-500 hover:text-slate-700">View</button>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{post.author}</td>
                  <td class="px-4 py-3"><span class="text-sm text-blue-600">{post.category}</span></td>
                  <td class="px-4 py-3 text-sm text-slate-500">{post.date}</td>
                  <td class="px-4 py-3">
                    <span class={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${post.status === "published" ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20" : "bg-amber-50 text-amber-700 ring-amber-500/20"}`}>
                      {post.status}
                    </span>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-3">
          <div class="text-sm text-slate-500">Showing {filteredPosts().length} of {posts.length} posts</div>
          <div class="flex items-center gap-1">
            <button class="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-white">Previous</button>
            <button class="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">1</button>
            <button class="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-white">2</button>
            <button class="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-white">3</button>
            <button class="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
