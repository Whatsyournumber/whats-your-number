import { cn } from "@/lib/utils";
import brandLighthouse from "@/assets/brand-lighthouse-clean.png.asset.json";

type BrandVariant = "dark" | "light" | "auto";

/**
 * Tratamiento visual del faro por tema:
 * - dark: halo verde suave para que brille sobre fondos oscuros.
 * - light: sombra sutil y algo más de contraste para que no se pierda sobre fondos claros.
 * - auto: sigue la clase `dark` del documento.
 */
const MARK_VARIANT: Record<"dark" | "light", string> = {
  dark: "[filter:drop-shadow(0_0_6px_hsl(var(--primary)/0.45))_saturate(1.05)]",
  light:
    "[filter:drop-shadow(0_1px_2px_hsl(220_40%_12%/0.35))_contrast(1.08)_saturate(1.1)_brightness(0.94)]",
};

export function BrandMark({
  className,
  variant = "auto",
}: {
  className?: string;
  variant?: BrandVariant;
}) {
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <img
        src={brandLighthouse.url}
        alt="Logo de WhatsYournumber: faro verde que guía tus finanzas"
        className={cn(
          "relative h-full w-full object-contain transition-[filter] duration-300",
          variant === "dark" && MARK_VARIANT.dark,
          variant === "light" && MARK_VARIANT.light,
          variant === "auto" && cn(MARK_VARIANT.light, "dark:[filter:drop-shadow(0_0_6px_hsl(var(--primary)/0.45))_saturate(1.05)]"),
        )}
      />
    </span>
  );
}



export function BrandLogo({
  className,
  vertical,
  variant = "auto",
}: {
  className?: string;
  vertical?: boolean;
  variant?: BrandVariant;
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

