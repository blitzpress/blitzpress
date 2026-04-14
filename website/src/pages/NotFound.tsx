import { A } from "@solidjs/router";
import AnimateOnView from "~/components/AnimateOnView";

export default function NotFound() {
  return (
    <main class="page-shell" id="main-content">
      <section class="section-padding flex items-center justify-center min-h-[70vh]">
        <div class="max-w-2xl text-center space-y-8">
          <AnimateOnView animation="scale">
            <div class="text-[#fff] font-mono text-sm tracking-widest uppercase">404</div>
          </AnimateOnView>
          <AnimateOnView animation="fade-up" delay={100}>
            <h1 class="text-hero">Page not found</h1>
          </AnimateOnView>
          <AnimateOnView animation="fade-up" delay={200}>
            <p class="text-subhead max-w-xl mx-auto">
              The page you requested is not part of the BlitzPress presentation site. Return to the
              main narrative and continue from the core platform pages.
            </p>
          </AnimateOnView>
          <AnimateOnView animation="fade-up" delay={300}>
            <div class="flex flex-wrap gap-4 justify-center pt-8">
              <A href="/" class="btn-primary">
                Back to Home
              </A>
              <A href="/features" class="btn-secondary">
                View Features
              </A>
            </div>
          </AnimateOnView>
        </div>
      </section>
    </main>
  );
}