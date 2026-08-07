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

  return (
    <PageShell>
      <PageHeader eyebrow="Largo plazo" title="Fondo de Retiro" subtitle="Cuánto tienes hoy y cuánto tendrás cuando dejes de trabajar." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo actual" value={fmt(retirement.balance)} accent index={0} />
        <KpiCard label="Aportes estimados al año" value={fmt(retirement.contributionsYTD)} index={1} />
        <KpiCard label="Rentabilidad esperada" value={`${retirement.returnAnnualized}%`} hint="anual" index={2} />
        <KpiCard label="Capital objetivo" value={fmt(plan.targetCapital)} hint="Your Number" index={3} />
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
    </PageShell>
  );
}
