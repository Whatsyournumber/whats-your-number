import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl",
        variant === "light"
          ? "bg-white/70 ring-1 ring-slate-200/70 shadow-sm"
          : "bg-elevated ring-1 ring-border",
        className,
      )}
    >
      <span className="absolute inset-0 bg-primary/5" />
      <span className="absolute inset-0 wealth-gradient opacity-20" />
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="relative h-[72%] w-[72%]"
        aria-hidden="true"
      >
        {/* Target ring — precision / "your number" */}
        <circle
          cx="16"
          cy="16"
          r="11.5"
          className="stroke-primary/20"
          strokeWidth="1"
        />
        <circle
          cx="16"
          cy="16"
          r="8.5"
          className="stroke-primary/10"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {/* Crosshair ticks */}
        <path
          d="M16 4.5V7.5M16 24.5V27.5M4.5 16H7.5M24.5 16H27.5"
          className="stroke-primary/15"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Stylized question mark / growth curve */}
        <path
          d="M11.8 12.2c0-2.6 2.1-4.3 4.7-4.3s4.5 1.5 4.5 3.9c0 2.1-1.1 3.1-2.9 4.1-1.5.8-2.2 1.7-2.2 3.1v.7"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* The answer dot — the "number" */}
        <circle cx="15.9" cy="23.3" r="2.2" className="fill-primary" />
      </svg>
    </span>
  );
}

export function BrandLogo({
  className,
  vertical,
  variant = "dark",
}: {
  className?: string;
  vertical?: boolean;
  variant?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        vertical ? "flex flex-col items-center gap-2" : "flex items-center gap-2.5",
        className,
      )}
    >
      <BrandMark className={vertical ? "h-12 w-12" : "h-9 w-9"} variant={variant} />
      <span
        className={cn(
          "font-display text-sm font-semibold leading-none tracking-tight",
          variant === "light" && "text-slate-900",
        )}
      >
        Whats<span className="text-primary">Yournumber</span>
      </span>
    </span>
  );
}



export function KidsBrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-kid-sky/15 ring-1 ring-kid-sky/30",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" fill="none" className="relative h-[74%] w-[74%]" aria-hidden="true">
        <circle cx="16" cy="16" r="12" className="stroke-kid-sky/30" strokeWidth="1.2" />
        <path
          d="M9 20.5c0-4.4 3.1-7.6 7-7.6s7 2.6 7 6.2"
          className="stroke-kid-grape"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16 6.2l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5L16 6.2z"
          className="fill-kid-mint"
        />
        <circle cx="16" cy="24.5" r="2.1" className="fill-kid-sky" />
      </svg>
    </span>
  );
}

export function KidsBrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <KidsBrandMark className="h-9 w-9" />
      <span className="font-display text-sm font-semibold leading-none tracking-tight">
        My First <span className="text-kid-mint">Number</span>
      </span>
    </span>
  );
}
