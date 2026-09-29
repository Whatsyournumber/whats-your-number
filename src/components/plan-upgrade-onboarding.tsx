import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Landmark, LineChart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetDialog } from "@/components/asset-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useHoldings, type Holding } from "@/hooks/use-holdings";
import { useProfile, type Profile } from "@/hooks/use-profile";
import { useSubscription, type PlanTier } from "@/hooks/use-subscription";
import { useT } from "@/hooks/use-language";
import { currencySymbol } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

const RANK: Record<PlanTier, number> = { free: 0, pro: 1, investor: 2, patrimonio: 3 };
const key = (uid: string) => `yn.plan-onboarding.${uid}`;

type Field = keyof Profile;
type Unit = "money" | "pct" | "years";
type F = { k: Field; es: string; en: string; unit?: Unit; half?: boolean; hintEs?: string; hintEn?: string };

const ASSETS: F[] = [
  { k: "assets_bank", es: "Dinero en el banco", en: "Money in the bank", half: true },
  { k: "assets_cash", es: "Efectivo", en: "Cash", half: true },
  { k: "assets_property", es: "Valor de tu vivienda / propiedades", en: "Home / property value" },
];
const DEBTS: F[] = [
  { k: "mortgage_balance", es: "Hipoteca pendiente", en: "Mortgage balance" },
  { k: "mortgage_rate", es: "Interés hipoteca", en: "Mortgage rate", unit: "pct", half: true },
  { k: "mortgage_term", es: "Años restantes", en: "Years left", unit: "years", half: true },
  { k: "liabilities", es: "Otras deudas (tarjetas, préstamos)", en: "Other debts (cards, loans)" },
];
const PLAN: F[] = [
  { k: "retirement_monthly_contribution", es: "Aporte mensual a inversiones", en: "Monthly investing", half: true },
  { k: "expected_return", es: "Rentabilidad esperada", en: "Expected return", unit: "pct", half: true },
];
const ALL = [...ASSETS, ...DEBTS, ...PLAN];
const RISKS = [
  { v: "conservador", es: "Conservador", en: "Conservative", ret: 5 },
  { v: "moderado", es: "Moderado", en: "Moderate", ret: 7 },
  { v: "agresivo", es: "Agresivo", en: "Aggressive", ret: 9 },
];

const num = (s: string | undefined, unit?: Unit) => {
  const clean = unit === "money" || !unit ? (s ?? "").replace(/[.\s]/g, "").replace(",", ".") : (s ?? "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number, sym: string) => {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K` : `${Math.round(a)}`;
  return `${n < 0 ? "-" : ""}${sym}${s}`;
};

/** Al subir a Inversor o Familiar, pide los datos de patrimonio y portfolio. */
export function PlanUpgradeOnboarding() {
  const { user } = useAuth();
  const { tier, loading } = useSubscription();
  const { profile, isLoading, save, saving } = useProfile();
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [risk, setRisk] = useState("");

  useEffect(() => {
    if (!user || loading || isLoading) return;
    const stored = localStorage.getItem(key(user.id)) as PlanTier | null;
    if (RANK[tier] < RANK.investor) {
      localStorage.setItem(key(user.id), tier);
      return;
    }
    const hasData = [...ASSETS, ...DEBTS, ...PORTFOLIO].some((f) => f.k !== "assets_bank" && Number(profile[f.k]) > 0);
    const upgraded = stored ? RANK[stored] < RANK.investor : !hasData;
    if (upgraded) {
      const init: Record<string, string> = {};
      ALL.forEach((f) => {
        const n = Number(profile[f.k]);
        init[f.k] = n > 0 ? String(n) : "";
      });
      setVals(init);
      setRisk(profile.risk_profile || "");
      setStep(0);
      setOpen(true);
    } else if (stored !== tier) {
      localStorage.setItem(key(user.id), tier);
    }
  }, [user, tier, loading, isLoading, profile]);

  const close = () => {
    if (user) localStorage.setItem(key(user.id), tier);
    setOpen(false);
  };

  const v = (k: Field) => num(vals[k], ALL.find((f) => f.k === k)?.unit);
  const assets = v("assets_bank") + v("assets_cash") + v("assets_property");
  const debts = v("mortgage_balance") + v("liabilities");
  const portfolio = v("assets_etf") + v("assets_stocks") + v("assets_retirement") + v("assets_crypto");
  const netWorth = assets + portfolio - debts;
  const sym = currencySymbol(profile.currency);

  const finish = async () => {
    const patch: Partial<Profile> = { risk_profile: risk } as Partial<Profile>;
    ALL.forEach((f) => ((patch as Record<string, number>)[f.k] = v(f.k)));
    try {
      await save(patch);
      close();
      toast.success(t("¡Listo! Tu patrimonio y portfolio ya están cargados", "Done! Your net worth and portfolio are set"));
      navigate({ to: "/patrimonio" });
    } catch {
      toast.error(t("No se pudo guardar, inténtalo de nuevo", "Couldn't save, please try again"));
    }
  };

  const renderFields = (list: F[]) => (
    <div className="grid grid-cols-2 gap-3">
      {list.map((f) => {
        const unit = f.unit ?? "money";
        return (
          <label key={f.k} className={cn("block space-y-1", !f.half && "col-span-2")}>
            <span className="block truncate text-xs text-muted-foreground">{t(f.es, f.en)}</span>
            <div className="relative">
              {unit === "money" && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{sym}</span>
              )}
              <Input
                inputMode="decimal"
                className={cn("h-10", unit === "money" ? "pl-8" : "pr-12")}
                placeholder="0"
                value={vals[f.k] ?? ""}
                onChange={(e) => setVals((s) => ({ ...s, [f.k]: e.target.value }))}
              />
              {unit !== "money" && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {unit === "pct" ? "%" : t("años", "yrs")}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );

  const section = (es: string, en: string) => (
    <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(es, en)}</p>
  );

  const Stat = ({ label, value, strong }: { label: string; value: number; strong?: boolean }) => (
    <div className={cn("rounded-xl border border-border bg-muted/30 p-3", strong && "border-primary/40 bg-primary/10")}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", strong && "text-primary")}>{fmt(value, sym)}</p>
    </div>
  );

  const titles = [
    [t("Completa tu patrimonio", "Complete your net worth"), t("Lo que tienes y lo que debes", "What you own and what you owe")],
    [t("Completa tu portfolio", "Complete your portfolio"), t("Tus inversiones y tu estrategia", "Your investments and strategy")],
    [t("Tu foto financiera", "Your financial snapshot"), t("Revisa antes de guardar", "Review before saving")],
  ];
  const Icon = step === 0 ? Landmark : step === 1 ? LineChart : CheckCircle2;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {t(`Paso ${step + 1} de 3`, `Step ${step + 1} of 3`)}
          </div>
          <div className="mb-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <DialogTitle>{titles[step]?.[0]}</DialogTitle>
          <DialogDescription>{titles[step]?.[1]}</DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3">
            {section("Activos", "Assets")}
            {renderFields(ASSETS)}
            {section("Deudas", "Debts")}
            {renderFields(DEBTS)}
            <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("Patrimonio neto", "Net worth")}</span>
              <span className="font-semibold tabular-nums text-primary">{fmt(assets - debts, sym)}</span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {section("Tus inversiones", "Your investments")}
            {renderFields(PORTFOLIO)}
            {section("Tu estrategia", "Your strategy")}
            <div className="grid grid-cols-3 gap-2">
              {RISKS.map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => {
                    setRisk(r.v);
                    if (!vals["expected_return"]) setVals((s) => ({ ...s, expected_return: String(r.ret) }));
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                    risk === r.v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {t(r.es, r.en)}
                  <span className="block text-[10px] opacity-70">~{r.ret}%</span>
                </button>
              ))}
            </div>
            {renderFields(PLAN)}
            <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("Total invertido", "Total invested")}</span>
              <span className="font-semibold tabular-nums text-primary">{fmt(portfolio, sym)}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label={t("Activos", "Assets")} value={assets + portfolio} />
              <Stat label={t("Deudas", "Debts")} value={debts} />
              <Stat label={t("Portfolio", "Portfolio")} value={portfolio} />
              <Stat label={t("Patrimonio neto", "Net worth")} value={netWorth} strong />
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "Con esto llenamos Patrimonio, Portafolio e Hipoteca. Puedes editarlo cuando quieras.",
                "This fills Net worth, Portfolio and Mortgage. You can edit it anytime.",
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={step === 0 ? close : () => setStep(step - 1)}>
            {step === 0 ? t("Más tarde", "Later") : t("Atrás", "Back")}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)}>{t("Siguiente", "Next")}</Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? t("Guardando", "Saving") : t("Guardar", "Save")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
