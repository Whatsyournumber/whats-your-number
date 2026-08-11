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
        <div className="pointer-events-none select-none opacity-[0.18] blur-[2px] saturate-50">
          {children}
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-background/97 p-8 text-center shadow-2xl backdrop-blur-2xl",
          !blur && "relative",
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <div className="max-w-sm">
          <p className="text-lg font-semibold tracking-tight">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/precios">
            <Sparkles className="mr-2 h-4 w-4" />
            {t("Comienza ya", "Start now")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

