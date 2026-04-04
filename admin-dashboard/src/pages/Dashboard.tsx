import { Component, For } from "solid-js";
import { dashboardStats, topStories, activityFeed } from "../data";
import { TrendingUp, TrendingDown } from "lucide-solid";

export const Dashboard: Component = () => {
  return (
    <>
      <div class="page-header">
        <div>
          <h1 class="page-title">At a Glance</h1>
          <p class="page-desc">Overview of your site's performance and recent activity.</p>
        </div>
      </div>
      <div class="dashboard-grid">
        <For each={dashboardStats}>
          {(stat) => (
            <div class="stat-card">
              <div class="stat-label">{stat.label}</div>
              <div class="stat-value">{stat.value}</div>
              <div class={`stat-change ${stat.positive ? "text-success" : "text-danger"}`}>
                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change}
              </div>
            </div>
          )}
        </For>

        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">Top Stories</h3>
            <p class="card-desc">Most viewed pages today</p>
          </div>
          <div class="card-content">
            <For each={topStories}>
              {(story) => (
                <div class="table-row">
                  <span class="text-strong">{story.title}</span>
                  <span class="text-muted">{story.views} views &bull; {story.date}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Activity</h3>
            <p class="card-desc">What's happening right now</p>
          </div>
          <div class="card-content">
            <For each={activityFeed}>
              {(feed) => (
                <div class="feed-item">
                  <div>
                    <span class="text-strong">{feed.user}</span>{" "}
                    <span class="text-muted">{feed.action}</span>
                  </div>
                  <span class="text-muted">{feed.time}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </>
  );
};
