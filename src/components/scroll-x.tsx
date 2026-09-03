import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Contenedor con scroll horizontal, degradados sutiles y botones de desplazamiento. */
export function ScrollX({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setState({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} onScroll={update} className="overflow-x-auto scroll-smooth">
        {children}
      </div>

      {state.left && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => nudge(-1)}
            className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/70 bg-card/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      {state.right && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => nudge(1)}
            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/70 bg-card/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
