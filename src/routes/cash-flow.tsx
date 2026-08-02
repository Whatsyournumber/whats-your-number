import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { cashFlow, current, fmt } from "@/lib/data";

export const Route = createFileRoute("/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash Flow — Finance OS" },
      { name: "description", content: "Sankey moderno de tu flujo: ingresos hacia gastos fijos, lifestyle, inversiones y flujo libre." },
      { property: "og:title", content: "Cash Flow — Finance OS" },
      { property: "og:description", content: "Visualiza a dónde fluye cada dólar de tus ingresos cada mes." },
    ],
  }),
  component: CashFlow,
});

function CashFlow() {
  const totalIncome = cashFlow.income.reduce((s, i) => s + i.amount, 0);
  const buckets = cashFlow.buckets;

  return (
    <PageShell>
      <PageHeader eyebrow="Agosto 2026" title="Cash Flow" subtitle="Cómo se reparte cada dólar que entra a tu vida financiera." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ingresos" value={fmt(totalIncome)} delta={7.9} accent index={0} />
        <KpiCard label="Gastos fijos" value={fmt(buckets[0]!.amount)} hint={`${((buckets[0]!.amount / totalIncome) * 100).toFixed(0)}% del ingreso`} index={1} />
        <KpiCard label="Inversiones" value={fmt(buckets[2]!.amount)} delta={15.7} index={2} />
        <KpiCard label="Flujo libre" value={fmt(buckets[3]!.amount)} delta={22.1} index={3} />
      </div>

      <Panel title="Flujo de dinero" description="Ingresos → destino final">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1.3fr)]">
          <div className="space-y-3">
            {cashFlow.income.map((i, idx) => (
              <motion.div
                key={i.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl border border-border bg-elevated/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="numeric text-sm font-semibold">{fmt(i.amount)}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(i.amount / totalIncome) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative hidden h-64 lg:block">
            <svg viewBox="0 0 120 260" className="h-full w-full" preserveAspectRatio="none">
              {buckets.map((b, i) => {
                const y = 30 + i * 66;
                const w = Math.max(6, (b.amount / totalIncome) * 60);
                return (
                  <motion.path
                    key={b.name}
                    d={`M0,130 C60,130 60,${y} 120,${y}`}
                    fill="none"
                    stroke={b.color}
                    strokeWidth={w}
                    strokeOpacity={0.35}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="space-y-3">
            {buckets.map((b, idx) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="rounded-2xl border border-border bg-elevated/60 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="numeric ml-auto text-sm font-semibold">{fmt(b.amount)}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.amount / totalIncome) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: b.color }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {((b.amount / totalIncome) * 100).toFixed(0)}% de tus ingresos
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Regla 50 / 30 / 20">
          <div className="space-y-3 text-sm">
            <Row label="Necesidades" value={buckets[0]!.amount} total={totalIncome} target={50} />
            <Row label="Deseos" value={buckets[1]!.amount} total={totalIncome} target={30} />
            <Row label="Ahorro e inversión" value={buckets[2]!.amount + buckets[3]!.amount} total={totalIncome} target={20} />
          </div>
        </Panel>
        <Panel title="Runway" description="Meses cubiertos con tu efectivo">
          <p className="numeric text-4xl font-semibold text-primary">4.8</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Con {fmt(42600)} en efectivo y un gasto medio de {fmt(current.expenses)} al mes.
          </p>
        </Panel>
        <Panel title="Eficiencia del flujo">
          <p className="numeric text-4xl font-semibold">{(((buckets[2]!.amount + buckets[3]!.amount) / totalIncome) * 100).toFixed(0)}%</p>
          <p className="mt-2 text-xs text-muted-foreground">
            De cada dólar que ganas, esa porción termina construyendo patrimonio.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}

function Row({ label, value, total, target }: { label: string; value: number; total: number; target: number }) {
  const p = (value / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="numeric">
          {p.toFixed(0)}% <span className="text-xs text-muted-foreground">/ {target}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
    </div>
  );
}
