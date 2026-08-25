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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import houseImg from "@/assets/mortgage-house.jpg";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
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
  payment: number;
  extra: number;
  lump: number;
};

const KEY = "whatsyournumber:mortgage";

const defaults: MortgageState = {
  balance: 0,
  rate: 0,
  rateType: "variable",
  term: 0,
  payment: 0,
  extra: 250,
  lump: 25000,
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

/** Años restantes implícitos en una cuota mensual declarada. */
function termFor(balance: number, annualRate: number, payment: number) {
  const r = annualRate / 100 / 12;
  if (balance <= 0 || payment <= 0) return 30;
  if (r === 0) return Math.min(40, Math.max(1, Math.round(balance / payment / 12)));
  if (payment <= balance * r) return 40;
  const months = -Math.log(1 - (r * balance) / payment) / Math.log(1 + r);
  return Math.min(40, Math.max(1, Math.round(months / 12)));
}

function futureValue(monthly: number, annualReturn: number, months: number) {
  const r = annualReturn / 100 / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

/** Desglose anual de intereses vs capital de una hipoteca francesa. */
function amortizationByYear(balance: number, annualRate: number, payment: number) {
  const r = annualRate / 100 / 12;
  const rows: { year: number; label: string; interest: number; principal: number; balance: number }[] = [];
  if (balance <= 0 || payment <= 0 || payment <= balance * r) return rows;
  let b = balance;
  let year = 1;
  const startYear = new Date().getFullYear();
  while (b > 0 && year <= 40) {
    let interest = 0;
    let principal = 0;
    for (let m = 0; m < 12 && b > 0; m++) {
      const i = b * r;
      const p = Math.min(b, payment - i);
      interest += i;
      principal += p;
      b -= p;
    }
    rows.push({
      year,
      label: String(startYear + year - 1),
      interest: Math.round(interest),
      principal: Math.round(principal),
      balance: Math.max(0, Math.round(b)),
    });
    year += 1;
  }
  return rows;
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
  const currencySymbol =
    new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 })
      .formatToParts(1)
      .find((p) => p.type === "currency")?.value ?? currency;
  const expected = Number(profile.expected_return) || 7;

  const [s, setS] = useState<MortgageState>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setS({ ...defaults, ...(JSON.parse(raw) as Partial<MortgageState>) });
    } catch {
      /* ignore */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill desde Mis datos / onboarding (fuente de verdad).
  // Orden: saldo de hipoteca → deudas declaradas (si la vivienda es hipoteca) → precio de vivienda menos entrada.
  const hasMortgageHousing = ((profile as { housing?: string }).housing || "") === "hipoteca";
  const derivedBalance =
    Number(profile.mortgage_balance) > 0
      ? Number(profile.mortgage_balance)
      : hasMortgageHousing && Number(profile.liabilities) > 0
        ? Number(profile.liabilities)
        : Number(profile.home_price) > 0
          ? Math.round(
              Number(profile.home_price) * (1 - (Number(profile.down_payment_pct) || 0) / 100),
            )
          : 0;
  const hasProfileMortgage = derivedBalance > 0;


  useEffect(() => {
    if (!ready) return;
    const mBalance = derivedBalance;
    // Sin hipoteca en onboarding: limpiar datos residuales y dejar campos vacíos.
    if (mBalance <= 0) {
      setS((prev) => {
        if (prev.balance === 0) return prev;
        try {
          window.localStorage.removeItem(KEY);
        } catch {
          /* ignore */
        }
        return { ...defaults };
      });
      return;
    }
    const mRate = Number(profile.mortgage_rate) || 0;
    const mTerm = Number(profile.mortgage_term) || 0;
    const housing = Number(profile.fixed_housing) || 0;
    const rate = mRate || s.rate;
    const term = mTerm || (housing > 0 ? termFor(mBalance, rate, housing) : s.term);
    const payment = Math.round(paymentFor(mBalance, rate, term * 12));
    setS((prev) => {
      if (prev.balance === mBalance && prev.rate === rate && prev.term === term) return prev;
      const next = { ...prev, balance: mBalance, rate, term, payment };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, derivedBalance, profile.mortgage_rate, profile.mortgage_term, profile.fixed_housing]);


  // Recalcula la cuota cuando cambian saldo, tasa o plazo (no cuando el usuario la editó directamente).
  useEffect(() => {
    if (!ready || !s.balance) return;
    const nextPayment = Math.round(paymentFor(s.balance, s.rate, s.term * 12));
    if (Math.abs(nextPayment - s.payment) >= 1) {
      setS((prev) => {
        const next = { ...prev, payment: nextPayment };
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.balance, s.rate, s.term]);


  const set = (patch: Partial<MortgageState>) => {
    const next = { ...s, ...patch };
    setS(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const payment = s.payment;
  const base = useMemo(() => simulate(s.balance, s.rate, payment), [s.balance, s.rate, payment]);

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

  const schedule = useMemo(() => amortizationByYear(s.balance, s.rate, payment), [s.balance, s.rate, payment]);
  const penaltyYears = Math.min(5, schedule.length);
  const penaltyInterest = schedule.slice(0, penaltyYears).reduce((a, r) => a + r.interest, 0);
  const penaltyPrincipal = schedule.slice(0, penaltyYears).reduce((a, r) => a + r.principal, 0);
  const firstYear = schedule[0];
  const firstInterestShare = firstYear && firstYear.interest + firstYear.principal > 0
    ? (firstYear.interest / (firstYear.interest + firstYear.principal)) * 100
    : 0;

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

      {/* Hero: current mortgage */}
      <Panel variant="minimal" className="relative overflow-hidden">
        <img
          src={houseImg}
          alt={t("Casa moderna", "Modern house")}
          loading="lazy"
          width={1024}
          height={640}
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-[38%] object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_28%)] lg:block"
        />
        <div className="relative lg:pr-[40%]">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-positive/10">
              <Home className="h-5 w-5 text-positive" />
            </span>
            <h2 className="text-lg font-semibold">{t("Análisis de hipoteca", "Mortgage analysis")}</h2>
          </div>
          {!hasProfileMortgage && (
            <div className="mb-5 flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {t(
                  "No encontramos tu hipoteca en Mis datos. Complétala allí o escribe los importes aquí.",
                  "We couldn't find your mortgage in your profile. Add it there or type the amounts here.",
                )}
              </span>
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <a href="/mi-perfil#patrimonio">{t("Ir a Mis datos", "Go to my data")}</a>
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("Monto pendiente", "Outstanding balance")}</p>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {currencySymbol}
                </span>
                <NumberInput
                  value={Math.round(s.balance)}
                  step={1000}
                  format
                  onChange={(v) => set({ balance: Math.round(v) })}
                  className="h-11 w-full text-sm font-semibold"
                  style={{ paddingLeft: `${1.25 + currencySymbol.length * 0.55}rem` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Tasa de interés (%)", "Interest rate (%)")}</p>
              <NumberInput
                value={s.rate}
                step={0.1}
                onChange={(v) => set({ rate: v })}
                className="mt-1.5 h-11 w-full text-sm font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Plazo restante (años)", "Remaining term (years)")}</p>
              <NumberInput
                value={s.term}
                step={1}
                min={1}
                max={40}
                onChange={(v) => set({ term: v })}
                className="mt-1.5 h-11 w-full text-sm font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Pago mensual", "Monthly payment")}</p>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {currencySymbol}
                </span>
                <NumberInput
                  value={Math.round(s.payment)}
                  step={50}
                  min={0}
                  format
                  onChange={(v) => {
                    const nextPayment = Math.max(0, Math.round(v));
                    set({
                      payment: nextPayment,
                      term: termFor(s.balance, s.rate, nextPayment),
                    });
                  }}
                  className="h-11 w-full text-sm font-semibold"
                  style={{ paddingLeft: `${1.25 + currencySymbol.length * 0.55}rem` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">{t("Tipo de tasa:", "Rate type:")}</p>
            <Select value={s.rateType} onValueChange={(v) => set({ rateType: v as "fixed" | "variable" })}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">{t("Fija", "Fixed")}</SelectItem>
                <SelectItem value="variable">{t("Variable", "Variable")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      {/* Health + interest */}
      <div className="grid gap-4 md:grid-cols-2">


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
          className="min-w-0 lg:col-span-3"
          title={t("¿Qué deberías hacer?", "What should you do?")}
          description={t("Hemos comparado las mejores estrategias para ti.", "We compared the best strategies for you.")}
        >
          {strategies.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              {t(
              "Añade el saldo pendiente y el plazo restante para comparar estrategias.",
              "Add your outstanding balance and remaining term to compare strategies.",
              )}
            </div>
          ) : (
            <div className="no-scrollbar -mx-1 w-full max-w-full overflow-x-auto px-1">
              <table className="w-full min-w-[620px] text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="whitespace-nowrap py-2 pr-4 font-normal">{t("Estrategia", "Strategy")}</th>
                    <th className="whitespace-nowrap py-2 pl-4 text-right font-normal">{t("Pago mensual", "Monthly payment")}</th>
                    <th className="whitespace-nowrap py-2 pl-4 text-right font-normal">{t("Interés total", "Total interest")}</th>
                    <th className="whitespace-nowrap py-2 pl-4 text-right font-normal">{t("Quedarás libre en", "Mortgage free")}</th>
                    <th className="whitespace-nowrap py-2 pl-4 text-right font-normal">{t("Ahorro total", "Total savings")}</th>
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
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            x.best ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground",
                          )}>
                            <x.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
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
                      <td className="numeric whitespace-nowrap py-3 pl-4 text-right font-medium">{fmt(x.payment)}</td>
                      <td className="numeric whitespace-nowrap py-3 pl-4 text-right">{fmt(x.interest)}</td>
                      <td className="numeric whitespace-nowrap py-3 pl-4 text-right">{freeDate(x.months)}</td>
                      <td className={cn("numeric whitespace-nowrap py-3 pl-4 text-right font-medium", x.saving > 0 && "text-positive")}>
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
                    <p className="text-xs text-positive">{formatTerm(monthsSaved)} {t("antes", "earlier")}</p>
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
                  <p className="numeric text-sm font-semibold">{fmt(payment + s.extra)}</p>
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

      {/* Interés vs capital por año */}
      <Panel
        title={t("Intereses vs capital por año", "Interest vs principal by year")}
        description={t(
          "Al principio casi toda tu cuota son intereses; el capital crece con los años.",
          "At the start almost all of your payment is interest; principal grows over the years.",
        )}
      >
        {schedule.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Añade el saldo, la tasa y el plazo para ver tu amortización.", "Add balance, rate and term to see your amortization.")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-chart-5)" }} />
                {t("Intereses", "Interest")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-chart-1)" }} />
                {t("Capital", "Principal")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-warning/40" />
                {t("Años 1-5: penalización por cambio de banco", "Years 1-5: switching penalty window")}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={schedule} margin={{ left: -8, right: 8, top: 8 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                {penaltyYears > 0 && schedule[0] && (
                  <ReferenceArea
                    x1={schedule[0].label}
                    x2={schedule[penaltyYears - 1]?.label ?? schedule[0].label}
                    fill="var(--color-warning)"
                    fillOpacity={0.08}
                  />
                )}
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => fmtC(Number(v))} width={64} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.25 }} />
                <Bar dataKey="interest" stackId="a" name={t("Intereses", "Interest")} fill="var(--color-chart-5)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="principal" stackId="a" name={t("Capital", "Principal")} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-elevated/40 p-3">
                <p className="text-xs text-muted-foreground">{t("Año 1: cuota que va a intereses", "Year 1: payment going to interest")}</p>
                <p className="numeric mt-1 text-lg font-semibold text-warning">{firstInterestShare.toFixed(0)}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-elevated/40 p-3">
                <p className="text-xs text-muted-foreground">{t("Intereses en los 5 primeros años", "Interest in the first 5 years")}</p>
                <p className="numeric mt-1 text-lg font-semibold">{fmt(penaltyInterest)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-elevated/40 p-3">
                <p className="text-xs text-muted-foreground">{t("Capital amortizado en 5 años", "Principal repaid in 5 years")}</p>
                <p className="numeric mt-1 text-lg font-semibold text-positive">{fmt(penaltyPrincipal)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-xs text-muted-foreground">
                {t(
                  `La mayoría de bancos aplican comisión por subrogación o cancelación anticipada durante los primeros 5 años. En ese periodo pagarías ${fmt(penaltyInterest)} en intereses y solo amortizarías ${fmt(penaltyPrincipal)} de capital: normalmente conviene esperar a que venza la penalización y entonces cambiar de banco o renegociar la tasa.`,
                  `Most banks charge an early repayment or switching fee during the first 5 years. In that window you'd pay ${fmt(penaltyInterest)} in interest and repay only ${fmt(penaltyPrincipal)} of principal: it usually pays to wait until the penalty expires and then switch bank or renegotiate your rate.`,
                )}
              </p>
            </div>
          </div>
        )}
      </Panel>


      {/* Invest vs pay down */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel variant="minimal" className="flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{t("¿Abonar o invertir?", "Pay down or invest?")}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              `Abonar ${fmt(s.extra)}/mes te ahorra ${fmt(interestSaved)} en intereses. Invertir ese mismo dinero al ${expected}% durante ${formatTerm(horizon)} genera ${fmtC(invested)}.`,
              `Paying ${fmt(s.extra)}/mo extra saves ${fmt(interestSaved)} in interest. Investing the same amount at ${expected}% for ${formatTerm(horizon)} builds ${fmtC(invested)}.`,
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
                  `Quedarías libre de hipoteca ${formatTerm(monthsSaved)} antes, liberando ${fmt(payment)}/mes para invertir.`,
                  `You'd be mortgage-free ${formatTerm(monthsSaved)} earlier, freeing ${fmt(payment)}/mo to invest.`,
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
