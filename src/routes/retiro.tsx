import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { type City, cities } from "@/lib/onboarding";
import { buildDataset, projectRetirementFrom } from "@/lib/profile-data";

export const Route = createFileRoute("/retiro")({
  head: () => ({
    meta: [
      { title: "Fondo de Retiro — Your north" },
      { name: "description", content: "Saldo, aportes, rentabilidad anual y simulador de proyección de tu fondo de retiro." },
      { property: "og:title", content: "Fondo de Retiro — Your north" },
      { property: "og:description", content: "Proyecta tu retiro ajustando aporte mensual, rentabilidad y edad objetivo." },
    ],
  }),
  component: Retiro,
});

function Retiro() {
  const t = useT();
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const { retirement, fmt, fmtCompact, plan } = d;

  // Solo activos que generan retorno (excluye propiedades).
  const investable =
    profile.assets_cash +
    profile.assets_bank +
    profile.assets_retirement +
    profile.assets_etf +
    profile.assets_stocks +
    profile.assets_crypto;
  const progressPct = plan.targetCapital > 0 ? Math.max(0, (investable / plan.targetCapital) * 100) : 0;


  const [monthly, setMonthly] = useState(retirement.monthlyContribution);
  const [rate, setRate] = useState(retirement.returnAnnualized);
  const [retireAge, setRetireAge] = useState(retirement.retireAge);

  // Sincroniza el simulador cuando el perfil termina de cargar o el usuario edita sus datos.
  useEffect(() => {
    setMonthly(retirement.monthlyContribution);
    setRate(retirement.returnAnnualized);
    setRetireAge(retirement.retireAge);
  }, [retirement.monthlyContribution, retirement.returnAnnualized, retirement.retireAge]);

  const years = Math.max(0, retireAge - retirement.currentAge);
  const data = projectRetirementFrom(monthly, rate, years, retirement.balance, retirement.currentAge);
  const final = data[data.length - 1]!;

  // Escenarios de renta mensual: capital acumulado x rentabilidad anual.
  const capitals = [500_000, 750_000, 1_000_000, 1_200_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
  const rates = [4, 6, 8, 10, 12];

  return (
    <PageShell>
      <PageHeader eyebrow={t("Largo plazo", "Long term")} title={t("Fondo de Retiro", "Retirement Fund")} subtitle={t("Cuánto tienes hoy y cuánto tendrás cuando dejes de trabajar.", "How much you have today and how much you will have when you stop working.")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label={t("Cuánto tengo", "How much I have")}
          value={fmt(investable)}
          hint={t("Sin contar propiedades — solo activos que generan retorno", "Excluding properties — only assets that generate returns")}
          accent
          index={0}
        />
        <KpiCard
          label={t("Capital objetivo", "Target capital")}
          value={fmt(plan.targetCapital)}
          hint={`${fmt(Math.round((plan.targetCapital * (retirement.returnAnnualized / 100)) / 12))} ${t("al mes con", "per month at")} ${retirement.returnAnnualized}%`}
          index={1}
        />
        <KpiCard label={t("Cómo voy", "How I'm doing")} value={`${progressPct.toFixed(1)}%`} hint={t("del capital objetivo", "of target capital")} index={2} />
        <KpiCard label={t("Gastos mensuales", "Monthly expenses")} value={fmt(d.expenses)} hint={`${fmt(d.expenses * 12)} ${t("al año", "per year")}`} index={3} />
        <KpiCard label={t("Aportes estimados al año", "Estimated contributions per year")} value={fmt(retirement.contributionsYTD)} index={4} />
        <KpiCard label={t("Rentabilidad esperada", "Expected return")} value={`${retirement.returnAnnualized}%`} hint={t("anual", "annual")} index={5} />
      </div>

      <div className="surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("Progreso hacia tu capital objetivo", "Progress toward your target capital")}</span>
          <span className="numeric font-semibold">
            {fmt(investable)} / {fmt(plan.targetCapital)}
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-elevated">
          <div className="wealth-gradient h-full rounded-full" style={{ width: `${Math.min(100, progressPct)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("Vas al", "You're at")} {progressPct.toFixed(1)}% · {t("te faltan", "you still need")} {fmt(Math.max(0, plan.targetCapital - investable))} {t("en inversiones que generen retorno.", "in return-generating investments.")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("Proyección hasta el retiro", "Projection to retirement")} description={`${t("Saldo estimado a los", "Estimated balance at")} ${retireAge} ${t("años", "years old")}`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="year" {...axisProps} tickFormatter={(v) => `${v}a`} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={62} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" name={t("Proyección", "Projection")} stroke="var(--color-chart-4)" strokeWidth={2.5} fill="url(#ret)" />
              <Area type="monotone" dataKey="contributed" name={t("Aportado", "Contributed")} stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={t("Simulador", "Simulator")} description={t("Ajusta y mira el impacto", "Adjust and see the impact")}>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("Aporte mensual", "Monthly contribution")}</span>
                <span className="numeric font-semibold">{fmt(monthly)}</span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={Math.max(500, Math.round(d.savings * 2) || 3000)}
                step={50}
                value={[monthly]}
                onValueChange={([v]) => setMonthly(v ?? 0)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("Rentabilidad anual", "Annual return")}</span>
                <span className="numeric font-semibold">{rate}%</span>
              </div>
              <Slider className="mt-3" min={1} max={15} step={0.5} value={[rate]} onValueChange={([v]) => setRate(v ?? 7)} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("Edad de retiro", "Retirement age")}</span>
                <span className="numeric font-semibold">{retireAge} {t("años", "years old")}</span>
              </div>
              <Slider
                className="mt-3"
                min={Math.min(retirement.currentAge + 1, 80)}
                max={85}
                step={1}
                value={[retireAge]}
                onValueChange={([v]) => setRetireAge(v ?? retirement.retireAge)}
              />
            </div>
            <div className="rounded-xl bg-elevated/60 p-4">
              <p className="text-xs text-muted-foreground">{t("Saldo proyectado", "Projected balance")}</p>
              <p className="numeric mt-1 text-2xl font-semibold">{fmt(final.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {final.value >= plan.targetCapital ? t("Superas tu capital objetivo 🎯", "You exceed your target capital 🎯") : `${t("Te faltarían", "You'd still need")} ${fmt(plan.targetCapital - final.value)}`}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title={t("Escenarios: renta mensual según tu capital", "Scenarios: monthly income based on your capital")}
        description={`${t("Cuánto podrías retirar cada mes según el capital acumulado y la rentabilidad anual. En verde, lo que cubre tus gastos de", "How much you could withdraw monthly based on accumulated capital and annual return. In green, what covers your expenses of")} ${fmt(d.expenses)}.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">{t("Capital", "Capital")}</th>
                {rates.map((rr) => (
                  <th key={rr} className="px-3 py-2 text-right font-medium">
                    {rr}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capitals.map((cap) => (
                <tr key={cap} className="border-b border-border/60 last:border-0 hover:bg-elevated/40">
                  <td className="numeric px-3 py-3 text-left font-semibold">{fmt(cap)}</td>
                  {rates.map((rr) => {
                    const inc = (cap * (rr / 100)) / 12;
                    const covers = inc >= d.expenses && d.expenses > 0;
                    return (
                      <td key={rr} className={`numeric px-3 py-3 text-right ${covers ? "font-medium text-positive" : ""}`}>
                        {fmt(Math.round(inc))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("Renta mensual = capital × rentabilidad anual ÷ 12.", "Monthly income = capital × annual return ÷ 12.")}</p>
      </Panel>

      <Panel
        title={t("Simulador de ciudades", "City simulator")}
        description={t("Ingresa tu presupuesto mensual y descubre dónde podrías vivir mejor.", "Enter your monthly budget and discover where you could live better.")}
      >
        <CitySearch defaultBudget={d.expenses} fmt={fmt} t={t} />
      </Panel>
    </PageShell>
  );
}

function CitySearch({ defaultBudget, fmt, t }: { defaultBudget: number; fmt: (v: number) => string; t: (es: string, en: string) => string }) {
  const [budget, setBudget] = useState(defaultBudget || 2000);
  const [query, setQuery] = useState(fmt(defaultBudget || 2000));

  useEffect(() => {
    setBudget(defaultBudget || 2000);
    setQuery(fmt(defaultBudget || 2000));
  }, [defaultBudget]);

  const presets = useMemo(() => {
    const b = defaultBudget || 2000;
    return [
      { label: t("Tus gastos", "Your expenses"), value: b },
      { label: "1.5x", value: Math.round(b * 1.5) },
      { label: "2x", value: Math.round(b * 2) },
      { label: "3x", value: Math.round(b * 3) },
    ];
  }, [defaultBudget, t]);

  const ranked = useMemo(() => {
    if (!budget || budget <= 0) return [];
    const comfort = budget * 0.75;
    return [...cities].sort((a: City, b: City) => {
      // Ciudades dentro del presupuesto van primero, ordenadas por más cara a más barata.
      const aFit = a.cost <= budget;
      const bFit = b.cost <= budget;
      if (aFit && !bFit) return -1;
      if (!aFit && bFit) return 1;
      // Entre las asequibles, priorizamos las que dejan más margen de confort (cerca del 75% del presupuesto).
      if (aFit && bFit) {
        const aScore = Math.abs(a.cost - comfort);
        const bScore = Math.abs(b.cost - comfort);
        return aScore - bScore;
      }
      // Entre las que exceden, las más cercanas al presupuesto primero.
      return a.cost - b.cost;
    });
  }, [budget]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setQuery(raw);
    const n = Number(raw);
    if (!Number.isNaN(n)) setBudget(n);
  };

  const handleBlur = () => {
    setQuery(fmt(budget));
  };

  const badge = (cost: number) => {
    if (cost <= budget * 0.75) return { text: t("Cómodo", "Comfortable"), tone: "bg-positive/15 text-positive" };
    if (cost <= budget) return { text: t("Ajustado", "Tight"), tone: "bg-chart-4/15 text-chart-4" };
    return { text: t("Excede", "Exceeds"), tone: "bg-destructive/15 text-destructive" };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="city-budget" className="text-xs font-medium text-muted-foreground">
            {t("Presupuesto mensual", "Monthly budget")}
          </label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="city-budget"
              type="text"
              inputMode="numeric"
              value={query}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("Ej: 3.000", "E.g: 3,000")}
              className="pl-9 text-base"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setBudget(p.value);
                setQuery(fmt(p.value));
              }}
              className="rounded-full border border-border bg-elevated/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-elevated"
            >
              {p.label}: {fmt(p.value)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ranked.slice(0, 12).map((c: City) => {
          const { text, tone } = badge(c.cost);
          const ratio = Math.min(100, Math.round((c.cost / budget) * 100));
          return (
            <div key={c.name} className="surface flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.country}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>{text}</span>
              </div>
              <div className="mt-3">
                <p className="numeric text-lg font-semibold">{fmt(c.cost)}</p>
                <p className="text-xs text-muted-foreground">{ratio}% {t("de tu presupuesto", "of your budget")}</p>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${ratio}%`, backgroundColor: "var(--color-chart-4)" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {ranked.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("Escribe un presupuesto mensual para ver sugerencias de ciudades.", "Enter a monthly budget to see city suggestions.")}</p>
      )}
    </div>
  );
}
