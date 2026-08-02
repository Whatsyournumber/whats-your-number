import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { benchmark, fmt, holdings } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portafolio")({
  head: () => ({
    meta: [
      { title: "Portafolio — Finance OS" },
      { name: "description", content: "ETFs, acciones, cripto y cash con costo promedio, rentabilidad, dividendos y benchmark." },
      { property: "og:title", content: "Portafolio — Finance OS" },
      { property: "og:description", content: "Rentabilidad de tu portafolio comparada contra el S&P 500." },
    ],
  }),
  component: Portafolio,
});

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

function Portafolio() {
  const enriched = holdings.map((h) => {
    const value = h.units * h.price;
    const cost = h.units * h.avgCost;
    return { ...h, value, cost, gain: value - cost, ret: cost ? ((value - cost) / cost) * 100 : 0 };
  });

  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalCost = enriched.reduce((s, h) => s + h.cost, 0);
  const totalGain = totalValue - totalCost;
  const dividends = enriched.reduce((s, h) => s + h.dividends, 0);

  const types = ["ETF", "Acción", "Cripto", "Cash"] as const;
  const allocation = types.map((t, i) => ({
    name: t,
    value: enriched.filter((h) => h.type === t).reduce((s, h) => s + h.value, 0),
    color: chartColors[i]!,
  }));

  const rows = (list: typeof enriched) => (
    <div className="space-y-2">
      {list.map((h) => (
        <div key={h.ticker} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-elevated/60 p-3 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <p className="text-sm font-medium">{h.ticker}</p>
            <p className="truncate text-xs text-muted-foreground">{h.name}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Valor</p>
            <p className="numeric text-sm">{fmt(h.value)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Costo prom.</p>
            <p className="numeric text-sm">{fmt(h.avgCost, 2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Ganancia</p>
            <p className={cn("numeric text-sm", h.gain >= 0 ? "text-positive" : "text-negative")}>{fmt(h.gain)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Rentabilidad</p>
            <p className={cn("numeric text-sm font-semibold", h.ret >= 0 ? "text-positive" : "text-negative")}>
              {h.ret > 0 ? "+" : ""}
              {h.ret.toFixed(1)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <PageShell>
      <PageHeader eyebrow="Inversiones" title="Portafolio" subtitle="Rendimiento consolidado de tus posiciones frente al mercado." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Valor actual" value={fmt(totalValue)} delta={5.8} accent index={0} />
        <KpiCard label="Costo invertido" value={fmt(totalCost)} index={1} />
        <KpiCard label="Ganancia total" value={fmt(totalGain)} delta={(totalGain / totalCost) * 100} index={2} />
        <KpiCard label="Dividendos 12m" value={fmt(dividends)} delta={12.4} index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Portafolio vs S&P 500" description="Rentabilidad acumulada 12 meses" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={benchmark} margin={{ left: -18, right: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={46} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
              <Line type="monotone" dataKey="portfolio" name="Portafolio" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Composición">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3} stroke="none">
                {allocation.map((a) => (
                  <Cell key={a.name} fill={a.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-3 space-y-1.5">
            {allocation.map((a) => (
              <li key={a.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                <span className="text-muted-foreground">{a.name}</span>
                <span className="numeric ml-auto font-medium">{((a.value / totalValue) * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Posiciones">
        <Tabs defaultValue="Todos">
          <TabsList className="mb-4">
            <TabsTrigger value="Todos">Todos</TabsTrigger>
            {types.map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Todos">{rows(enriched)}</TabsContent>
          {types.map((t) => (
            <TabsContent key={t} value={t}>
              {rows(enriched.filter((h) => h.type === t))}
            </TabsContent>
          ))}
        </Tabs>
      </Panel>
    </PageShell>
  );
}
