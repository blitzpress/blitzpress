import { A, useLocation } from "@solidjs/router";
import { For, Show } from "solid-js";
import { pageMap } from "~/site-content";
import AnimateOnView from "~/components/AnimateOnView";

export default function ContentPage() {
  const location = useLocation();
  const page = () => pageMap.get(location.pathname);

  return (
    <Show when={page()}>
      {current => (
        <main class="w-full" id="main-content">
          {/* Hero Section */}
          <section class="py-28 md:py-40 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center page-shell">
            <div class="space-y-8">
              <AnimateOnView animation="fade-up">
                <span class="text-white/50 tracking-widest uppercase text-sm font-mono block">
                  {current().intro}
                </span>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={100}>
                <h1 class="text-hero text-white">
                  {current().title}
                </h1>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={200}>
                <p class="text-subhead max-w-xl text-white/80">
                  {current().lead}
                </p>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={300}>
                <p class="text-white/50 leading-relaxed max-w-xl">
                  {current().supporting}
                </p>
              </AnimateOnView>
            </div>
            
            <AnimateOnView animation="slide-left" delay={200}>
              <div class="bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] p-10 md:p-16 flex flex-col justify-center border border-[var(--border-subtle)] aspect-square lg:aspect-auto h-full">
                <span class="text-white/40 font-mono text-xs uppercase tracking-widest mb-4">
                  {current().heroLabel}
                </span>
                <div class="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                  {current().heroStat}
                </div>
                <p class="text-white/50">
                  {current().heroStatLabel}
                </p>
              </div>
            </AnimateOnView>
          </section>

          {/* Sections */}
          <For each={current().sections}>
            {(section, sectionIndex) => (
              <section class="py-28 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]" id={section.id}>
                <div class="page-shell">
                  <div class="max-w-3xl mb-20">
                    <AnimateOnView animation="fade-up">
                      <div class="text-white/50 font-mono text-xs tracking-widest uppercase mb-6">
                        {section.eyebrow}
                      </div>
                    </AnimateOnView>
                    <AnimateOnView animation="fade-up" delay={100}>
                      <h2 class="text-section text-white mb-6">
                        {section.title}
                      </h2>
                    </AnimateOnView>
                    <AnimateOnView animation="fade-up" delay={200}>
                      <p class="text-subhead text-white/60">
                        {section.description}
                      </p>
                    </AnimateOnView>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <For each={section.items}>
                      {(item, itemIndex) => (
                        <AnimateOnView animation="fade-up" delay={(itemIndex() * 100) as 0 | 100 | 200 | 300 | 400 | 500 | 600}>
                          <article class="bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] overflow-hidden group border border-[var(--border-subtle)]">
                            <div class="aspect-video w-full overflow-hidden bg-[var(--bg-primary)]">
                              <img 
                                src={`https://images.unsplash.com/photo-${['1550751827-4bd374c3f58b', '1634152962476-4b8a00e1915c', '1550745165-9bc0b252726f', '1614729939124-032f0b56c9ce', '1518770660439-4636190af475', '1451187580459-43490279c0fa'][(sectionIndex() * 3 + itemIndex()) % 6]}?auto=format&fit=crop&w=800&q=80`}
                                alt={item.title}
                                class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                              />
                            </div>
                            <div class="p-8 space-y-4">
                              <Show when={item.eyebrow}>
                                <div class="text-white/40 font-mono text-xs uppercase tracking-widest">
                                  {item.eyebrow}
                                </div>
                              </Show>
                              <h3 class="text-headline text-white">{item.title}</h3>
                              <p class="text-white/50 leading-relaxed text-sm">{item.description}</p>
                            </div>
                          </article>
                        </AnimateOnView>
                      )}
                    </For>
                  </div>
                </div>
              </section>
            )}
          </For>

          {/* CTA Section */}
          <section class="py-28 md:py-40 bg-[var(--bg-primary)] text-center border-t border-[var(--border-subtle)]">
            <div class="page-shell max-w-4xl mx-auto space-y-10">
              <AnimateOnView animation="fade-up">
                <div class="text-white/50 font-mono text-sm tracking-widest uppercase">
                  Next Step
                </div>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={100}>
                <h2 class="text-section text-white">
                  {current().ctaTitle}
                </h2>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={200}>
                <p class="text-subhead text-white/60 mx-auto max-w-2xl">
                  {current().ctaDescription}
                </p>
              </AnimateOnView>
              <AnimateOnView animation="fade-up" delay={300}>
                <div class="pt-8">
                  <A class="btn-primary" href={current().ctaHref}>
                    {current().ctaLabel}
                  </A>
                </div>
              </AnimateOnView>
            </div>
          </section>
        </main>
      )}
    </Show>
  );
}