import { A } from "@solidjs/router";

import Icon from "../icons/Icon";

export default function NotFoundPage() {
  return (
    <div class="flex h-96 flex-col items-center justify-center">
      <div class="mb-4 text-8xl font-black text-indigo-600">404</div>
      <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50">
        <Icon name="globe" size={32} class="text-indigo-400" />
      </div>
      <h2 class="mb-2 text-2xl font-bold text-slate-800">Page not found</h2>
      <p class="max-w-sm text-center text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
      <A
        href="/"
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
      >
        <Icon name="arrow-left" size={16} />
        Back to Dashboard
      </A>
    </div>
  );
}
