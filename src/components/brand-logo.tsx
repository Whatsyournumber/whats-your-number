import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-elevated ring-1 ring-border",
        className,
      )}
    >
      <span className="wealth-gradient absolute inset-0 opacity-25" />
      <svg viewBox="0 0 32 32" fill="none" className="relative h-[70%] w-[70%]" aria-hidden="true">
        <circle cx="16" cy="16" r="13" className="stroke-primary" strokeWidth="1.4" opacity="0.35" />
        <path
          d="M11.8 12.2c0-2.4 1.9-4.1 4.4-4.1 2.5 0 4.3 1.5 4.3 3.7 0 1.9-1 2.9-2.7 3.9-1.4.8-2 1.6-2 3v.6"
          className="stroke-primary"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="15.8" cy="23.4" r="1.7" className="fill-primary" />
      </svg>
    </span>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-9 w-9" />
      <span className="font-display text-sm font-semibold leading-none tracking-tight">
        Whats<span className="text-primary">Yournumber</span>
      </span>
    </span>
  );
}
