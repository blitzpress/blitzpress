import { A, useParams } from "@solidjs/router";
import { For, createMemo, createSignal } from "solid-js";

import Icon from "../base/icons/Icon";

const categories = ["Tutorials", "Development", "Design", "Marketing", "Security", "News"];

export default function PostEditorPage() {
  const params = useParams();
  const isNew = createMemo(() => !params.id || params.id === "new");
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [status, setStatus] = createSignal("draft");
  const [selectedCategories, setSelectedCategories] = createSignal<string[]>([]);
  const [tags, setTags] = createSignal("");

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category],
    );
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <A href="/posts" class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <Icon name="arrow-left" size={20} />
          </A>
          <h2 class="text-xl font-semibold text-slate-900">{isNew() ? "New Post" : "Edit Post"}</h2>
        </div>
        <div class="flex items-center gap-3">
          <button class="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-slate-50">
            Save Draft
          </button>
          <button class="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            Publish
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">
          <div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
            <input
              type="text"
              placeholder="Post title"
              value={title()}
              onInput={(event) => setTitle(event.currentTarget.value)}
              class="mb-5 w-full border-0 bg-transparent p-0 text-2xl font-semibold text-slate-900 placeholder-slate-300 focus:outline-none"
            />
            <div class="overflow-hidden rounded-xl border border-slate-200">
              <div class="flex items-center gap-1 rounded-t-xl border-b border-slate-200 bg-slate-50/80 px-3 py-2">
                <button class="cursor-pointer rounded p-1.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">B</button>
                <button class="cursor-pointer rounded p-1.5 text-sm italic text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">I</button>
                <button class="cursor-pointer rounded p-1.5 text-sm underline text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700">U</button>
                <div class="mx-1 h-5 w-px bg-slate-200" />
                <button class="cursor-pointer rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"><Icon name="image" size={15} /></button>
                <button class="cursor-pointer rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"><Icon name="tag" size={15} /></button>
                <button class="cursor-pointer rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"><Icon name="external-link" size={15} /></button>
              </div>
              <textarea
                placeholder="Write your post content here..."
                value={content()}
                onInput={(event) => setContent(event.currentTarget.value)}
                rows={18}
                class="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
            <div class="border-b border-slate-100 p-4">
              <div class="flex items-center gap-2"><div class="h-4 w-1.5 rounded-full bg-indigo-500" /><h3 class="text-sm font-semibold text-slate-900">Publish</h3></div>
            </div>
            <div class="space-y-3 p-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Status</span>
                <select value={status()} onChange={(event) => setStatus(event.currentTarget.value)} class="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-1 text-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending Review</option>
                </select>
              </div>
              <div class="flex items-center justify-between text-sm"><span class="text-slate-500">Visibility</span><span class="text-slate-700">Public</span></div>
              <div class="flex items-center justify-between text-sm"><span class="text-slate-500">Publish</span><span class="text-slate-700">Immediately</span></div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
            <div class="border-b border-slate-100 p-4">
              <div class="flex items-center gap-2"><div class="h-4 w-1.5 rounded-full bg-violet-500" /><h3 class="text-sm font-semibold text-slate-900">Categories</h3></div>
            </div>
            <div class="max-h-48 space-y-2 overflow-y-auto p-4">
              <For each={categories}>
                {(category) => (
                  <label class="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={selectedCategories().includes(category)} onChange={() => toggleCategory(category)} class="rounded border-slate-300 text-blue-600" />
                    <span class="text-sm text-slate-700">{category}</span>
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
            <div class="border-b border-slate-100 p-4">
              <div class="flex items-center gap-2"><div class="h-4 w-1.5 rounded-full bg-amber-500" /><h3 class="text-sm font-semibold text-slate-900">Tags</h3></div>
            </div>
            <div class="p-4">
              <input
                type="text"
                placeholder="Add tags (comma separated)"
                value={tags()}
                onInput={(event) => setTags(event.currentTarget.value)}
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
            <div class="border-b border-slate-100 p-4">
              <div class="flex items-center gap-2"><div class="h-4 w-1.5 rounded-full bg-emerald-500" /><h3 class="text-sm font-semibold text-slate-900">Featured Image</h3></div>
            </div>
            <div class="p-4">
              <div class="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-8 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50/30">
                <Icon name="upload" size={24} class="mx-auto mb-2 text-slate-400" />
                <p class="text-sm text-slate-500">Click to upload</p>
                <p class="mt-1 text-xs text-slate-400">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
