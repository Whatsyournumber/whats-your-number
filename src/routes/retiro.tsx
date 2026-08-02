import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Slider } from "@/components/ui/slider";
import { fmt, fmtCompact, projectRetirement, retirement } from "@/lib/data";

export const Route = createFileRoute("/retiro")({
  head: () => ({
    meta: [
      { title: "Fondo de Retiro — Finance OS" },
      { name: "description", content: "Saldo, aportes, rentabilidad anual y simulador de proyección de tu fondo de retiro." },
      { property: "og:title", content: "Fondo de Retiro — Finance OS" },
      { property: "og:description", content: "Proyecta tu retiro ajustando aporte mensual, rentabilidad y edad objetivo." },
    ],
  }),
  component: Retiro,
});

function Retiro() {
  const [monthly, setMonthly] = useState(retirement.monthlyContribution);
  const [rate, setRate] = useState(retirement.returnAnnualized);
  const [retireAge, setRetireAge] = useState(retirement.retireAge);

  const years = retireAge - retirement.currentAge;
  const data = projectRetirement(monthly, rate, years, retirement.balance);
  const final = data[data.length - 1]!;

  return (
    <PageShell>
      <PageHeader eyebrow="Largo plazo" title="Fondo de Retiro" subtitle="Cuánto tienes hoy y cuánto tendrás cuando dejes de trabajar." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo actual" value={fmt(retirement.balance)} delta={2.4} accent index={0} />
        <KpiCard label="Aportes del año" value={fmt(retirement.contributionsYTD + retirement.employerYTD)} hint="incl. empleador" index={1} />
        <KpiCard label="Rentabilidad YTD" value={`${retirement.returnYTD}%`} delta={1.8} index={2} />
        <KpiCard label="Rentabilidad anualizada" value={`${retirement.returnAnnualized}%`} hint="últimos 5 años" index={3} />
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
              <Slider className="mt-3" min={200} max={5000} step={100} value={[monthly]} onValueChange={(v) => setMonthly(v[0]!)} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rentabilidad anual</span>
                <span className="numeric font-semibold">{rate.toFixed(1)}%</span>
              </div>
              <Slider className="mt-3" min={1} max={12} step={0.5} value={[rate]} onValueChange={(v) => setRate(v[0]!)} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Edad de retiro</span>
                <span className="numeric font-semibold">{retireAge} años</span>
              </div>
              <Slider className="mt-3" min={45} max={75} step={1} value={[retireAge]} onValueChange={(v) => setRetireAge(v[0]!)} />
            </div>

            <div className="rounded-xl bg-elevated/70 p-4">
              <p className="text-xs text-muted-foreground">Saldo proyectado</p>
              <p className="numeric mt-1 text-2xl font-semibold text-primary">{fmt(final.value)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Aportado {fmtCompact(final.contributed)} · Rentabilidad {fmtCompact(final.value - final.contributed)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Retiro mensual estimado (regla 4%): <span className="numeric text-foreground">{fmt((final.value * 0.04) / 12)}</span>
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
