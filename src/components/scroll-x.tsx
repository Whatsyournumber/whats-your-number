import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ScrollXState = { left: boolean; right: boolean };

/** Hook con estado y control de un contenedor con scroll horizontal. */
export function useScrollX() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollXState>({ left: false, right: false });

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

  const nudge = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: "smooth" });
  }, []);

  return { ref, state, update, nudge };
}

/** Par de flechas para cabeceras de sección; se deshabilitan en los extremos. */
export function ScrollXButtons({
  state,
  nudge,
  className,
}: {
  state: ScrollXState;
  nudge: (dir: 1 | -1) => void;
  className?: string;
}) {
  const base =
    "grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-elevated/60 text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <button type="button" aria-label="Scroll left" onClick={() => nudge(-1)} disabled={!state.left} className={base}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Scroll right" onClick={() => nudge(1)} disabled={!state.right} className={base}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Contenedor con scroll horizontal, degradados sutiles y botones de desplazamiento flotantes. */
export function ScrollX({
  children,
  className,
  controlsPosition = "center",
}: {
  children: React.ReactNode;
  className?: string;
  controlsPosition?: "center" | "top";
}) {
  const { ref, state, update, nudge } = useScrollX();
  const isTop = controlsPosition === "top";

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} onScroll={update} className="overflow-x-auto scroll-smooth">
        {children}
      </div>

      {state.left && (
        <>
          {!isTop && <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />}
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => nudge(-1)}
            className={cn(
              "absolute left-1 z-10 rounded-full border border-border/70 bg-card/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground",
              isTop ? "top-3" : "top-1/2 -translate-y-1/2",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      {state.right && (
        <>
          {!isTop && <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />}
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => nudge(1)}
            className={cn(
              "absolute right-1 z-10 rounded-full border border-border/70 bg-card/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground",
              isTop ? "top-3" : "top-1/2 -translate-y-1/2",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
