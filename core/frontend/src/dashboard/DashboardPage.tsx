import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { runtimeState } from "@blitzpress/plugin-sdk";

import { useAdminRuntime } from "../base/app/AdminRuntimeProvider";
import Icon from "../base/icons/Icon";
import RuntimeWidgetCard from "./RuntimeWidgetCard";

const stats = [
  { label: "Total Posts", value: "24", change: "+3 this week", icon: "file-text", gradient: "from-blue-600 to-cyan-500", shadow: "shadow-blue-500/20" },
  { label: "Total Pages", value: "8", change: "+1 this week", icon: "file", gradient: "from-emerald-600 to-teal-400", shadow: "shadow-emerald-500/20" },
  { label: "Active Plugins", value: "3", change: "All healthy", icon: "puzzle", gradient: "from-violet-600 to-purple-400", shadow: "shadow-violet-500/20" },
  { label: "Users", value: "5", change: "+2 this month", icon: "users", gradient: "from-amber-500 to-orange-400", shadow: "shadow-amber-500/20" },
];

const recentPosts = [
  { title: "Getting Started with BlitzPress", author: "Admin", date: "Apr 5, 2026", status: "published" },
  { title: "How to Build Custom Plugins", author: "Admin", date: "Apr 4, 2026", status: "published" },
  { title: "Advanced Theme Customization", author: "Editor", date: "Apr 3, 2026", status: "draft" },
  { title: "Performance Optimization Guide", author: "Admin", date: "Apr 2, 2026", status: "published" },
  { title: "SEO Best Practices for CMS", author: "Author", date: "Apr 1, 2026", status: "draft" },
];

const activityLog = [
  { action: "Published", item: "Getting Started with BlitzPress", user: "Admin", time: "2h ago", bg: "bg-emerald-50", tc: "text-emerald-600" },
  { action: "Updated", item: "Homepage", user: "Admin", time: "4h ago", bg: "bg-blue-50", tc: "text-blue-600" },
  { action: "Installed", item: "SEO Plugin", user: "Admin", time: "1d ago", bg: "bg-violet-50", tc: "text-violet-600" },
  { action: "Created", item: "About Us page", user: "Editor", time: "2d ago", bg: "bg-amber-50", tc: "text-amber-600" },
  { action: "Registered", item: "john@example.com", user: "System", time: "3d ago", bg: "bg-slate-100", tc: "text-slate-500" },
];

export default function DashboardPage() {
  const { loadStatus, widgets } = useAdminRuntime();
  const [draftTitle, setDraftTitle] = createSignal("");
  const [draftContent, setDraftContent] = createSignal("");

  const runtimeSummary = () => {
    const status = loadStatus();
    if (status.state === "loading" || status.state === "idle") {
      return "Loading plugin frontends…";
    }
    if (status.state === "error") {
      return status.message;
    }

    return `Loaded ${status.summary.loaded.length} of ${status.summary.discovered} discovered plugin frontend(s).`;
  };

  return (
    <div class="space-y-6">
      <Show when={loadStatus().state === "error"}>
        <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {runtimeSummary()}
        </div>
      </Show>

      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-500/15 animate-gradient">
        <div class="absolute -top-16 -right-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div class="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-white/[0.07] blur-3xl" />
        <div class="absolute right-32 top-4 h-24 w-24 rotate-12 rounded-2xl bg-white/[0.04]" />
        <div class="absolute bottom-2 right-12 h-16 w-16 -rotate-6 rounded-xl bg-white/[0.04]" />
        <div class="relative flex items-center justify-between gap-6">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">Welcome back, Admin</h2>
            <p class="mt-2 max-w-lg text-blue-100/80">
              Your site is performing great. 3 new posts this week with 128 total views.
            </p>
            <p class="mt-3 text-sm text-white/70">{runtimeSummary()}</p>
          </div>
          <A
            href="/posts/new"
            class="hidden cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/25 md:inline-flex"
          >
            <Icon name="plus" size={16} />
            New Post
          </A>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <For each={stats}>
          {(stat, index) => (
            <div
              class={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-lg ${stat.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div class="mb-4 flex items-center justify-between">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 shadow-inner shadow-white/10 backdrop-blur-sm">
                  <Icon name={stat.icon} size={22} class="text-white" />
                </div>
                <div class="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/70">
                  <Icon name={index() === 2 ? "check" : "trending-up"} size={11} />
                  {index() === 2 && loadStatus().state === "ready" ? `${runtimeState.plugins.length} runtime(s)` : stat.change}
                </div>
              </div>
              <div class="text-3xl font-extrabold tracking-tight">
                {index() === 2 && loadStatus().state === "ready" ? runtimeState.plugins.length : stat.value}
              </div>
              <div class="mt-1 text-sm font-medium text-white/70">{stat.label}</div>
            </div>
          )}
        </For>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50 lg:col-span-2">
          <div class="flex items-center justify-between border-b border-slate-100 p-5">
            <h3 class="flex items-center gap-2.5 font-semibold text-slate-800">
              <div class="h-5 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
              Recent Posts
            </h3>
            <A href="/posts" class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700">
              View all
            </A>
          </div>
          <div class="divide-y divide-slate-100/80">
            <For each={recentPosts}>
              {(post) => (
                <div class="group flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent">
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-slate-800 transition-colors group-hover:text-indigo-600">
                      {post.title}
                    </div>
                    <div class="mt-0.5 text-xs text-slate-400">
                      by {post.author} · {post.date}
                    </div>
                  </div>
                  <span
                    class={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                      post.status === "published"
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                        : "bg-amber-50 text-amber-600 ring-amber-500/20"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
          <div class="border-b border-slate-100 p-5">
            <h3 class="flex items-center gap-2.5 font-semibold text-slate-800">
              <div class="h-5 w-1.5 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
              Quick Draft
            </h3>
          </div>
          <div class="space-y-3 p-5">
            <input
              type="text"
              placeholder="Post title"
              value={draftTitle()}
              onInput={(event) => setDraftTitle(event.currentTarget.value)}
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <textarea
              placeholder="What's on your mind?"
              value={draftContent()}
              onInput={(event) => setDraftContent(event.currentTarget.value)}
              rows={4}
              class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <button class="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-[0.98]">
              Save Draft
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
          <div class="border-b border-slate-100 p-5">
            <h3 class="flex items-center gap-2.5 font-semibold text-slate-800">
              <div class="h-5 w-1.5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
              Recent Activity
            </h3>
          </div>
          <div class="divide-y divide-slate-100/80">
            <For each={activityLog}>
              {(item) => (
                <div class="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50/50">
                  <div class={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-black/[0.04] ${item.bg}`}>
                    <Icon name="clock" size={14} class={item.tc} />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm text-slate-600">
                      <span class="font-semibold text-slate-800">{item.user}</span> {item.action.toLowerCase()} <span class="font-medium text-slate-700">{item.item}</span>
                    </div>
                    <div class="mt-0.5 text-xs text-slate-400">{item.time}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
          <div class="border-b border-slate-100 p-5">
            <h3 class="flex items-center gap-2.5 font-semibold text-slate-800">
              <div class="h-5 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
              Site Health
            </h3>
          </div>
          <div class="p-5">
            <div class="mb-6 flex items-center gap-4">
              <div class="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                <svg class="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" stroke-width="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#healthGrad)" stroke-width="3" stroke-dasharray="85, 100" stroke-linecap="round" />
                  <defs>
                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#10b981" />
                      <stop offset="100%" stop-color="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span class="absolute text-sm font-bold text-emerald-600">85%</span>
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-800">Health Score</div>
                <div class="mt-0.5 text-xs text-slate-400">4 of 5 checks passed</div>
              </div>
            </div>
            <div class="space-y-3">
              <For each={[
                { ok: true, label: "Database connection healthy" },
                { ok: true, label: "All plugins loaded" },
                { ok: true, label: "File permissions correct" },
                { ok: false, label: "1 plugin update available" },
                { ok: true, label: "SSL certificate valid" },
              ]}>
                {(item) => (
                  <div class="flex items-center gap-3">
                    <div class={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ${item.ok ? "bg-emerald-50 ring-emerald-500/20" : "bg-amber-50 ring-amber-500/20"}`}>
                      <Icon name={item.ok ? "check" : "bolt"} size={10} class={item.ok ? "text-emerald-600" : "text-amber-600"} />
                    </div>
                    <span class="text-sm text-slate-600">{item.label}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
        <div class="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 class="flex items-center gap-2.5 font-semibold text-slate-800">
              <div class="h-5 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-blue-500" />
              Plugin Widgets
            </h3>
            <p class="mt-1 text-sm text-slate-500">Runtime-loaded extensions can attach dashboard widgets here.</p>
          </div>
          <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {widgets().length} widget{widgets().length === 1 ? "" : "s"}
          </span>
        </div>
        <Show
          when={widgets().length > 0}
          fallback={<div class="p-5 text-sm text-slate-500">Install a plugin frontend and call <code>registerPlugin()</code> to populate this area.</div>}
        >
          <div class="grid gap-4 p-5 lg:grid-cols-2">
            <For each={widgets()}>{(widget) => <RuntimeWidgetCard widget={widget} />}</For>
          </div>
        </Show>
      </section>
    </div>
  );
}
