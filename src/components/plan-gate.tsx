import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useT } from "@/hooks/use-language";
import { type PlanTier, planMeetsTier, useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GATE_HEIGHT = "h-[calc(100vh-3.5rem)]";

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
    <div className={cn("relative overflow-hidden", GATE_HEIGHT, className)}>
      {blur && (
        <div className={cn("pointer-events-none select-none overflow-hidden opacity-[0.28] blur-[1px] saturate-50", GATE_HEIGHT)}>
          {children}
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/45 p-6 backdrop-blur-sm",
          !blur && "relative",
        )}
      >
        <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-background/98 p-10 text-center shadow-2xl backdrop-blur-3xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{title}</p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <Button asChild size="lg" className="h-14 rounded-full px-10 text-base">
            <Link to="/precios">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("Comienza ya", "Start now")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
