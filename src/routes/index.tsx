import { createFileRoute } from "@tanstack/react-router";
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
import { Progress } from "@/components/ui/progress";
import { current, fmt, fmtCompact, goals, insights, months, previous, upcomingPayments } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finance OS" },
      { name: "description", content: "Tu situación financiera completa en menos de 30 segundos: patrimonio, ingresos, gastos y ahorro." },
      { property: "og:title", content: "Dashboard — Finance OS" },
      { property: "og:description", content: "Patrimonio neto, flujo libre, tasa de ahorro y metas en un solo panel." },
    ],
  }),
  component: Dashboard,
});

const delta = (a: number, b: number) => ((a - b) / b) * 100;

function Dashboard() {
  const savingsRate = (current.savings / current.income) * 100;
  const prevRate = (previous.savings / previous.income) * 100;
  const freeCash = current.savings - current.investments;
  const prevFree = previous.savings - previous.investments;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Agosto 2026"
        title="Buenas tardes, aquí está tu panorama"
        subtitle="Todo tu patrimonio, flujo e inversiones consolidados en tiempo real."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Patrimonio neto"
          value={fmt(current.netWorth)}
          delta={delta(current.netWorth, previous.netWorth)}
          hint="vs julio"
          icon={Wallet}
          accent
          index={0}
        />
        <KpiCard label="Ingresos" value={fmt(current.income)} delta={delta(current.income, previous.income)} icon={Banknote} index={1} />
        <KpiCard label="Gastos" value={fmt(current.expenses)} delta={delta(current.expenses, previous.expenses)} inverse icon={TrendingUp} index={2} />
        <KpiCard label="Ahorro" value={fmt(current.savings)} delta={delta(current.savings, previous.savings)} icon={PiggyBank} index={3} />
        <KpiCard label="Flujo libre" value={fmt(freeCash)} delta={delta(freeCash, prevFree)} hint="tras inversiones" icon={Waves} index={4} />
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
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="netWorth"
                name="Patrimonio"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                fill="url(#nw)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Próximos pagos" description="Septiembre 2026">
          <ul className="space-y-2">
            {upcomingPayments.map((p) => (
              <li key={p.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2.5">
                <span className="text-lg">{p.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.date}</p>
                </div>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(p.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Total comprometido</span>
            <span className="numeric font-semibold">{fmt(upcomingPayments.reduce((s, p) => s + p.amount, 0))}</span>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Ingresos vs gastos" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={months} margin={{ left: -12, right: 8 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
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
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="savings" name="Ahorro" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Metas activas" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {goals.slice(0, 4).map((g) => {
              const p = Math.min(100, (g.current / g.target) * 100);
              return (
                <div key={g.name} className="rounded-xl bg-elevated/60 p-4">
                  <div className="flex items-center gap-2">
                    <span>{g.emoji}</span>
                    <p className="text-sm font-medium">{g.name}</p>
                    <span className="numeric ml-auto text-xs text-muted-foreground">{p.toFixed(0)}%</span>
                  </div>
                  <Progress value={p} className="mt-3 h-1.5" />
                  <p className="numeric mt-2 text-xs text-muted-foreground">
                    {fmtCompact(g.current)} de {fmtCompact(g.target)}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Insights del mes" description="Generados con IA">
          <ul className="space-y-2.5">
            {insights.slice(0, 4).map((i) => (
              <li key={i.title} className="rounded-xl bg-elevated/60 p-3">
                <p
                  className={
                    i.type === "positive"
                      ? "text-sm font-medium text-positive"
                      : i.type === "warning"
                        ? "text-sm font-medium text-warning"
                        : "text-sm font-medium"
                  }
                >
                  {i.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{i.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
