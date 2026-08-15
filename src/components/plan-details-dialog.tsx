import { Check, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/hooks/use-language";
import type { PlanTier } from "@/hooks/use-subscription";

/** Detalle de cada plan para explicar al usuario qué incluye lo que compró. */
function usePlanCopy() {
  const t = useT();

  const copy: Record<PlanTier, { name: string; price: string; desc: string; features: string[] }> = {
    free: {
      name: "Free",
      price: t("Gratis", "Free"),
      desc: t(
        "Descubre tu número y ordena tus finanzas básicas.",
        "Discover your number and organize your basic finances.",
      ),
      features: [
        t("Tu número en 3 preguntas", "Your number in 3 questions"),
        t("1 cuenta conectada o manual", "1 connected or manual account"),
        t("5 importaciones de EEFF al mes", "5 statement imports per month"),
        t("Dashboard con tu número y cash flow", "Dashboard with your number and cash flow"),
        t("Análisis de gastos del mes", "Monthly expense analysis"),
        t("Presupuesto 40/40/20", "40/40/20 budget"),
        t("Life Planner", "Life Planner"),
        t("Your next city", "Your next city"),
      ],
    },
    pro: {
      name: "Pro",
      price: t("7 $/mes · 60 $/año", "$7/mo · $60/yr"),
      desc: t(
        "Todo el sistema financiero con IA ilimitada.",
        "The full financial OS with unlimited AI.",
      ),
      features: [
        t("Todo lo de Free", "Everything in Free"),
        t("Cuentas y bancos ilimitados", "Unlimited accounts and banks"),
        t("Importación PDF y CSV ilimitada", "Unlimited PDF and CSV imports"),
        t("AI Advisor: pregúntale lo que sea", "AI Advisor: ask anything"),
        t("Recomendaciones de ahorro inteligentes", "Smart savings recommendations"),
        t("Multi-moneda avanzada EUR/USD/GBP", "Advanced multi-currency EUR/USD/GBP"),
        t("Análisis de hipoteca y estrategias", "Mortgage analysis and strategies"),
        t("Portafolio y benchmark de mercado", "Portfolio and market benchmark"),
        t("WhatsYournumber y simulador de retiro", "WhatsYournumber and retirement simulator"),
        t("Reportes mensuales automáticos", "Automatic monthly reports"),
      ],
    },
    patrimonio: {
      name: "Familiar",
      price: t("19 $/mes", "$19/mo"),
      desc: t(
        "Para familias: tu patrimonio y el futuro financiero de tus hijos.",
        "For families: your wealth and your children's financial future.",
      ),
      features: [
        t("Todo lo de Pro", "Everything in Pro"),
        t("Perfiles familiares compartidos", "Shared family profiles"),
        t("Plan de ahorro e inversión para cada hijo", "Savings and investment plan for each child"),
        t("Simulador de universidad y educación", "College and education simulator"),
        t("Meta de patrimonio a los 18 años de tu hijo", "Net worth goal by your child's 18th birthday"),
        t("Activos alternativos: cripto, real estate, etc.", "Alternative assets: crypto, real estate, etc."),
        t("Controles de acceso para tus hijos", "Access controls for your children"),
        t("My First Number: aprenden jugando", "My First Number: they learn by playing"),
        t("Soporte prioritario en 24h", "Priority support within 24h"),
      ],
    },
  };

  return copy;
}

export function PlanDetailsDialog({
  tier,
  isTrial,
  renewsOn,
}: {
  tier: PlanTier;
  isTrial?: boolean;
  renewsOn?: string | null;
}) {
  const t = useT();
  const plan = usePlanCopy()[tier];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {t("Qué incluye", "What's included")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("Plan", "Plan")} {plan.name}
            {isTrial && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {t("prueba", "trial")}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>{plan.desc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2.5 py-1 font-medium text-foreground">
            {plan.price}
          </span>
          {renewsOn && <span>{t("Renueva el", "Renews on")} {renewsOn}</span>}
        </div>

        <ul className="mt-1 space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          {t(
            "Esto es exactamente lo que incluye el plan que tienes activo hoy.",
            "This is exactly what your currently active plan includes.",
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
