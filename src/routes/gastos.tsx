import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { PageHeader, PageShell, Panel } from "@/components/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { categories, fmt, fmtCompact, heatmap, insights, months, topMerchants, totalExpenses } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gastos")({
  head: () => ({
    meta: [
      { title: "Análisis de Gastos — Finance OS" },
      { name: "description", content: "Entiende en qué se fue tu dinero: categorías, comercios, heatmap y comparación de 12 meses." },
      { property: "og:title", content: "Análisis de Gastos — Finance OS" },
      { property: "og:description", content: "Donut por categoría, top comercios, heatmap diario e insights automáticos." },
    ],
  }),
  component: Gastos,
});

function Gastos() {
  const maxHeat = Math.max(...heatmap.map((h) => h.amount));
  const avgHeat = heatmap.reduce((s, h) => s + h.amount, 0) / heatmap.length;
  const worstDays = [...heatmap].sort((a, b) => b.amount - a.amount).slice(0, 3);

  const comparableMonths = months.slice(0, -1);
  const [compareMonth, setCompareMonth] = useState(comparableMonths[comparableMonths.length - 1]!.month);
  const compare = comparableMonths.find((m) => m.month === compareMonth)!;
  const diff = totalExpenses - compare.expenses;
  const diffPct = (diff / compare.expenses) * 100;
  const avgMonths = comparableMonths.reduce((s, m) => s + m.expenses, 0) / comparableMonths.length;
  const vsAvgMonths = ((totalExpenses - avgMonths) / avgMonths) * 100;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Agosto 2026"
        title="¿En qué se fue mi dinero?"
        subtitle={`Gastaste ${fmt(totalExpenses)} distribuidos en ${categories.length} categorías.`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Distribución por categoría">
          <div className="relative">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categories} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={104} paddingAngle={3} stroke="none">
                  {categories.map((c) => (
                    <Cell key={c.key} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="numeric text-2xl font-semibold">{fmtCompact(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">gasto total</p>
              <p className={cn("numeric mt-0.5 text-[11px]", diff > 0 ? "text-negative" : "text-positive")}>
                {diff > 0 ? "+" : ""}
                {diffPct.toFixed(1)}% vs. {compare.label}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-elevated/60 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Comparar con</span>
              <Select value={compareMonth} onValueChange={setCompareMonth}>
                <SelectTrigger className="ml-auto h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...comparableMonths].reverse().map((m) => (
                    <SelectItem key={m.month} value={m.month} className="text-xs">
                      {m.label} {m.month.slice(0, 4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">{compare.label}</p>
                <p className="numeric text-sm font-semibold">{fmt(compare.expenses)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Diferencia</p>
                <p className={cn("numeric text-sm font-semibold", diff > 0 ? "text-negative" : "text-positive")}>
                  {diff > 0 ? "+" : "−"}
                  {fmt(Math.abs(diff))}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Promedio 12 meses {fmt(Math.round(avgMonths))} ·{" "}
              <span className={vsAvgMonths > 0 ? "text-negative" : "text-positive"}>
                {vsAvgMonths > 0 ? "+" : ""}
                {vsAvgMonths.toFixed(1)}% este mes
              </span>
            </p>
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {categories.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="truncate text-muted-foreground">{c.name}</span>
                <span className="numeric ml-auto font-medium">{((c.amount / totalExpenses) * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>

        </Panel>


        <Panel title="Comparación mensual" description="Gasto total últimos 12 meses" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={months} margin={{ left: -12, right: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.35 }} />
              <Bar dataKey="expenses" name="Gastos" fill="var(--color-chart-5)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Heatmap diario"
          description="Pasa el cursor por un día para ver el monto exacto"
          className="lg:col-span-2"
        >
          <TooltipProvider delayDuration={80}>
            <div className="grid grid-cols-7 gap-1.5">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={i} className="text-center text-[10px] text-muted-foreground">
                  {d}
                </span>
              ))}
              {heatmap.map((h) => {
                const vsAvg = ((h.amount - avgHeat) / avgHeat) * 100;
                const isWorst = worstDays.some((w) => w.day === h.day);
                return (
                  <UITooltip key={h.day}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square cursor-pointer rounded-md border border-border/50 transition-transform hover:scale-110",
                          isWorst && "ring-2 ring-negative/70 ring-offset-1 ring-offset-background",
                        )}
                        style={{
                          background: `color-mix(in oklab, var(--color-chart-5) ${(h.amount / maxHeat) * 85 + 6}%, transparent)`,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      className="rounded-2xl border border-border bg-popover/95 px-4 py-3 text-popover-foreground shadow-xl backdrop-blur [&>span]:hidden"
                      sideOffset={8}
                    >
                      <p className="text-sm font-medium">Día {h.day}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-chart-5" />
                        <span className="text-sm text-muted-foreground">Gasto</span>
                        <span className="numeric ml-3 text-base font-semibold">{fmt(h.amount)}</span>
                      </div>
                      <p className={cn("mt-1.5 text-[11px]", vsAvg > 0 ? "text-negative" : "text-positive")}>
                        {vsAvg > 0 ? "+" : ""}
                        {vsAvg.toFixed(0)}% vs. promedio diario ({fmt(Math.round(avgHeat))})
                      </p>
                      {isWorst && <p className="text-[11px] text-warning">Uno de los 3 peores días del mes</p>}
                    </TooltipContent>
                  </UITooltip>
                );
              })}
            </div>
          </TooltipProvider>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Peores días:</span>
            {worstDays.map((w) => (
              <span key={w.day} className="rounded-full bg-negative/12 px-2 py-0.5 text-negative">
                Día {w.day} · <span className="numeric">{fmt(w.amount)}</span>
              </span>
            ))}
          </div>
        </Panel>


        <Panel title="Top comercios">
          <ul className="space-y-2">
            {topMerchants.slice(0, 7).map((m) => (
              <li key={m.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.transactions} transacciones</p>
                </div>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(m.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Detalle por categoría" description="Presupuesto, variación y subcategorías">
        <Accordion type="single" collapsible className="w-full">
          {categories.map((c) => {
            const variation = ((c.amount - c.previous) / c.previous) * 100;
            const budgetUse = (c.amount / c.budget) * 100;
            return (
              <AccordionItem key={c.key} value={c.key} className="border-border">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex w-full items-center gap-3 pr-3">
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px]",
                        variation > 0 ? "bg-negative/12 text-negative" : "bg-positive/12 text-positive",
                      )}
                    >
                      {variation > 0 ? "+" : ""}
                      {variation.toFixed(0)}%
                    </span>
                    <span className="numeric ml-auto text-sm font-semibold">{fmt(c.amount)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-9">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Presupuesto {fmt(c.budget)}</span>
                        <span className={budgetUse > 100 ? "text-negative" : "text-positive"}>{budgetUse.toFixed(0)}% usado</span>
                      </div>
                      <Progress value={Math.min(budgetUse, 100)} className="mt-1.5 h-1.5" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {c.subcategories.map((s) => (
                        <div key={s.name} className="rounded-lg bg-elevated/60 px-3 py-2">
                          <p className="text-xs text-muted-foreground">{s.name}</p>
                          <p className="numeric text-sm font-medium">{fmt(s.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Panel>

      <Panel title="Insights automáticos">
        <div className="grid gap-3 md:grid-cols-2">
          {insights.slice(2, 8).map((i) => (
            <div key={i.title} className="rounded-xl bg-elevated/60 p-4">
              <p
                className={cn(
                  "text-sm font-medium",
                  i.type === "positive" && "text-positive",
                  i.type === "warning" && "text-warning",
                )}
              >
                {i.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{i.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
