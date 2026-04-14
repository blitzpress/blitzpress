import { A, useLocation } from "@solidjs/router";
import { For } from "solid-js";
import { navLinks } from "~/site-content";

export default function Nav() {
  const location = useLocation();

  const active = (path: string) => (path === location.pathname ? "nav-link is-active" : "nav-link");

  return (
    <header class="site-header">
      <div class="page-shell header-row">
        <A href="/" class="flex items-center gap-3">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#4f46e5]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-white"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span class="text-lg font-bold tracking-tight text-white">
            Blitz<span class="text-[#818cf8]">Press</span>
          </span>
        </A>

        <nav aria-label="Primary" class="overflow-x-auto" style="scrollbar-width: none;">
          <ul class="flex items-center gap-2 m-0 p-0 list-none whitespace-nowrap">
            <For each={navLinks}>
              {link => (
                <li>
                  <A class={active(link.href)} href={link.href}>
                    {link.label}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </nav>
      </div>
    </header>
  );
}
