import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { assetGroups, fmt, fmtCompact, months, netWorth, totalAssets, totalLiabilities } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimonio — Finance OS" },
      { name: "description", content: "Activos, pasivos, asset allocation y crecimiento de tu patrimonio neto." },
      { property: "og:title", content: "Patrimonio — Finance OS" },
      { property: "og:description", content: "Efectivo, bancos, AFP, ETFs, cripto, propiedades e hipotecas consolidados." },
    ],
  }),
  component: Patrimonio,
});

function Patrimonio() {
  const assets = assetGroups.filter((g) => g.kind === "asset");
  const liabilities = assetGroups.filter((g) => g.kind === "liability");

  return (
    <PageShell>
      <PageHeader eyebrow="Balance" title="Patrimonio" subtitle="Todo lo que tienes y lo que debes, en una sola vista." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Patrimonio neto" value={fmt(netWorth)} delta={3.5} accent index={0} />
        <KpiCard label="Activos" value={fmt(totalAssets)} delta={3.9} index={1} />
        <KpiCard label="Pasivos" value={fmt(totalLiabilities)} delta={-1.1} inverse index={2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Crecimiento del patrimonio" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={months} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="netWorth" name="Patrimonio" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#pw)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Asset allocation">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={assets} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                {assets.map((a) => (
                  <Cell key={a.name} fill={a.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {assets.map((a) => (
              <li key={a.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                <span className="truncate text-muted-foreground">{a.name}</span>
                <span className="numeric ml-auto font-medium">{((a.value / totalAssets) * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Activos" description={fmt(totalAssets)}>
          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.name} className="rounded-xl bg-elevated/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                  <p className="text-sm font-medium">{a.name}</p>
                  <span className={cn("ml-auto text-xs", a.change >= 0 ? "text-positive" : "text-negative")}>
                    {a.change > 0 ? "+" : ""}
                    {a.change}%
                  </span>
                  <span className="numeric w-24 text-right text-sm font-semibold">{fmt(a.value)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 pl-4">
                  {a.items.map((i) => (
                    <span key={i.name} className="rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      {i.name} · <span className="numeric">{fmtCompact(i.value)}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pasivos" description={fmt(totalLiabilities)}>
          <div className="space-y-2">
            {liabilities.map((l) => (
              <div key={l.name} className="rounded-xl bg-elevated/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-negative" />
                  <p className="text-sm font-medium">{l.name}</p>
                  <span className="ml-auto text-xs text-positive">{l.change}%</span>
                  <span className="numeric w-24 text-right text-sm font-semibold">{fmt(l.value)}</span>
                </div>
                <div className="mt-2 pl-4 text-[11px] text-muted-foreground">
                  {l.items.map((i) => i.name).join(" · ")}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border p-4">
            <p className="text-xs text-muted-foreground">Ratio deuda / activos</p>
            <p className="numeric mt-1 text-2xl font-semibold">{((totalLiabilities / totalAssets) * 100).toFixed(1)}%</p>
            <p className="mt-1 text-xs text-positive">Saludable — bajo el 40% recomendado</p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
