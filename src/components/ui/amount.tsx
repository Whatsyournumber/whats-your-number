import { cn } from "@/lib/utils";

type Breakpoint = "sm" | "md" | "lg" | "xl";

/** Clases estáticas para que Tailwind las detecte. */
const FULL: Record<Breakpoint, string> = {
  sm: "hidden sm:inline",
  md: "hidden md:inline",
  lg: "hidden lg:inline",
  xl: "hidden xl:inline",
};
const SHORT: Record<Breakpoint, string> = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
};

/**
 * Muestra la cifra completa cuando hay espacio y la versión abreviada (K/M)
 * solo en anchos donde se solaparía o desbordaría.
 *
 * `from` = breakpoint a partir del cual se muestra la cifra completa.
 */
export function Amount({
  full,
  short,
  from = "xl",
  className,
}: {
  full: string;
  short: string;
  from?: Breakpoint;
  className?: string;
}) {
  if (short === full) return <span className={cn("numeric", className)}>{full}</span>;
  return (
    <span className={cn("numeric", className)} title={full}>
      <span className={FULL[from]}>{full}</span>
      <span className={SHORT[from]}>{short}</span>
    </span>
  );
}
