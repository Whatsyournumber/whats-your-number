import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useT } from "@/hooks/use-language";
import { type PlanTier, planMeetsTier, useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlanGate({
  required,
  children,
  className,
  blur = true,
}: {
  required: PlanTier;
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
}) {
  const { tier, loading } = useSubscription();
  const t = useT();

  if (loading) return null;

  const hasAccess = planMeetsTier(required, tier);
  if (hasAccess) return <>{children}</>;

  const isPro = required === "pro";
  const title = isPro
    ? t("Desbloquea funciones Pro", "Unlock Pro features")
    : t("Desbloquea Patrimonio", "Unlock Patrimonio");
  const description = isPro
    ? t(
        "Esta función está incluida en Pro. Prueba 14 días gratis y cancela cuando quieras.",
        "This feature is included in Pro. Try 14 days free and cancel anytime.",
      )
    : t(
        "Esta función está incluida en Patrimonio. Para patrimonios complejos y familias.",
        "This feature is included in Patrimonio. For complex net worths and families.",
      );

  return (
    <div className={cn("relative", className)}>
      {blur && (
        <div className="pointer-events-none select-none opacity-30 blur-[1.5px] saturate-50">
          {children}
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background/95 p-6 text-center shadow-sm backdrop-blur-xl",
          !blur && "relative",
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="sm" className="rounded-full px-4">
          <Link to="/precios">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {t("Ver planes", "See plans")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
