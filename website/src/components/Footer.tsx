import { A } from "@solidjs/router";
import { For } from "solid-js";
import { footerLinks } from "~/site-content";

export default function Footer() {
  return (
    <footer class="border-t border-white/5 bg-[var(--bg-primary)]">
      <div class="page-shell py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-primary)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
              Blitz<span class="text-[var(--accent-light)]">Press</span>
            </span>
          </div>
          <p class="text-white/50 text-sm max-w-sm leading-relaxed">
            A Go-powered CMS and plugin platform with typed contracts, runtime-loaded extensions, and a modern SolidJS admin experience.
          </p>
        </div>

        <nav aria-label="Footer" class="md:justify-self-end">
          <ul class="m-0 p-0 list-none space-y-4">
            <For each={footerLinks}>
              {link => (
                <li>
                  <A class="text-white/50 hover:text-white transition-colors text-sm" href={link.href}>
                    {link.label}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
