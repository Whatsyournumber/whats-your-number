import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, PiggyBank, TrendingUp, Wallet, Waves } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/use-profile";
import { buildInsights } from "@/lib/onboarding";
import { buildDataset } from "@/lib/profile-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Your north" },
      { name: "description", content: "Tu situación financiera completa en menos de 30 segundos: patrimonio, ingresos, gastos y ahorro." },
      { property: "og:title", content: "Dashboard — Your north" },
      { property: "og:description", content: "Patrimonio neto, flujo libre, tasa de ahorro y metas en un solo panel." },
    ],
  }),
  component: Dashboard,
});

const delta = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function Dashboard() {
  const { profile, isLoading } = useProfile();
  const d = buildDataset(profile);
  const { current, previous, months, fmt, fmtCompact, plan } = d;

  const freeCash = Math.max(0, current.savings - current.investments);
  const prevFree = Math.max(0, previous.savings - previous.investments);
  const savingsRate = current.income > 0 ? (current.savings / current.income) * 100 : 0;
  const prevRate = previous.income > 0 ? (previous.savings / previous.income) * 100 : 0;
  const insights = buildInsights(plan, profile, profile, d.currency);
  const firstName = (profile.full_name || "").trim().split(" ")[0];

  return (
    <PageShell>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("es", { month: "long", year: "numeric" })}
        title={firstName ? `${greeting()} ${firstName}` : greeting()}
        subtitle="Tus números reales, calculados desde tu perfil financiero."
      />

      {!isLoading && !d.hasData && (
        <div className="surface flex flex-wrap items-center gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            Aún no tenemos tus cifras. Completa o edita tu perfil para que toda la app se recalcule.
          </p>
          <Button asChild size="sm" className="ml-auto rounded-full">
            <Link to="/mi-perfil">Editar mis datos</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Patrimonio neto"
          value={fmt(current.netWorth)}
          delta={delta(current.netWorth, previous.netWorth)}
          hint="vs mes anterior"
          icon={Wallet}
          accent
          index={0}
        />
        <KpiCard label="Ingresos" value={fmt(current.income)} delta={delta(current.income, previous.income)} icon={Banknote} index={1} />
        <KpiCard label="Gastos" value={fmt(current.expenses)} delta={delta(current.expenses, previous.expenses)} inverse icon={TrendingUp} index={2} />
        <KpiCard label="Ahorro" value={fmt(current.savings)} delta={delta(current.savings, previous.savings)} icon={PiggyBank} index={3} />
        <KpiCard
          label="Flujo libre"
          value={fmt(freeCash)}
          {...(prevFree > 0 ? { delta: delta(freeCash, prevFree) } : {})}
          hint="tras inversiones"
          icon={Waves}
          index={4}
        />
        <KpiCard label="Tasa de ahorro" value={`${savingsRate.toFixed(0)}%`} delta={savingsRate - prevRate} icon={ArrowUpRight} index={5} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Evolución del patrimonio" description="Últimos 12 meses" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={months} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="netWorth" name="Patrimonio" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#nw)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Tu Norte" description={`Libertad estimada a los ${plan.freedomAge} años`}>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Your Number</p>
              <p className="numeric mt-1 text-2xl font-semibold">{fmt(plan.targetCapital)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Para vivir con {fmt(plan.desiredIncome)} al mes
              </p>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progreso</span>
                <span className="numeric font-medium">{plan.progress.toFixed(1)}%</span>
              </div>
              <Progress value={plan.progress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-elevated/60 p-3">
                <p className="text-xs text-muted-foreground">Años restantes</p>
                <p className="numeric mt-1 text-lg font-semibold">{plan.yearsLeft}</p>
              </div>
              <div className="rounded-xl bg-elevated/60 p-3">
                <p className="text-xs text-muted-foreground">Probabilidad</p>
                <p className="numeric mt-1 text-lg font-semibold">{plan.probability}%</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full rounded-full">
              <Link to="/mi-perfil">Editar mis datos</Link>
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Ingresos vs gastos" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={months} margin={{ left: -12, right: 8 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.35 }} />
              <Bar dataKey="income" name="Ingresos" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Gastos" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Evolución del ahorro">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={months} margin={{ left: -12, right: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="savings" name="Ahorro" stroke="var(--color-chart-4)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Tus objetivos" description="Calculados con tus cifras">
          <ul className="space-y-3">
            {d.goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
              return (
                <li key={g.name}>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{g.emoji}</span>
                    <span className="font-medium">{g.name}</span>
                    <span className="numeric ml-auto text-xs text-muted-foreground">
                      {fmtCompact(g.current)} / {fmtCompact(g.target)}
                    </span>
                  </div>
                  <Progress value={pct} className="mt-2 h-1.5" />
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Insights" description="Generados con tu plan">
          <ul className="space-y-2">
            {insights.map((text) => (
              <li key={text} className="rounded-xl bg-elevated/60 p-3 text-sm text-muted-foreground">
                {text}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
