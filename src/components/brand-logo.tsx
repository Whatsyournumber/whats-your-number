import { cn } from "@/lib/utils";
import brandLighthouse from "@/assets/brand-lighthouse-clean.png.asset.json";


export function BrandMark({
  className,
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <img
        src={brandLighthouse.url}
        alt="Logo de WhatsYournumber: faro verde que guía tus finanzas"
        className="relative h-full w-full object-contain"
        loading="lazy"
      />
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
  return <BrandMark className={className ?? ""} />;
}


export function KidsBrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-9 w-9" />
      <span className="font-display text-sm font-semibold leading-none tracking-tight">
        My First <span className="text-primary">Number</span>
      </span>
    </span>
  );
}

