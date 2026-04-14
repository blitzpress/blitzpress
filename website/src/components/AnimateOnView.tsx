import { onMount, onCleanup, JSX, splitProps } from "solid-js";

interface AnimateOnViewProps extends JSX.HTMLAttributes<HTMLDivElement> {
  animation?: "fade-up" | "slide-left" | "slide-right" | "scale";
  delay?: 0 | 100 | 200 | 300 | 400 | 500 | 600;
  threshold?: number;
  once?: boolean;
}

export default function AnimateOnView(props: AnimateOnViewProps) {
  const [local, rest] = splitProps(props, ["animation", "delay", "threshold", "once", "class", "children"]);
  
  let ref: HTMLDivElement | undefined;
  let observer: IntersectionObserver | undefined;
  
  const animationClass = () => {
    switch (local.animation) {
      case "slide-left": return "view-animate-slide-left";
      case "slide-right": return "view-animate-slide-right";
      case "scale": return "view-animate-scale";
      default: return "view-animate";
    }
  };
  
  const delayClass = () => {
    if (local.delay === undefined || local.delay === 0) return "";
    return `delay-${local.delay}`;
  };

  onMount(() => {
    if (!ref) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            if (local.once !== false) {
              observer?.unobserve(entry.target);
            }
          } else if (local.once === false) {
            entry.target.classList.remove("in-view");
          }
        });
      },
      {
        threshold: local.threshold ?? 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );
    
    observer.observe(ref);
  });

  onCleanup(() => {
    observer?.disconnect();
  });

  return (
    <div
      ref={ref}
      class={`${animationClass()} ${delayClass()} ${local.class ?? ""}`.trim()}
      {...rest}
    >
      {local.children}
    </div>
  );
}