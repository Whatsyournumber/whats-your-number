import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl bg-elevated ring-1 ring-border",
        className,
      )}
    >
      <span className="wealth-gradient absolute inset-0 rounded-xl opacity-20" />
      <svg viewBox="0 0 32 32" fill="none" className="relative h-[62%] w-[62%]" aria-hidden="true">
        <path d="M16 1.5 20.2 11.8 30.5 16 20.2 20.2 16 30.5 11.8 20.2 1.5 16 11.8 11.8Z" className="fill-primary" />
        <path d="M16 6.5 18.3 13.7 25.5 16 18.3 18.3 16 25.5 13.7 18.3 6.5 16 13.7 13.7Z" className="fill-background/70" />
        <circle cx="16" cy="16" r="2" className="fill-primary" />
      </svg>
    </span>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-9 w-9" />
      <span className="font-display text-sm font-semibold leading-none tracking-tight">
        Your <span className="text-primary">north</span>
      </span>
    </span>
  );
}
