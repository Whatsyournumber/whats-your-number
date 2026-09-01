import { ArrowRight, Check, Info, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/hooks/use-language";
import { useRegionalPricing } from "@/hooks/use-regional-pricing";
import { formatMoney } from "@/lib/pricing-tiers";
import type { PlanTier } from "@/hooks/use-subscription";

/** Detalle de cada plan para explicar al usuario qué incluye lo que compró. */
function usePlanCopy() {
  const t = useT();
  const { prices, currency } = useRegionalPricing();

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
      price: t(
        `${formatMoney(prices.pro.monthly, currency)}/mes · ${formatMoney(prices.pro.yearly, currency)}/año`,
        `${formatMoney(prices.pro.monthly, currency)}/mo · ${formatMoney(prices.pro.yearly, currency)}/yr`,
      ),
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
        t("Activos alternativos: cripto, real estate, etc.", "Alternative assets: crypto, real estate, etc."),
        t("Trackea todo tu portfolio en tiempo real", "Track your whole portfolio in real time"),
        t("Análisis de hipoteca: paga y gasta menos", "Mortgage analysis: pay and spend less"),
        t("WhatsYournumber acorde con tu objetivo", "WhatsYournumber tailored to your goal"),
        t("Simulador de retiro temprano", "Early retirement simulator"),
        t("Portafolio y benchmark de mercado", "Portfolio and market benchmark"),
        t("Reportes mensuales automáticos", "Automatic monthly reports"),
      ],
    },
    patrimonio: {
      name: "Familiar",
      price: t(
        `${formatMoney(prices.family.monthly, currency)}/mes · ${formatMoney(prices.family.yearly, currency)}/año`,
        `${formatMoney(prices.family.monthly, currency)}/mo · ${formatMoney(prices.family.yearly, currency)}/yr`,
      ),
      desc: t(
        "Para familias: tu patrimonio y el futuro financiero de tus hijos.",
        "For families: your wealth and your children's financial future.",
      ),
      features: [
        t("Todo lo de Pro", "Everything in Pro"),
        t("3 perfiles: p. ej. 2 adultos + 1 hijo o 1 adulto + 2 hijos", "3 profiles: e.g. 2 adults + 1 kid or 1 adult + 2 kids"),
        t("Plan de ahorro e inversión para cada hijo", "Savings and investment plan for each child"),
        t("Simulador de universidad y educación", "College and education simulator"),
        t("Meta de patrimonio a los 18 años de tu hijo", "Net worth goal by your child's 18th birthday"),
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

/** Confirmación de cambio de plan: explica qué ganas o qué pierdes antes de confirmar. */
export function PlanChangeDialog({
  from,
  to,
  loading,
  disabled,
  onConfirm,
}: {
  from: PlanTier;
  to: PlanTier;
  loading: boolean;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  const copy = usePlanCopy();
  const target = copy[to];
  const current = copy[from];
  const isUpgrade = to === "patrimonio";

  const gains = [
    t("3 perfiles: p. ej. 2 adultos + 1 hijo o 1 adulto + 2 hijos", "3 profiles: e.g. 2 adults + 1 kid or 1 adult + 2 kids"),
    t("Plan de ahorro e inversión para cada hijo", "Savings and investment plan for each child"),
    t("Simulador de universidad y educación", "College and education simulator"),
    t("Meta de patrimonio a los 18 años de tu hijo", "Net worth goal by your child's 18th birthday"),
    t("My First Number: aprenden jugando", "My First Number: they learn by playing"),
    t("Soporte prioritario en 24h", "Priority support within 24h"),
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant={isUpgrade ? "default" : "outline"} disabled={disabled}>
          {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          {isUpgrade ? t("Mejorar a Familiar", "Upgrade to Familiar") : t("Bajar a Pro", "Downgrade to Pro")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpgrade
              ? t("Mejorar a Familiar", "Upgrade to Familiar")
              : t("Bajar a Pro", "Downgrade to Pro")}
          </DialogTitle>
          <DialogDescription>
            {isUpgrade
              ? t(
                  "Pasas de Pro a Familiar. El cambio es inmediato y se prorratea lo que ya pagaste.",
                  "You move from Pro to Familiar. The change is immediate and what you already paid is pro-rated.",
                )
              : t(
                  "Pasas de Familiar a Pro. Mantienes Familiar hasta el final del periodo que ya pagaste.",
                  "You move from Familiar to Pro. You keep Familiar until the end of the period you already paid.",
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
            {current.name} · {current.price}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary">
            {target.name} · {target.price}
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isUpgrade ? t("Lo que ganas", "What you gain") : t("Lo que dejas de tener", "What you lose")}
          </p>
          <ul className="mt-2 space-y-2">
            {gains.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                {isUpgrade ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {!isUpgrade && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(
                "Sigues con todo lo de Pro: IA ilimitada, hipoteca, portafolio y multi-moneda.",
                "You keep everything in Pro: unlimited AI, mortgage, portfolio and multi-currency.",
              )}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button size="sm" disabled={disabled} onClick={onConfirm}>
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {t("Confirmar cambio", "Confirm change")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
