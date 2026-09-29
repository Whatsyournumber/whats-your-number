import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Landmark, LineChart } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, type Profile } from "@/hooks/use-profile";
import { useSubscription, type PlanTier } from "@/hooks/use-subscription";
import { useT } from "@/hooks/use-language";
import { currencySymbol } from "@/lib/onboarding";

const RANK: Record<PlanTier, number> = { free: 0, pro: 1, investor: 2, patrimonio: 3 };
const key = (uid: string) => `yn.plan-onboarding.${uid}`;

type Field = keyof Profile;
const STEP1: { k: Field; es: string; en: string }[] = [
  { k: "assets_bank", es: "Dinero en el banco", en: "Money in the bank" },
  { k: "assets_property", es: "Valor de tu vivienda / propiedades", en: "Home / property value" },
  { k: "mortgage_balance", es: "Hipoteca pendiente", en: "Mortgage balance" },
  { k: "liabilities", es: "Otras deudas (tarjetas, préstamos)", en: "Other debts (cards, loans)" },
];
const STEP2: { k: Field; es: string; en: string }[] = [
  { k: "assets_etf", es: "Fondos indexados / ETF", en: "Index funds / ETFs" },
  { k: "assets_stocks", es: "Acciones", en: "Stocks" },
  { k: "assets_retirement", es: "Plan de pensiones / retiro", en: "Pension / retirement plan" },
  { k: "assets_crypto", es: "Cripto", en: "Crypto" },
];

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

  useEffect(() => {
    if (!user || loading || isLoading) return;
    const stored = localStorage.getItem(key(user.id)) as PlanTier | null;
    const needs = RANK[tier] >= RANK.investor;
    if (!needs) {
      localStorage.setItem(key(user.id), tier);
      return;
    }
    const hasData = [...STEP1, ...STEP2].some((f) => Number(profile[f.k]) > 0 && f.k !== "assets_bank");
    const upgraded = stored ? RANK[stored] < RANK.investor : !hasData;
    if (upgraded) {
      const init: Record<string, string> = {};
      [...STEP1, ...STEP2].forEach((f) => {
        const n = Number(profile[f.k]);
        init[f.k] = n > 0 ? String(n) : "";
      });
      setVals(init);
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

  const finish = async () => {
    const patch: Partial<Profile> = {};
    [...STEP1, ...STEP2].forEach((f) => {
      const n = Number((vals[f.k] ?? "").replace(/[.,\s]/g, ""));
      (patch as Record<string, number>)[f.k] = Number.isFinite(n) ? n : 0;
    });
    try {
      await save(patch);
      close();
      toast.success(t("¡Listo! Tu patrimonio y portfolio ya están cargados", "Done! Your net worth and portfolio are set"));
      navigate({ to: "/patrimonio" });
    } catch {
      toast.error(t("No se pudo guardar, inténtalo de nuevo", "Couldn't save, please try again"));
    }
  };

  const fields = step === 0 ? STEP1 : STEP2;
  const sym = currencySymbol(profile.currency);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {step === 0 ? <Landmark className="h-4 w-4 text-primary" /> : <LineChart className="h-4 w-4 text-primary" />}
            {t(`Paso ${step + 1} de 2`, `Step ${step + 1} of 2`)}
          </div>
          <DialogTitle>
            {step === 0 ? t("Completa tu patrimonio", "Complete your net worth") : t("Completa tu portfolio", "Complete your portfolio")}
          </DialogTitle>
          <DialogDescription>
            {step === 0
              ? t("Tu nuevo plan desbloquea Patrimonio e Hipoteca", "Your new plan unlocks Net worth and Mortgage")
              : t("Así llenamos tu Portfolio y tu rentabilidad", "This fills your Portfolio and returns")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.k} className="block space-y-1">
              <span className="text-sm text-muted-foreground">{t(f.es, f.en)}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{sym}</span>
                <Input
                  inputMode="numeric"
                  className="pl-8"
                  placeholder="0"
                  value={vals[f.k] ?? ""}
                  onChange={(e) => setVals((v) => ({ ...v, [f.k]: e.target.value }))}
                />
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={step === 0 ? close : () => setStep(0)}>
            {step === 0 ? t("Más tarde", "Later") : t("Atrás", "Back")}
          </Button>
          {step === 0 ? (
            <Button onClick={() => setStep(1)}>{t("Siguiente", "Next")}</Button>
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
