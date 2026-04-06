import { For, createSignal } from "solid-js";

import Icon from "../base/icons/Icon";

const mediaItems = [
  { id: "1", name: "hero-banner.jpg", type: "image", size: "2.4 MB", date: "Apr 5, 2026" },
  { id: "2", name: "logo-dark.png", type: "image", size: "45 KB", date: "Apr 4, 2026" },
  { id: "3", name: "team-photo.jpg", type: "image", size: "1.8 MB", date: "Apr 3, 2026" },
  { id: "4", name: "documentation.pdf", type: "document", size: "3.2 MB", date: "Apr 2, 2026" },
  { id: "5", name: "product-screenshot.png", type: "image", size: "890 KB", date: "Apr 1, 2026" },
  { id: "6", name: "intro-video.mp4", type: "video", size: "15.4 MB", date: "Mar 30, 2026" },
  { id: "7", name: "background-pattern.svg", type: "image", size: "12 KB", date: "Mar 28, 2026" },
  { id: "8", name: "feature-comparison.png", type: "image", size: "450 KB", date: "Mar 25, 2026" },
  { id: "9", name: "podcast-episode.mp3", type: "audio", size: "8.7 MB", date: "Mar 22, 2026" },
  { id: "10", name: "infographic.png", type: "image", size: "1.1 MB", date: "Mar 20, 2026" },
  { id: "11", name: "thumbnail-post.jpg", type: "image", size: "120 KB", date: "Mar 18, 2026" },
  { id: "12", name: "plugin-demo.gif", type: "image", size: "3.5 MB", date: "Mar 15, 2026" },
];

type MediaFilter = "all" | "image" | "document" | "video" | "audio";

const typeIcons: Record<string, string> = {
  image: "image",
  document: "file-text",
  video: "eye",
  audio: "bell",
};

const typeColors: Record<string, string> = {
  image: "bg-blue-100 text-blue-600",
  document: "bg-amber-100 text-amber-600",
  video: "bg-violet-100 text-violet-600",
  audio: "bg-emerald-100 text-emerald-600",
};

export default function MediaLibraryPage() {
  const [activeFilter, setActiveFilter] = createSignal<MediaFilter>("all");

  const filteredMedia = () => activeFilter() === "all" ? mediaItems : mediaItems.filter((item) => item.type === activeFilter());

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div />
        <button class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]">
          <Icon name="upload" size={16} />
          Upload Files
        </button>
      </div>

      <div class="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/30">
        <Icon name="upload" size={36} class="mx-auto mb-3 text-slate-300" />
        <p class="text-sm font-medium text-slate-600">Drop files here to upload</p>
        <p class="mt-1 text-xs text-slate-400">or click to browse — PNG, JPG, PDF, MP4 up to 50MB</p>
      </div>

      <div class="flex items-center gap-2">
        <For each={[
          { label: "All", value: "all" as MediaFilter },
          { label: "Images", value: "image" as MediaFilter },
          { label: "Documents", value: "document" as MediaFilter },
          { label: "Video", value: "video" as MediaFilter },
          { label: "Audio", value: "audio" as MediaFilter },
        ]}>
          {(filter) => (
            <button
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              class={`cursor-pointer rounded-xl px-3.5 py-1.5 text-sm transition-colors ${
                activeFilter() === filter.value
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <For each={filteredMedia()}>
          {(item) => (
            <div class="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div class={`aspect-square flex items-center justify-center ${typeColors[item.type] ?? "bg-slate-50 text-slate-400"}`}>
                <Icon name={typeIcons[item.type] ?? "file"} size={32} class="opacity-40 transition-opacity group-hover:opacity-60" />
              </div>
              <div class="p-3">
                <div class="truncate text-xs font-medium text-slate-800">{item.name}</div>
                <div class="mt-0.5 text-[11px] text-slate-400">{item.size}</div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
