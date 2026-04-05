import { type Component, For, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import Icon from '../components/Icon';

const stats = [
  { label: 'Total Posts', value: '24', change: '+3 this week', icon: 'file-text', gradient: 'from-blue-600 to-cyan-500', shadow: 'shadow-blue-500/20' },
  { label: 'Total Pages', value: '8', change: '+1 this week', icon: 'file', gradient: 'from-emerald-600 to-teal-400', shadow: 'shadow-emerald-500/20' },
  { label: 'Active Plugins', value: '3', change: 'All healthy', icon: 'puzzle', gradient: 'from-violet-600 to-purple-400', shadow: 'shadow-violet-500/20' },
  { label: 'Users', value: '5', change: '+2 this month', icon: 'users', gradient: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20' },
];

const recentPosts = [
  { title: 'Getting Started with BlitzPress', author: 'Admin', date: 'Apr 5, 2026', status: 'published' },
  { title: 'How to Build Custom Plugins', author: 'Admin', date: 'Apr 4, 2026', status: 'published' },
  { title: 'Advanced Theme Customization', author: 'Editor', date: 'Apr 3, 2026', status: 'draft' },
  { title: 'Performance Optimization Guide', author: 'Admin', date: 'Apr 2, 2026', status: 'published' },
  { title: 'SEO Best Practices for CMS', author: 'Author', date: 'Apr 1, 2026', status: 'draft' },
];

const activityLog = [
  { action: 'Published', item: 'Getting Started with BlitzPress', user: 'Admin', time: '2h ago', bg: 'bg-emerald-50', tc: 'text-emerald-600' },
  { action: 'Updated', item: 'Homepage', user: 'Admin', time: '4h ago', bg: 'bg-blue-50', tc: 'text-blue-600' },
  { action: 'Installed', item: 'SEO Plugin', user: 'Admin', time: '1d ago', bg: 'bg-violet-50', tc: 'text-violet-600' },
  { action: 'Created', item: 'About Us page', user: 'Editor', time: '2d ago', bg: 'bg-amber-50', tc: 'text-amber-600' },
  { action: 'Registered', item: 'john@example.com', user: 'System', time: '3d ago', bg: 'bg-slate-100', tc: 'text-slate-500' },
];

const Dashboard: Component = () => {
  const [draftTitle, setDraftTitle] = createSignal('');
  const [draftContent, setDraftContent] = createSignal('');

  return (
    <div class="space-y-6">
      <div class="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/15 animate-gradient">
        <div class="absolute -top-16 -right-16 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
        <div class="absolute -bottom-20 -left-16 w-60 h-60 bg-white/[0.07] rounded-full blur-3xl" />
        <div class="absolute top-4 right-32 w-24 h-24 bg-white/[0.04] rounded-2xl rotate-12" />
        <div class="absolute bottom-2 right-12 w-16 h-16 bg-white/[0.04] rounded-xl -rotate-6" />
        <div class="relative flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">Welcome back, Admin</h2>
            <p class="text-blue-100/80 mt-2 max-w-lg">
              Your site is performing great. 3 new posts this week with 128 total views.
            </p>
          </div>
          <A
            href="/posts/new"
            class="hidden md:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border border-white/20 shadow-lg shadow-black/10"
          >
            <Icon name="plus" size={16} />
            New Post
          </A>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <For each={stats}>
          {(stat) => (
            <div
              class={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 text-white shadow-lg ${stat.shadow} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
            >
              <div class="flex items-center justify-between mb-4">
                <div class="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner shadow-white/10">
                  <Icon name={stat.icon} size={22} class="text-white" />
                </div>
                <div class="flex items-center gap-1 text-[11px] text-white/70 bg-white/15 rounded-full px-2.5 py-1 font-medium">
                  <Icon name="trending-up" size={11} />
                  {stat.change}
                </div>
              </div>
              <div class="text-3xl font-extrabold tracking-tight">{stat.value}</div>
              <div class="text-sm text-white/70 mt-1 font-medium">{stat.label}</div>
            </div>
          )}
        </For>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2.5">
              <div class="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
              Recent Posts
            </h3>
            <A href="/posts" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              View all
            </A>
          </div>
          <div class="divide-y divide-slate-100/80">
            <For each={recentPosts}>
              {(post) => (
                <div class="flex items-center justify-between px-5 py-3.5 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-200 group">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">
                      by {post.author} &middot; {post.date}
                    </div>
                  </div>
                  <span
                    class={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
                      post.status === 'published'
                        ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/20'
                        : 'bg-amber-50 text-amber-600 ring-amber-500/20'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2.5">
              <div class="w-1.5 h-5 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full" />
              Quick Draft
            </h3>
          </div>
          <div class="p-5 space-y-3">
            <input
              type="text"
              placeholder="Post title"
              value={draftTitle()}
              onInput={(e) => setDraftTitle(e.currentTarget.value)}
              class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all bg-slate-50/50"
            />
            <textarea
              placeholder="What's on your mind?"
              value={draftContent()}
              onInput={(e) => setDraftContent(e.currentTarget.value)}
              rows={4}
              class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-200 transition-all resize-none bg-slate-50/50"
            />
            <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98]">
              Save Draft
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2.5">
              <div class="w-1.5 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              Recent Activity
            </h3>
          </div>
          <div class="divide-y divide-slate-100/80">
            <For each={activityLog}>
              {(item) => (
                <div class="flex items-start gap-3.5 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div
                    class={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-black/[0.04]`}
                  >
                    <Icon name="clock" size={14} class={item.tc} />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-slate-600">
                      <span class="font-semibold text-slate-800">{item.user}</span> {item.action.toLowerCase()}{' '}
                      <span class="font-medium text-slate-700">{item.item}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">{item.time}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2.5">
              <div class="w-1.5 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
              Site Health
            </h3>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-4 mb-6">
              <div class="relative w-16 h-16 flex-shrink-0">
                <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f1f5f9"
                    stroke-width="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#healthGrad)"
                    stroke-width="3"
                    stroke-dasharray="85, 100"
                    stroke-linecap="round"
                  />
                  <defs>
                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#10b981" />
                      <stop offset="100%" stop-color="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-sm font-bold text-emerald-600">85%</span>
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-800">Health Score</div>
                <div class="text-xs text-slate-400 mt-0.5">4 of 5 checks passed</div>
              </div>
            </div>
            <div class="space-y-3">
              <For
                each={[
                  { ok: true, label: 'Database connection healthy' },
                  { ok: true, label: 'All plugins loaded' },
                  { ok: true, label: 'File permissions correct' },
                  { ok: false, label: '1 plugin update available' },
                  { ok: true, label: 'SSL certificate valid' },
                ]}
              >
                {(item) => (
                  <div class="flex items-center gap-3">
                    <div
                      class={`w-5 h-5 rounded-full flex items-center justify-center ring-1 ${
                        item.ok
                          ? 'bg-emerald-50 ring-emerald-500/20'
                          : 'bg-amber-50 ring-amber-500/20'
                      }`}
                    >
                      <Icon
                        name={item.ok ? 'check' : 'bolt'}
                        size={10}
                        class={item.ok ? 'text-emerald-600' : 'text-amber-600'}
                      />
                    </div>
                    <span class="text-sm text-slate-600">{item.label}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
