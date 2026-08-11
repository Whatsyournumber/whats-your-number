import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Calendar,
  Check,
  Home,
  Lightbulb,
  PiggyBank,
  Plus,
  Star,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { compact, money } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

type MortgageState = {
  balance: number;
  rate: number;
  rateType: "fixed" | "variable";
  term: number;
  extra: number;
  lump: number;
  nextReviewDate: string;
};

const KEY = "whatsyournumber:mortgage";

const defaults: MortgageState = {
  balance: 0,
  rate: 3.5,
  rateType: "variable",
  term: 30,
  extra: 250,
  lump: 25000,
  nextReviewDate: "Oct 2026",
};

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

/** Puntaje de salud de la hipoteca (0-100). */
function healthScore(balance: number, rate: number, payment: number, income: number) {
  if (!balance || !payment) return 0;
  const rateScore = Math.max(0, Math.min(30, (5 - Math.max(0, rate)) * 6));
  const ratio = income > 0 ? payment / income : 0.35;
  const ratioScore = Math.max(0, Math.min(30, (0.5 - ratio) * 150));
  const months = Math.min(1200, simulate(balance, rate, payment).months);
  const years = months / 12;
  const termScore = Math.max(0, Math.min(25, Math.max(0, (30 - years) * 1.25)));
  const balanceScore = Math.max(0, Math.min(15, Math.max(0, 15 - (balance / Math.max(1, income * 12)) * 2)));
  return Math.round(Math.min(100, rateScore + ratioScore + termScore + balanceScore));
}

function healthLabel(score: number) {
  if (score >= 85) return { label: "Excelente", color: "text-positive" };
  if (score >= 70) return { label: "Bien, pero puedes mejorar", color: "text-warning" };
  if (score >= 50) return { label: "Regular", color: "text-warning" };
  return { label: "Necesita atención", color: "text-negative" };
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

  const payment = useMemo(() => paymentFor(s.balance, s.rate, s.term * 12), [s.balance, s.rate, s.term]);
  const base = useMemo(() => simulate(s.balance, s.rate, payment), [s.balance, s.rate, s.term, payment]);

  const strategies = useMemo(() => {
    if (!s.balance || !payment) return [];
    const withExtra = simulate(s.balance, s.rate, payment, s.extra);
    const withLump = simulate(s.balance, s.rate, payment, 0, s.lump);
    const newRate = Math.max(0.1, s.rate - 1);
    const renegotiated = paymentFor(s.balance, newRate, s.term * 12);
    const reneg = simulate(s.balance, newRate, renegotiated);
    return [
      {
        id: "keep",
        icon: Home,
        name: t("Seguir igual", "Keep as is"),
        note: t("Plan actual", "Current plan"),
        payment,
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
        payment: payment + s.extra,
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
        payment,
        interest: withLump.interest,
        months: withLump.months,
        saving: base.interest - withLump.interest,
        best: false,
      },
      {
        id: "reneg",
        icon: Star,
        name: t(`Negociar tasa a ${newRate.toFixed(2)}%`, `Negotiate rate to ${newRate.toFixed(2)}%`),
        note: t("Misma duración, menos cuota", "Same term, lower payment"),
        payment: renegotiated,
        interest: reneg.interest,
        months: reneg.months,
        saving: base.interest - reneg.interest,
        best: false,
      },
    ].map((x, _i, arr) => ({ ...x, best: x.saving > 0 && x.saving === Math.max(...arr.map((y) => y.saving)) }));
  }, [s, payment, base, t]);

  const bestStrategy = strategies.find((x) => x.best);
  const recommended = bestStrategy ?? strategies[0];
  const recommendedSaving = recommended?.saving ?? 0;

  const horizon = Number.isFinite(base.months) ? Math.min(base.months, 360) : 240;
  const invested = futureValue(s.extra, expected, horizon);
  const interestSaved = strategies.find((x) => x.id === "extra")?.saving ?? 0;
  const investWins = invested > interestSaved;
  const monthsSaved = Number.isFinite(base.months) && Number.isFinite(strategies[1]?.months ?? Infinity)
    ? base.months - (strategies[1]?.months ?? base.months)
    : 0;
  const towardNumber = d.plan.targetCapital > 0 ? (Math.max(invested, interestSaved) / d.plan.targetCapital) * 100 : 0;

  const formatTerm = (m: number) => {
    if (!Number.isFinite(m)) return "—";
    const y = Math.floor(m / 12);
    const mm = Math.round(m % 12);
    return `${y}${t("a", "y")} ${mm}${t("m", "m")}`;
  };

  const freeDate = (months: number) => {
    if (!Number.isFinite(months)) return "—";
    const date = new Date();
    date.setMonth(date.getMonth() + Math.round(months));
    return date.toLocaleDateString(t("es", "en"), { year: "numeric", month: "short" });
  };

  const score = healthScore(s.balance, s.rate, payment, d.income);
  const hlabel = healthLabel(score);
  const scoreData = [
    { name: "score", value: score, color: "var(--color-positive)" },
    { name: "remaining", value: 100 - score, color: "var(--color-muted)" },
  ];

  const totalInterest = base.interest;
  const totalPaid = s.balance + totalInterest;
  const interestPct = totalPaid > 0 ? totalInterest / totalPaid : 0;
  const principalPct = totalPaid > 0 ? s.balance / totalPaid : 0;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{t("Hipoteca", "Mortgage")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Optimiza tu hipoteca y toma la mejor decisión.", "Optimize your mortgage and make the best decision.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="/configuracion">
              <Upload className="h-4 w-4" />
              {t("Subir estado de cuenta", "Upload statement")}
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => set(defaults)}>
            <Plus className="h-4 w-4" />
            {t("Agregar hipoteca", "Add mortgage")}
          </Button>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Current mortgage */}
        <Panel variant="minimal" className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("Tu hipoteca actual", "Your current mortgage")}</h2>
            <span className="text-xs font-medium text-positive">{t("Editar", "Edit")}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("Saldo pendiente", "Outstanding balance")}</p>
              <NumberInput
                value={s.balance}
                step={1000}
                onChange={(v) => set({ balance: v })}
                className="mt-1 h-8 w-full text-right text-sm font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Tasa de interés", "Interest rate")}</p>
              <NumberInput
                value={s.rate}
                step={0.1}
                onChange={(v) => set({ rate: v })}
                className="mt-1 h-8 w-full text-right text-sm font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Pago mensual", "Monthly payment")}</p>
              <NumberInput
                value={s.payment}
                step={50}
                onChange={(v) => set({ payment: v })}
                className="mt-1 h-8 w-full text-right text-sm font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Plazo restante", "Remaining term")}</p>
              <p className="numeric mt-1 text-sm font-semibold">{term(base.months)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Tipo de tasa", "Rate type")}</p>
              <Select value={s.rateType} onValueChange={(v) => set({ rateType: v as "fixed" | "variable" })}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t("Fija", "Fixed")}</SelectItem>
                  <SelectItem value="variable">{t("Variable", "Variable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Próxima revisión", "Next review")}</p>
              <input
                type="text"
                value={s.nextReviewDate}
                onChange={(e) => set({ nextReviewDate: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-elevated/40 px-2 text-right text-xs font-semibold text-foreground outline-none focus-visible:border-border"
              />
            </div>
          </div>
        </Panel>

        {/* Health score */}
        <Panel variant="minimal" className="flex h-full flex-col">
          <h2 className="text-sm font-semibold">{t("Salud de tu hipoteca", "Mortgage health")}</h2>
          <div className="flex flex-1 items-center gap-5">
            <div className="relative h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreData}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={42}
                    outerRadius={54}
                    stroke="none"
                  >
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="numeric text-2xl font-semibold">{score}</span>
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", hlabel.color)}>{hlabel.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "Tienes oportunidades para ahorrar dinero y pagar tu hipoteca más rápido.",
                  "You have opportunities to save money and pay off your mortgage faster.",
                )}
              </p>
              <button className="mt-2 flex items-center gap-1 text-xs font-medium text-positive hover:underline">
                {t("Ver detalle", "See details")} <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </Panel>

        {/* Total interest */}
        <Panel variant="minimal" className="flex h-full flex-col">
          <h2 className="text-sm font-semibold">{t("Interés total que pagarás", "Total interest you'll pay")}</h2>
          <p className="numeric mt-1 text-3xl font-semibold">{fmt(totalInterest)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Si mantienes tu plan actual", "If you keep your current plan")}
          </p>

          <div className="mt-4 flex-1 space-y-3">
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-positive"
                style={{ width: `${interestPct * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("Pagas ahora", "Principal paid")}</span>
              <span className="text-muted-foreground">{t("Interés total", "Total interest")}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="numeric">{fmt(s.balance)}</span>
              <span className="numeric">{fmt(totalInterest)}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Middle: strategies + quick simulator */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel
          variant="minimal"
          className="lg:col-span-3"
          title={t("¿Qué deberías hacer?", "What should you do?")}
          description={t("Hemos comparado las mejores estrategias para ti.", "We compared the best strategies for you.")}
        >
          {strategies.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              {t(
                "Añade el saldo pendiente y la cuota mensual para comparar estrategias.",
                "Add your outstanding balance and monthly payment to compare strategies.",
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 font-normal">{t("Estrategia", "Strategy")}</th>
                    <th className="py-2 text-right font-normal">{t("Pago mensual", "Monthly payment")}</th>
                    <th className="py-2 text-right font-normal">{t("Interés total", "Total interest")}</th>
                    <th className="py-2 text-right font-normal">{t("Quedarás libre en", "Mortgage free")}</th>
                    <th className="py-2 text-right font-normal">{t("Ahorro total", "Total savings")}</th>
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
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            x.best ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground",
                          )}>
                            <x.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{x.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {x.best ? (
                                <span className="inline-flex items-center gap-1 text-positive">
                                  <Check className="h-3 w-3" /> {t("Recomendado", "Recommended")}
                                </span>
                              ) : (
                                x.note
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="numeric py-3 text-right font-medium">{fmt(x.payment)}</td>
                      <td className="numeric py-3 text-right">{fmt(x.interest)}</td>
                      <td className="numeric py-3 text-right">{freeDate(x.months)}</td>
                      <td className={cn("numeric py-3 text-right font-medium", x.saving > 0 && "text-positive")}>
                        {x.saving > 0 ? fmt(x.saving) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="mt-4 flex items-center gap-1 text-xs font-medium text-positive hover:underline">
                {t("Ver todas las estrategias", "See all strategies")} <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </Panel>

        <Panel
          variant="minimal"
          className="lg:col-span-2"
          title={t("Simulador rápido", "Quick simulator")}
          description={t("¿Cuánto quieres abonar adicionalmente?", "How much extra do you want to pay?")}
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="numeric text-3xl font-semibold">{fmt(s.extra)}</span>
                <span className="text-sm text-muted-foreground">/ {t("mes", "mo")}</span>
              </div>
              <Slider
                value={[s.extra]}
                min={0}
                max={2000}
                step={50}
                onValueChange={([v]) => set({ extra: v ?? 0 })}
                className="mt-4"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>{fmt(2000)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-elevated/40 px-3 py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("Libre de hipoteca", "Mortgage free")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="numeric text-sm font-semibold">{freeDate(strategies[1]?.months ?? base.months)}</p>
                  {monthsSaved > 0 && (
                    <p className="text-xs text-positive">{term(monthsSaved)} {t("antes", "earlier")}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-elevated/40 px-3 py-3">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{t("Ahorras en interés", "Interest savings")}</p>
                </div>
                <div className="text-right">
                  <p className="numeric text-sm font-semibold text-positive">{fmt(interestSaved)}</p>
                  <p className="text-xs text-muted-foreground">{t("Menos intereses pagos", "Less interest paid")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-elevated/40 px-3 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{t("Nuevo pago mensual", "New monthly payment")}</p>
                </div>
                <div className="text-right">
                  <p className="numeric text-sm font-semibold">{fmt(s.payment + s.extra)}</p>
                  <p className="text-xs text-muted-foreground">{t("Pago total", "Total payment")}</p>
                </div>
              </div>
            </div>

            <button className="flex items-center gap-1 text-xs font-medium text-positive hover:underline">
              {t("Ver amortización completa", "See full amortization")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Panel>
      </div>

      {/* Bottom tip */}
      <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {bestStrategy
              ? t(
                  `${bestStrategy.name} podría ahorrarte ${fmt(bestStrategy.saving)} en intereses.`,
                  `${bestStrategy.name} could save you ${fmt(bestStrategy.saving)} in interest.`,
                )
              : t(
                  "Negociar tu tasa podría ahorrarte miles en intereses.",
                  "Negotiating your rate could save you thousands in interest.",
                )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(
              `Abonar o invertir al ${expected}%: ${investWins ? "invertir gana" : "abonar gana"} con tu tasa actual del ${s.rate}%.`,
              `Pay down or invest at ${expected}%: ${investWins ? "investing wins" : "paying down wins"} with your current ${s.rate}% rate.`,
            )}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-muted-foreground">{t("Impacto en Your Number", "Impact on Your Number")}</p>
          <p className="numeric text-xl font-semibold text-positive">{towardNumber.toFixed(1)}%</p>
        </div>
      </div>

      {/* Invest vs pay down */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel variant="minimal" className="flex flex-col justify-between">
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
          <p className={cn("mt-3 text-sm font-medium", investWins ? "text-positive" : "text-warning")}>
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
        </Panel>

        <Panel variant="minimal" className="flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{t("Impacto en Your Number", "Impact on Your Number")}</p>
          </div>
          <p className="numeric mt-2 text-3xl font-semibold">{towardNumber.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(
              `de tu número (${fmtC(d.plan.targetCapital)}) cubierto con la mejor decisión.`,
              `of your number (${fmtC(d.plan.targetCapital)}) covered by the best decision.`,
            )}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {monthsSaved > 0
              ? t(
                  `Quedarías libre de hipoteca ${term(monthsSaved)} antes, liberando ${fmt(s.payment)}/mes para invertir.`,
                  `You'd be mortgage-free ${term(monthsSaved)} earlier, freeing ${fmt(s.payment)}/mo to invest.`,
                )
              : t(
                  "Sigue aportando para acelerar el camino hacia tu número.",
                  "Keep contributing to accelerate your path to your number.",
                )}
          </p>
        </Panel>
      </div>
    </div>
  );
}
