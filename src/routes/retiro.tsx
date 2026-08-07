import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Slider } from "@/components/ui/slider";
import { useProfile } from "@/hooks/use-profile";
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
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const { retirement, fmt, fmtCompact, plan } = d;

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

  // Matriz de escenarios: aporte mensual x rentabilidad anual.
  const base = Math.max(100, Math.round((monthly || 200) / 50) * 50);
  const contributions = [base * 0.5, base, base * 1.5, base * 2, base * 3].map((v) => Math.round(v / 50) * 50);
  const rates = [4, 6, 8, 10, 12];
  const futureValue = (m: number, annual: number) => {
    const r = annual / 100 / 12;
    const n = years * 12;
    return retirement.balance * Math.pow(1 + r, n) + (r === 0 ? m * n : m * ((Math.pow(1 + r, n) - 1) / r));
  };
  // Renta mensual sostenible con la regla del 4%.
  const monthlyIncomeFrom = (capital: number) => (capital * 0.04) / 12;


  return (
    <PageShell>
      <PageHeader eyebrow="Largo plazo" title="Fondo de Retiro" subtitle="Cuánto tienes hoy y cuánto tendrás cuando dejes de trabajar." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Cuánto tengo"
          value={fmt(retirement.balance)}
          hint={`${(plan.targetCapital > 0 ? Math.min(100, (retirement.balance / plan.targetCapital) * 100) : 0).toFixed(1)}% de la meta`}
          accent
          index={0}
        />
        <KpiCard label="Gastos mensuales" value={fmt(d.expenses)} hint={`${fmt(d.expenses * 12)} al año`} index={1} />
        <KpiCard label="Aportes estimados al año" value={fmt(retirement.contributionsYTD)} index={2} />
        <KpiCard label="Rentabilidad esperada" value={`${retirement.returnAnnualized}%`} hint="anual" index={3} />
        <KpiCard
          label="Capital objetivo"
          value={fmt(plan.targetCapital)}
          hint={`${fmt(Math.round((plan.targetCapital * (retirement.returnAnnualized / 100)) / 12))} al mes con ${retirement.returnAnnualized}%`}
          index={4}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Proyección hasta el retiro" description={`Saldo estimado a los ${retireAge} años`} className="lg:col-span-2">
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
              <Area type="monotone" dataKey="value" name="Proyección" stroke="var(--color-chart-4)" strokeWidth={2.5} fill="url(#ret)" />
              <Area type="monotone" dataKey="contributed" name="Aportado" stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Simulador" description="Ajusta y mira el impacto">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aporte mensual</span>
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
                <span className="text-muted-foreground">Rentabilidad anual</span>
                <span className="numeric font-semibold">{rate}%</span>
              </div>
              <Slider className="mt-3" min={1} max={15} step={0.5} value={[rate]} onValueChange={([v]) => setRate(v ?? 7)} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Edad de retiro</span>
                <span className="numeric font-semibold">{retireAge} años</span>
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
              <p className="text-xs text-muted-foreground">Saldo proyectado</p>
              <p className="numeric mt-1 text-2xl font-semibold">{fmt(final.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {final.value >= plan.targetCapital ? "Superas tu capital objetivo 🎯" : `Te faltarían ${fmt(plan.targetCapital - final.value)}`}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Escenarios: cuánto tendrías según lo que aportes"
        description={`En ${years} años (a los ${retireAge}). Cada celda muestra el capital final y, debajo, la renta mensual que te daría (regla del 4%). En verde, la que cubre tus gastos de ${fmt(d.expenses)}.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Aporte mensual</th>
                {rates.map((rr) => (
                  <th key={rr} className="px-3 py-2 text-right font-medium">
                    {rr}% anual
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c} className="border-b border-border/60 last:border-0 hover:bg-elevated/40">
                  <td className="numeric px-3 py-3 text-left font-semibold">
                    {fmt(c)}
                    {c === base && <span className="ml-2 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] text-primary">actual</span>}
                  </td>
                  {rates.map((rr) => {
                    const cap = futureValue(c, rr);
                    const inc = monthlyIncomeFrom(cap);
                    const covers = inc >= d.expenses && d.expenses > 0;
                    return (
                      <td key={rr} className="px-3 py-3 text-right">
                        <span className={`numeric block font-medium ${covers ? "text-positive" : ""}`}>{fmtCompact(cap)}</span>
                        <span className="numeric block text-xs text-muted-foreground">{fmt(Math.round(inc))}/mes</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>

  );
}
