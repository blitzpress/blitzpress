import { type Component, createSignal, For } from 'solid-js';
import { A } from '@solidjs/router';
import Icon from '../components/Icon';

const categories = ['Tutorials', 'Development', 'Design', 'Marketing', 'Security', 'News'];

const PostEditor: Component = () => {
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [status, setStatus] = createSignal('draft');
  const [selectedCategories, setSelectedCategories] = createSignal<string[]>([]);
  const [tags, setTags] = createSignal('');

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <A
            href="/posts"
            class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Icon name="arrow-left" size={20} />
          </A>
          <h2 class="text-xl font-semibold text-slate-900">New Post</h2>
        </div>
        <div class="flex items-center gap-3">
          <button class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-200 transition-colors cursor-pointer">
            Save Draft
          </button>
          <button class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer">
            Publish
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <input
              type="text"
              placeholder="Post title"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              class="w-full text-2xl font-semibold text-slate-900 placeholder-slate-300 border-0 focus:outline-none p-0 mb-5 bg-transparent"
            />
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <div class="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50/80 rounded-t-xl">
                <button class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer text-sm font-bold">
                  B
                </button>
                <button class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer text-sm italic">
                  I
                </button>
                <button class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer text-sm underline">
                  U
                </button>
                <div class="w-px h-5 bg-slate-200 mx-1" />
                <button class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer">
                  <Icon name="image" size={15} />
                </button>
                <button class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer">
                  <Icon name="tag" size={15} />
                </button>
                <button class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer">
                  <Icon name="external-link" size={15} />
                </button>
              </div>
              <textarea
                placeholder="Write your post content here..."
                value={content()}
                onInput={(e) => setContent(e.currentTarget.value)}
                rows={18}
                class="w-full px-4 py-3 text-sm text-slate-700 border-0 focus:outline-none resize-none bg-transparent"
              />
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
            <div class="p-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h3 class="font-semibold text-sm text-slate-900">Publish</h3>
              </div>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Status</span>
                <select
                  value={status()}
                  onChange={(e) => setStatus(e.currentTarget.value)}
                  class="border border-slate-200 rounded-xl px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 cursor-pointer bg-slate-50/50"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending Review</option>
                </select>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Visibility</span>
                <span class="text-slate-700">Public</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Publish</span>
                <span class="text-slate-700">Immediately</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
            <div class="p-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-violet-500 rounded-full" />
                <h3 class="font-semibold text-sm text-slate-900">Categories</h3>
              </div>
            </div>
            <div class="p-4 space-y-2 max-h-48 overflow-y-auto">
              <For each={categories}>
                {(cat) => (
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories().includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      class="rounded border-slate-300 text-blue-600"
                    />
                    <span class="text-sm text-slate-700">{cat}</span>
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
            <div class="p-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-amber-500 rounded-full" />
                <h3 class="font-semibold text-sm text-slate-900">Tags</h3>
              </div>
            </div>
            <div class="p-4">
              <input
                type="text"
                placeholder="Add tags (comma separated)"
                value={tags()}
                onInput={(e) => setTags(e.currentTarget.value)}
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200"
              />
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
            <div class="p-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <h3 class="font-semibold text-sm text-slate-900">Featured Image</h3>
              </div>
            </div>
            <div class="p-4">
              <div class="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
                <Icon name="upload" size={24} class="text-slate-400 mx-auto mb-2" />
                <p class="text-sm text-slate-500">Click to upload</p>
                <p class="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
