import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFixedExpenses, useSpendTarget } from "@/hooks/use-fixed-expenses";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { compact, money } from "@/lib/onboarding";
import { getSpendAdvice } from "@/lib/spend-advice.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gastos")({
  head: () => ({
    meta: [
      { title: "Análisis de Gastos — Your north" },
      {
        name: "description",
        content: "Gastos fijos editables y detalle real por categoría desde tus estados de cuenta, con rango de fechas comparable.",
      },
      { property: "og:title", content: "Análisis de Gastos — Your north" },
      {
        property: "og:description",
        content: "Controla tus gastos fijos, explora cada categoría y compara periodos con datos reales de tus EEFF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gastos,
});

const palette = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
];

const presets = [
  { id: "30d", label: "Últimos 30 días", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { id: "month", label: "Este mes", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  {
    id: "prev-month",
    label: "Mes pasado",
    range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }),
  },
  { id: "90d", label: "Últimos 90 días", range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { id: "ytd", label: "Este año", range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

import { categorizeTx } from "@/lib/categorize";

const isExpense = (t: Tx) => t.amount < 0;

const categoryOf = (t: Tx) => categorizeTx(t);

function inRange(t: Tx, from: Date, to: Date) {
  const d = parseISO(t.tx_date!);
  return d >= from && d <= to;
}

function sum(list: Tx[]) {
  return list.reduce((s, t) => s + Math.abs(t.amount), 0);
}

function Gastos() {
  const { profile } = useProfile();
  const currency = profile.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);
  const fmtCompact = (n: number) => compact(n, currency);

  const { transactions, isLoading } = useTransactions();
  const fixed = useFixedExpenses();
  const [range, setRange] = useState<DateRange | undefined>(() => presets[0]!.range());

  const from = range?.from ?? subDays(new Date(), 29);
  const to = range?.to ?? from;
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);

  const expenses = useMemo(() => transactions.filter(isExpense), [transactions]);
  const current = useMemo(() => expenses.filter((t) => inRange(t, from, to)), [expenses, from, to]);
  const previous = useMemo(() => expenses.filter((t) => inRange(t, prevFrom, prevTo)), [expenses, prevFrom, prevTo]);

  const variableTotal = sum(current);
  const prevVariable = sum(previous);
  // gastos fijos prorrateados a los días del periodo
  const fixedInPeriod = (fixed.total / 30) * days;
  const total = variableTotal + fixedInPeriod;
  const prevTotal = prevVariable + fixedInPeriod;
  const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; items: Tx[] }>();
    for (const t of current) {
      const k = categoryOf(t);
      const prev = map.get(k) ?? { name: k, amount: 0, items: [] };
      prev.amount += Math.abs(t.amount);
      prev.items.push(t);
      map.set(k, prev);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [current]);

  const prevByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of previous) {
      const k = categoryOf(t);
      map.set(k, (map.get(k) ?? 0) + Math.abs(t.amount));
    }
    return map;
  }, [previous]);

  // ---- Comparación mes vs mes ----
  const monthKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of expenses) set.add(format(parseISO(t.tx_date!), "yyyy-MM"));
    return [...set].sort().reverse();
  }, [expenses]);

  const [monthA, setMonthA] = useState<string | null>(null);
  const [monthB, setMonthB] = useState<string | null>(null);
  const mA = monthA ?? monthKeys[0] ?? null;
  const mB = monthB ?? monthKeys[1] ?? monthKeys[0] ?? null;

  const monthCompare = useMemo(() => {
    const totalsOf = (key: string | null) => {
      const map = new Map<string, number>();
      let total = 0;
      if (!key) return { map, total };
      for (const t of expenses) {
        if (format(parseISO(t.tx_date!), "yyyy-MM") !== key) continue;
        const k = categoryOf(t);
        const v = Math.abs(t.amount);
        map.set(k, (map.get(k) ?? 0) + v);
        total += v;
      }
      return { map, total };
    };
    const a = totalsOf(mA);
    const b = totalsOf(mB);
    const names = [...new Set([...a.map.keys(), ...b.map.keys()])];
    const rows = names
      .map((name) => ({ name, a: a.map.get(name) ?? 0, b: b.map.get(name) ?? 0 }))
      .sort((x, y) => y.a + y.b - (x.a + x.b));
    return { aTotal: a.total, bTotal: b.total, rows };
  }, [expenses, mA, mB]);

  const monthLabel = (k: string | null) => (k ? format(parseISO(`${k}-01`), "MMMM yyyy", { locale: es }) : "—");
  const monthDelta =
    monthCompare.bTotal > 0 ? ((monthCompare.aTotal - monthCompare.bTotal) / monthCompare.bTotal) * 100 : 0;

  // ---- Gasto objetivo ----
  const { target, setTarget } = useSpendTarget(5000);
  const monthlyRun = fixed.total + (variableTotal / days) * 30;
  const targetPct = target > 0 ? (monthlyRun / target) * 100 : 0;

  // ---- Recomendaciones IA ----
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);




  const series = useMemo(() => {
    const byMonth = days > 62;
    const keyOf = (d: Date) => (byMonth ? format(d, "yyyy-MM") : format(d, "yyyy-MM-dd"));
    const labelOf = (d: Date) => (byMonth ? format(d, "MMM yy", { locale: es }) : format(d, "d MMM", { locale: es }));
    const keys: string[] = [];
    const buckets = new Map<string, { label: string; gasto: number; anterior: number; fijo: number }>();
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      const k = keyOf(d);
      if (!buckets.has(k)) {
        keys.push(k);
        buckets.set(k, { label: labelOf(d), gasto: 0, anterior: 0, fijo: 0 });
      }
    }
    for (const t of current) {
      const b = buckets.get(keyOf(parseISO(t.tx_date!)));
      if (b) b.gasto += Math.abs(t.amount);
    }
    // periodo anterior alineado posición a posición
    const prevKeys: string[] = [];
    const prevBuckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = addDays(prevFrom, i);
      const k = keyOf(d);
      if (!prevBuckets.has(k)) {
        prevKeys.push(k);
        prevBuckets.set(k, 0);
      }
    }
    for (const t of previous) {
      const k = keyOf(parseISO(t.tx_date!));
      if (prevBuckets.has(k)) prevBuckets.set(k, (prevBuckets.get(k) ?? 0) + Math.abs(t.amount));
    }
    keys.forEach((k, i) => {
      const pk = prevKeys[i];
      const b = buckets.get(k)!;
      b.anterior = pk ? (prevBuckets.get(pk) ?? 0) : 0;
      b.fijo = byMonth ? fixed.total : fixed.total / 30;
    });
    return keys.map((k) => buckets.get(k)!);
  }, [current, previous, from, prevFrom, days, fixed.total]);


  const merchants = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number }>();
    for (const t of current) {
      const prev = map.get(t.merchant) ?? { name: t.merchant, amount: 0, count: 0 };
      prev.amount += Math.abs(t.amount);
      prev.count += 1;
      map.set(t.merchant, prev);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [current]);

  const variable = variableTotal;
  const hasData = transactions.length > 0;
  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d MMM yyyy", { locale: es })} — ${format(range.to, "d MMM yyyy", { locale: es })}`
      : "Selecciona un rango";

  const adviceKey = `${rangeLabel}|${variableTotal.toFixed(0)}|${fixed.total}|${target}`;
  const lastAdviceKey = useRef<string | null>(null);

  const runAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      const res = await getSpendAdvice({
        data: {
          currency,
          periodLabel: rangeLabel,
          total,
          prevTotal,
          fixedTotal: fixed.total,
          target,
          monthlyRun,
          categories: byCategory.slice(0, 12).map((c) => ({
            name: c.name,
            amount: c.amount,
            prevAmount: prevByCategory.get(c.name) ?? 0,
          })),
          merchants: merchants.slice(0, 10).map((m) => ({ name: m.name, amount: m.amount, count: m.count })),
        },
      });
      setAdvice(res.advice);
    } catch (e) {
      setAdviceError(e instanceof Error ? e.message : "No pudimos generar las recomendaciones.");
    } finally {
      setAdviceLoading(false);
    }
  };



  useEffect(() => {
    if (!hasData || adviceLoading) return;
    if (lastAdviceKey.current === adviceKey) return;
    lastAdviceKey.current = adviceKey;
    const id = setTimeout(() => void runAdvice(), 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adviceKey, hasData]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Análisis de gastos"
        title="¿En qué se fue mi dinero?"
        subtitle="Tus gastos fijos y todo el detalle real de tus estados de cuenta."
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start gap-2 text-left font-normal">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs md:text-sm">{rangeLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
                {presets.map((p) => (
                  <Button
                    key={p.id}
                    size="sm"
                    variant="secondary"
                    className="h-7 rounded-full text-[11px]"
                    onClick={() => setRange(p.range())}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                locale={es}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        }
      />

      {!hasData && !isLoading && (
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-elevated">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Aún no hay estados de cuenta procesados</p>
              <p className="text-xs text-muted-foreground">Sube tus EEFF en PDF o CSV para ver el detalle real.</p>
            </div>
            <Button asChild className="ml-auto">
              <Link to="/configuracion">Cargar EEFF</Link>
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gasto del periodo" value={fmt(total)} delta={Number(delta.toFixed(1))} hint={`fijos ${fmt(fixedInPeriod)} + variable ${fmt(variableTotal)}`} inverse accent index={0} />
        <KpiCard label="Gastos fijos" value={fmt(fixed.total)} hint="mensual, editable" index={1} />
        <KpiCard label="Gasto variable (EEFF)" value={fmt(variable)} hint={`${current.length} transacciones`} index={2} />
        <KpiCard label="Promedio diario" value={fmt(total / days)} hint={`${days} días`} index={3} />
      </div>

      <Panel
        title="Gasto objetivo mensual"
        description="Tu techo de gasto según tu número; comparado con tu ritmo actual (fijos + variable proyectado a 30 días)"
      >
        <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Objetivo</p>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                value={String(target)}
                onChange={(e) => setTarget(Number(e.target.value) || 0)}
                className="numeric h-11 w-40 text-lg font-semibold"
              />
              <span className="text-xs text-muted-foreground">/mes</span>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="numeric text-2xl font-semibold">{fmt(monthlyRun)}</span>
              <span className="text-xs text-muted-foreground">ritmo mensual estimado</span>
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                  monthlyRun <= target ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
                )}
              >
                {monthlyRun <= target
                  ? `${fmt(target - monthlyRun)} por debajo`
                  : `${fmt(monthlyRun - target)} por encima`}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", monthlyRun <= target ? "bg-positive" : "bg-negative")}
                style={{ width: `${Math.min(100, targetPct)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {targetPct.toFixed(0)}% del objetivo · fijos {fmt(fixed.total)} + variable {fmt((variableTotal / days) * 30)}
            </p>
          </div>
        </div>
      </Panel>



      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Distribución por categoría">
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos en este rango.</p>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={104}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {byCategory.map((c, i) => (
                        <Cell key={c.name} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={fmt} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="numeric text-2xl font-semibold">{fmtCompact(variableTotal)}</p>
                  <p className="text-xs text-muted-foreground">gasto variable</p>
                  <p className={cn("numeric mt-0.5 text-[11px]", delta > 0 ? "text-negative" : "text-positive")}>
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}% vs. periodo anterior
                  </p>
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {byCategory.slice(0, 10).map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                    <span className="truncate text-muted-foreground">{c.name}</span>
                    <span className="numeric ml-auto font-medium">{((c.amount / variableTotal) * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="Evolución del gasto" description={`Comparando con ${format(prevFrom, "d MMM", { locale: es })} — ${format(prevTo, "d MMM yyyy", { locale: es })}`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={series} margin={{ left: -8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
              />
              <Bar dataKey="anterior" name="Periodo anterior" fill="var(--color-muted-foreground)" fillOpacity={0.35} radius={[8, 8, 0, 0]} />
              <Bar dataKey="gasto" name="Este periodo" fill="var(--color-chart-5)" radius={[8, 8, 0, 0]} />
              <Line dataKey="fijo" name="Fijos (prorrateado)" stroke="var(--color-chart-3)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Este periodo", v: fmt(variableTotal) },
              { l: "Periodo anterior", v: fmt(prevVariable) },
              {
                l: "Variación",
                v: `${variableTotal - prevVariable > 0 ? "+" : ""}${fmt(variableTotal - prevVariable)}`,
              },
              { l: "Día más caro", v: series.length ? fmt(Math.max(...series.map((s) => s.gasto))) : "—" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl bg-elevated/60 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{k.l}</p>
                <p className="numeric text-sm font-semibold">{k.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Periodo anterior: <span className="numeric font-medium">{fmt(prevTotal)}</span>
          </p>
        </Panel>
      </div>

      <Panel title="Gastos fijos mensuales" description="Edita nombre y monto; se guardan en este navegador">
        <div className="space-y-2">
          {fixed.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-elevated/60 px-3 py-2">
              <Input
                value={item.name}
                onChange={(e) => fixed.update(item.id, { name: e.target.value })}
                className="h-9 w-full max-w-[260px] border-transparent bg-transparent text-sm font-medium focus-visible:border-border"
              />
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="number"
                  value={String(item.amount)}
                  onChange={(e) => fixed.update(item.id, { amount: Number(e.target.value) || 0 })}
                  className="numeric h-9 w-32 text-right text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-negative"
                  onClick={() => fixed.remove(item.id)}
                  aria-label={`Eliminar ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-full">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-3"
                    style={{ width: `${fixed.total > 0 ? (item.amount / fixed.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" variant="outline" className="gap-2" onClick={fixed.add}>
            <Plus className="h-4 w-4" /> Añadir gasto fijo
          </Button>
          <span className="numeric ml-auto text-sm font-semibold">Total {fmt(fixed.total)}/mes</span>
        </div>
      </Panel>


      <Panel
        title="Comparar mes vs mes"
        description="Elige dos meses de tus EEFF y mira dónde cambió el gasto"
      >
        {monthKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carga tus EEFF para comparar meses.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={mA ?? ""} onValueChange={(v) => setMonthA(v)}>
                <SelectTrigger className="h-9 w-[190px] capitalize">
                  <SelectValue placeholder="Mes A" />
                </SelectTrigger>
                <SelectContent>
                  {monthKeys.map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">
                      {monthLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">vs.</span>
              <Select value={mB ?? ""} onValueChange={(v) => setMonthB(v)}>
                <SelectTrigger className="h-9 w-[190px] capitalize">
                  <SelectValue placeholder="Mes B" />
                </SelectTrigger>
                <SelectContent>
                  {monthKeys.map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">
                      {monthLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span
                className={cn(
                  "ml-auto rounded-full px-2.5 py-1 text-xs font-medium",
                  monthDelta > 0 ? "bg-negative/12 text-negative" : "bg-positive/12 text-positive",
                )}
              >
                {monthDelta > 0 ? "+" : ""}
                {monthDelta.toFixed(1)}% · {fmt(monthCompare.aTotal)} vs {fmt(monthCompare.bTotal)}
              </span>
            </div>

            <div className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthCompare.rows.slice(0, 10)} margin={{ left: -8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" {...axisProps} interval={0} minTickGap={4} />
                  <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
                  <Tooltip content={<ChartTooltip formatter={fmt} />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
                  <Bar dataKey="a" name={monthLabel(mA)} fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="b" name={monthLabel(mB)} fill="var(--color-chart-4)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Detalle por categoría" description="Expande para ver cada gasto del periodo">

        {byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos en este rango de fechas.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {byCategory.map((c, i) => {
              const prev = prevByCategory.get(c.name) ?? 0;
              const variation = prev > 0 ? ((c.amount - prev) / prev) * 100 : null;
              const share = variableTotal > 0 ? (c.amount / variableTotal) * 100 : 0;
              return (
                <AccordionItem key={c.name} value={c.name} className="border-border">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center gap-3 pr-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                      <span className="truncate text-sm font-medium">{c.name}</span>
                      {variation !== null && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            variation > 0 ? "bg-negative/12 text-negative" : "bg-positive/12 text-positive",
                          )}
                        >
                          {variation > 0 ? "+" : ""}
                          {variation.toFixed(0)}%
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{share.toFixed(0)}%</span>
                      <span className="numeric ml-auto text-sm font-semibold">{fmt(c.amount)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="max-h-[320px] space-y-1 overflow-auto pl-6">
                      {c.items
                        .slice()
                        .sort((a, b) => (a.tx_date! < b.tx_date! ? 1 : -1))
                        .map((t) => (
                          <li key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-elevated/60">
                            <span className="w-16 shrink-0 text-xs text-muted-foreground">
                              {format(parseISO(t.tx_date!), "d MMM", { locale: es })}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm">{t.merchant}</p>
                              <p className="truncate text-xs text-muted-foreground">{t.subcategory ?? "Sin subcategoría"}</p>
                            </div>
                            <span className="numeric ml-auto text-sm font-medium">{fmt(Math.abs(t.amount))}</span>
                          </li>
                        ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </Panel>

      <Panel title="Top comercios" description={`${merchants.length} comercios en el periodo`}>
        {merchants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin comercios en este rango.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {merchants.slice(0, 10).map((m) => (
              <li key={m.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.count} transacciones</p>
                </div>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(m.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel
        title="Recomendaciones de la IA"
        description="Las 4 acciones de mayor impacto, generadas automáticamente con tus datos"
        actions={
          <Button size="sm" onClick={runAdvice} disabled={adviceLoading || !hasData}>
            {adviceLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analizando
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Actualizar
              </>
            )}
          </Button>
        }
      >
        {adviceError && <p className="text-sm text-negative">{adviceError}</p>}
        {!advice && !adviceError && (
          <p className="text-sm text-muted-foreground">
            {hasData
              ? "Analizando tus categorías, comercios y tu objetivo de gasto…"
              : "Carga tus EEFF para recibir recomendaciones."}
          </p>
        )}
        {advice && (
          <div className="space-y-1.5 text-sm leading-relaxed">
            {advice
              .split("\n")
              .filter((l) => l.trim())
              .map((line, i) => {
                const clean = line.replace(/^#{1,6}\s*/, "").replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
                if (line.startsWith("#"))
                  return (
                    <p key={i} className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {clean}
                    </p>
                  );
                if (/^[-*]\s/.test(line))
                  return (
                    <p key={i} className="flex gap-2 text-foreground/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{clean}</span>
                    </p>
                  );
                return (
                  <p key={i} className="text-foreground/90">
                    {clean}
                  </p>
                );
              })}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
