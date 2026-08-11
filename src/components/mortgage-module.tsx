import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Banknote, Home, PiggyBank, Star, TrendingUp } from "lucide-react";

import { Panel } from "@/components/page";
import { NumberInput } from "@/components/ui/number-input";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { compact, money } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

type MortgageState = {
  balance: number;
  rate: number;
  payment: number;
  extra: number;
  lump: number;
  newRate: number;
};

const KEY = "whatsyournumber:mortgage";

const defaults: MortgageState = { balance: 0, rate: 3.5, payment: 0, extra: 200, lump: 10000, newRate: 2.75 };

/** Simula la amortización mes a mes y devuelve meses e intereses totales. */
function simulate(balance: number, annualRate: number, payment: number, extra = 0, lump = 0) {
  const r = annualRate / 100 / 12;
  let b = Math.max(0, balance - lump);
  let interest = 0;
  let months = 0;
  const pay = payment + extra;
  if (b <= 0) return { months: 0, interest: 0, feasible: true };
  if (pay <= b * r) return { months: Infinity, interest: Infinity, feasible: false };
  while (b > 0 && months < 1200) {
    const i = b * r;
    interest += i;
    b = b + i - pay;
    months += 1;
  }
  return { months, interest, feasible: true };
}

/** Cuota estándar para un saldo, tasa y plazo en meses. */
function paymentFor(balance: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return balance / months;
  return (balance * r) / (1 - Math.pow(1 + r, -months));
}

function futureValue(monthly: number, annualReturn: number, months: number) {
  const r = annualReturn / 100 / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

/** Módulo de hipoteca: abonar, renegociar o invertir y su impacto en Your Number. */
export function MortgageModule() {
  const t = useT();
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const currency = profile.currency || "EUR";
  const fmt = (n: number) => (Number.isFinite(n) ? money(Math.round(n), currency) : "—");
  const fmtC = (n: number) => (Number.isFinite(n) ? compact(n, currency) : "—");
  const expected = Number(profile.expected_return) || 7;

  const [s, setS] = useState<MortgageState>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setS({ ...defaults, ...(JSON.parse(raw) as Partial<MortgageState>) });
      else {
        const housing = Number(profile.fixed_housing) || 0;
        if (housing > 0) setS((p) => ({ ...p, payment: housing }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<MortgageState>) => {
    const next = { ...s, ...patch };
    setS(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const base = useMemo(() => simulate(s.balance, s.rate, s.payment), [s.balance, s.rate, s.payment]);

  const strategies = useMemo(() => {
    if (!s.balance || !s.payment) return [];
    const withExtra = simulate(s.balance, s.rate, s.payment, s.extra);
    const withLump = simulate(s.balance, s.rate, s.payment, 0, s.lump);
    const months = Number.isFinite(base.months) ? base.months : 300;
    const renegotiated = paymentFor(s.balance, s.newRate, months);
    const reneg = simulate(s.balance, s.newRate, renegotiated);
    return [
      {
        id: "keep",
        icon: Home,
        name: t("Seguir igual", "Keep as is"),
        note: t("Plan actual", "Current plan"),
        payment: s.payment,
        interest: base.interest,
        months: base.months,
        saving: 0,
        best: false,
      },
      {
        id: "extra",
        icon: PiggyBank,
        name: t(`Abonar ${fmt(s.extra)}/mes`, `Pay ${fmt(s.extra)}/mo extra`),
        note: t("Pago adicional", "Extra payment"),
        payment: s.payment + s.extra,
        interest: withExtra.interest,
        months: withExtra.months,
        saving: base.interest - withExtra.interest,
        best: false,
      },
      {
        id: "lump",
        icon: Banknote,
        name: t(`Abonar ${fmt(s.lump)} ahora`, `Pay ${fmt(s.lump)} now`),
        note: t("Pago único", "One-off payment"),
        payment: s.payment,
        interest: withLump.interest,
        months: withLump.months,
        saving: base.interest - withLump.interest,
        best: false,
      },
      {
        id: "reneg",
        icon: Star,
        name: t(`Renegociar a ${s.newRate.toFixed(2)}%`, `Renegotiate to ${s.newRate.toFixed(2)}%`),
        note: t("Misma duración, menos cuota", "Same term, lower payment"),
        payment: renegotiated,
        interest: reneg.interest,
        months: reneg.months,
        saving: base.interest - reneg.interest,
        best: false,
      },
    ].map((x, _i, arr) => ({ ...x, best: x.saving > 0 && x.saving === Math.max(...arr.map((y) => y.saving)) }));
  }, [s, base, t]);

  // Abonar vs invertir: el abono "renta" la tasa de la hipoteca; invertir renta el retorno esperado.
  const horizon = Number.isFinite(base.months) ? Math.min(base.months, 360) : 240;
  const invested = futureValue(s.extra, expected, horizon);
  const interestSaved = strategies.find((x) => x.id === "extra")?.saving ?? 0;
  const investWins = invested > interestSaved;
  const monthsSaved = Number.isFinite(base.months) && Number.isFinite(strategies[1]?.months ?? Infinity)
    ? base.months - (strategies[1]?.months ?? base.months)
    : 0;
  const towardNumber = d.plan.targetCapital > 0 ? (Math.max(invested, interestSaved) / d.plan.targetCapital) * 100 : 0;

  const term = (m: number) => {
    if (!Number.isFinite(m)) return "—";
    const y = Math.floor(m / 12);
    const mm = Math.round(m % 12);
    return `${y}${t("a", "y")} ${mm}${t("m", "m")}`;
  };

  if (!hydrated) return null;

  return (
    <Panel
      variant="minimal"
      title={t("Tu hipoteca", "Your mortgage")}
      description={t(
        "¿Abonar, renegociar o invertir? Compara cada estrategia y su impacto en Your Number.",
        "Pay down, renegotiate or invest? Compare each strategy and its impact on Your Number.",
      )}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {[
            { l: t("Saldo pendiente", "Outstanding balance"), v: s.balance, k: "balance" as const, step: 1000 },
            { l: t("Cuota mensual", "Monthly payment"), v: s.payment, k: "payment" as const, step: 50 },
            { l: t("Tasa de interés (%)", "Interest rate (%)"), v: s.rate, k: "rate" as const, step: 0.1 },
            { l: t("Tasa renegociada (%)", "Renegotiated rate (%)"), v: s.newRate, k: "newRate" as const, step: 0.1 },
            { l: t("Pago único disponible", "One-off payment available"), v: s.lump, k: "lump" as const, step: 1000 },
          ].map((f) => (
            <div key={f.k} className="flex items-center gap-2 rounded-xl border border-border/60 bg-elevated/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">{f.l}</span>
              <NumberInput
                value={f.v}
                step={f.step}
                onChange={(v) => set({ [f.k]: v } as Partial<MortgageState>)}
                className="ml-auto h-8 w-32 text-right text-sm"
              />
            </div>
          ))}

          <div className="rounded-xl border border-border/60 bg-elevated/40 px-3 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t("Abono extra mensual", "Extra monthly payment")}</span>
              <span className="numeric text-lg font-semibold">{fmt(s.extra)}</span>
            </div>
            <Slider
              value={[s.extra]}
              min={0}
              max={2000}
              step={50}
              onValueChange={([v]) => set({ extra: v ?? 0 })}
              className="mt-3"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          {strategies.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              {t(
                "Añade el saldo pendiente y la cuota mensual para comparar estrategias.",
                "Add your outstanding balance and monthly payment to compare strategies.",
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="py-2 text-left font-normal">{t("Estrategia", "Strategy")}</th>
                      <th className="py-2 text-right font-normal">{t("Cuota", "Payment")}</th>
                      <th className="py-2 text-right font-normal">{t("Interés total", "Total interest")}</th>
                      <th className="py-2 text-right font-normal">{t("Libre en", "Free in")}</th>
                      <th className="py-2 text-right font-normal">{t("Ahorro", "Savings")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategies.map((x) => (
                      <tr
                        key={x.id}
                        className={cn(
                          "border-t border-border/50",
                          x.best && "bg-positive/8",
                        )}
                      >
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <x.icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{x.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {x.best ? t("Recomendado", "Recommended") : x.note}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="numeric py-2.5 text-right">{fmt(x.payment)}</td>
                        <td className="numeric py-2.5 text-right">{fmt(x.interest)}</td>
                        <td className="numeric py-2.5 text-right">{term(x.months)}</td>
                        <td className={cn("numeric py-2.5 text-right", x.saving > 0 && "text-positive")}>
                          {x.saving > 0 ? fmt(x.saving) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-elevated/40 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{t("¿Abonar o invertir?", "Pay down or invest?")}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t(
                      `Abonar ${fmt(s.extra)}/mes te ahorra ${fmt(interestSaved)} en intereses. Invertir ese mismo dinero al ${expected}% durante ${term(horizon)} genera ${fmtC(invested)}.`,
                      `Paying ${fmt(s.extra)}/mo extra saves ${fmt(interestSaved)} in interest. Investing the same amount at ${expected}% for ${term(horizon)} builds ${fmtC(invested)}.`,
                    )}
                  </p>
                  <p className={cn("mt-2 text-sm font-medium", investWins ? "text-positive" : "text-warning")}>
                    {investWins
                      ? t(
                          `Invertir gana: tu retorno esperado (${expected}%) supera tu tasa (${s.rate}%).`,
                          `Investing wins: your expected return (${expected}%) beats your rate (${s.rate}%).`,
                        )
                      : t(
                          `Abonar gana: tu tasa (${s.rate}%) es mayor que tu retorno esperado (${expected}%).`,
                          `Paying down wins: your rate (${s.rate}%) is higher than your expected return (${expected}%).`,
                        )}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-elevated/40 p-4">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{t("Impacto en Your Number", "Impact on Your Number")}</p>
                  </div>
                  <p className="numeric mt-2 text-2xl font-semibold">{towardNumber.toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      `de tu número (${fmtC(d.plan.targetCapital)}) cubierto con la mejor decisión. Además, quedarías libre de hipoteca ${monthsSaved > 0 ? `${term(monthsSaved)} antes` : "en el plazo actual"}, liberando ${fmt(s.payment)}/mes para invertir.`,
                      `of your number (${fmtC(d.plan.targetCapital)}) covered by the best decision. You'd also be mortgage-free ${monthsSaved > 0 ? `${term(monthsSaved)} earlier` : "on the current term"}, freeing ${fmt(s.payment)}/mo to invest.`,
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
