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
import { categorizeTx } from "@/lib/categorize";
import { useT } from "@/hooks/use-language";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useFixedExpenses, useSpendTarget } from "@/hooks/use-fixed-expenses";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { compact, money } from "@/lib/onboarding";
import { getSpendAdvice } from "@/lib/spend-advice.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gastos")({
  head: () => ({
    meta: [
      { title: "Análisis de Gastos — WhatsYournumber" },
      {
        name: "description",
        content: "Gastos fijos editables y detalle real por categoría desde tus estados de cuenta, con rango de fechas comparable.",
      },
      { property: "og:title", content: "Análisis de Gastos — WhatsYournumber" },
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

function buildPresets(t: (es: string, en: string) => string) {
  return [
    { id: "30d", label: t("Últimos 30 días", "Last 30 days"), range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { id: "month", label: t("Este mes", "This month"), range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    {
      id: "prev-month",
      label: t("Mes pasado", "Last month"),
      range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }),
    },
    { id: "90d", label: t("Últimos 90 días", "Last 90 days"), range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
    { id: "ytd", label: t("Este año", "This year"), range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  ];
}

const isExpense = (t: Tx) => t.amount < 0;

function inRange(t: Tx, from: Date, to: Date) {
  const d = parseISO(t.tx_date!);
  return d >= from && d <= to;
}

function sum(list: Tx[]) {
  return list.reduce((s, t) => s + Math.abs(t.amount), 0);
}

function Gastos() {
  const t = useT();
  const presets = useMemo(() => buildPresets(t), [t]);
  const { profile } = useProfile();
  const currency = profile.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);
  const fmtCompact = (n: number) => compact(n, currency);

  const { transactions, isLoading } = useTransactions();
  const fixed = useFixedExpenses();
  const categories = useCategories();
  const categoryOf = (t: Tx) => categorizeTx(t, categories.rules);
  const [range, setRange] = useState<DateRange | undefined>(() => buildPresets(t)[0]!.range());

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
  }, [current, categories.rules]);

  const prevByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of previous) {
      const k = categoryOf(t);
      map.set(k, (map.get(k) ?? 0) + Math.abs(t.amount));
    }
    return map;
  }, [previous, categories.rules]);

  // Todas las categorías (base + propias) siempre visibles en el detalle
  const detailRows = useMemo(() => {
    const map = new Map(byCategory.map((c) => [c.name, c]));
    const ordered: { name: string; amount: number; items: Tx[] }[] = [];
    for (const name of categories.names) {
      ordered.push(map.get(name) ?? { name, amount: 0, items: [] });
      map.delete(name);
    }
    return [...ordered, ...map.values()].sort((a, b) => b.amount - a.amount);
  }, [byCategory, categories.names]);


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
  }, [expenses, mA, mB, categories.rules]);

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
      : t("Selecciona un rango", "Select a range");

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
      setAdviceError(e instanceof Error ? e.message : t("No pudimos generar las recomendaciones.", "We couldn't generate recommendations."));
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
        eyebrow={t("Análisis de gastos", "Spending analysis")}
        title={t("¿En qué se fue mi dinero?", "Where did my money go?")}
        subtitle={t("Tus gastos fijos y todo el detalle real de tus estados de cuenta.", "Your fixed expenses and the full real detail from your statements.")}
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
              <p className="text-sm font-medium">{t("Aún no hay estados de cuenta procesados", "No statements processed yet")}</p>
              <p className="text-xs text-muted-foreground">{t("Sube tus EEFF en PDF o CSV para ver el detalle real.", "Upload your statements as PDF or CSV to see the real detail.")}</p>
            </div>
            <Button asChild className="ml-auto">
              <Link to="/configuracion">{t("Cargar EEFF", "Upload statements")}</Link>
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("Gasto del periodo", "Period spend")} value={fmt(total)} delta={Number(delta.toFixed(1))} hint={`${t("fijos", "fixed")} ${fmt(fixedInPeriod)} + ${t("variable", "variable")} ${fmt(variableTotal)}`} inverse accent index={0} />
        <KpiCard label={t("Gastos fijos", "Fixed expenses")} value={fmt(fixed.total)} hint={t("mensual, editable", "monthly, editable")} index={1} />
        <KpiCard label={t("Gasto variable (EEFF)", "Variable spend (statements)")} value={fmt(variable)} hint={`${current.length} ${t("transacciones", "transactions")}`} index={2} />
        <KpiCard label={t("Promedio diario", "Daily average")} value={fmt(total / days)} hint={`${days} ${t("días", "days")}`} index={3} />
      </div>

      <Panel
        title={t("Gasto objetivo mensual", "Monthly spend target")}
        description={t("Tu techo de gasto según tu número; comparado con tu ritmo actual (fijos + variable proyectado a 30 días)", "Your spending ceiling based on your number, compared to your current pace (fixed + variable projected over 30 days)")}
      >
        <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t("Objetivo", "Target")}</p>
            <div className="mt-2 flex items-center gap-2">
              <NumberInput
                value={target}
                onChange={setTarget}
                className="h-11 w-40 text-lg font-semibold"
              />
              <span className="text-xs text-muted-foreground">{t("/mes", "/mo")}</span>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="numeric text-2xl font-semibold">{fmt(monthlyRun)}</span>
              <span className="text-xs text-muted-foreground">{t("ritmo mensual estimado", "estimated monthly pace")}</span>
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                  monthlyRun <= target ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
                )}
              >
                {monthlyRun <= target
                  ? `${fmt(target - monthlyRun)} ${t("por debajo", "under")}`
                  : `${fmt(monthlyRun - target)} ${t("por encima", "over")}`}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", monthlyRun <= target ? "bg-positive" : "bg-negative")}
                style={{ width: `${Math.min(100, targetPct)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {targetPct.toFixed(0)}% {t("del objetivo", "of target")} · {t("fijos", "fixed")} {fmt(fixed.total)} + {t("variable", "variable")} {fmt((variableTotal / days) * 30)}
            </p>
          </div>
        </div>
      </Panel>



      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("Distribución por categoría", "Spend by category")}>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Sin movimientos en este rango.", "No transactions in this range.")}</p>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={78}
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
                  <p className="text-xs text-muted-foreground">{t("gasto variable", "variable spend")}</p>
                  <p className={cn("numeric mt-0.5 text-[11px]", delta > 0 ? "text-negative" : "text-positive")}>
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}% {t("vs. periodo anterior", "vs. previous period")}
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

        <Panel title={t("Evolución del gasto", "Spend evolution")} description={`${t("Comparando con", "Comparing with")} ${format(prevFrom, "d MMM", { locale: es })} — ${format(prevTo, "d MMM yyyy", { locale: es })}`} className="lg:col-span-2">
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
              <Bar dataKey="anterior" name={t("Periodo anterior", "Previous period")} fill="var(--color-muted-foreground)" fillOpacity={0.35} radius={[8, 8, 0, 0]} />
              <Bar dataKey="gasto" name={t("Este periodo", "This period")} fill="var(--color-chart-5)" radius={[8, 8, 0, 0]} />
              <Line dataKey="fijo" name={t("Fijos (prorrateado)", "Fixed (prorated)")} stroke="var(--color-chart-3)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: t("Este periodo", "This period"), v: fmt(variableTotal) },
              { l: t("Periodo anterior", "Previous period"), v: fmt(prevVariable) },
              {
                l: t("Variación", "Change"),
                v: `${variableTotal - prevVariable > 0 ? "+" : ""}${fmt(variableTotal - prevVariable)}`,
              },
              { l: t("Día más caro", "Most expensive day"), v: series.length ? fmt(Math.max(...series.map((s) => s.gasto))) : "—" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl bg-elevated/60 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{k.l}</p>
                <p className="numeric text-sm font-semibold">{k.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Periodo anterior", "Previous period")}: <span className="numeric font-medium">{fmt(prevTotal)}</span>
          </p>
        </Panel>
      </div>

      <Panel title={t("Gastos fijos mensuales", "Monthly fixed expenses")} description={t("Edita nombre y monto; se guardan en este navegador", "Edit name and amount; saved in this browser")}>
        <div className="space-y-2">
          {fixed.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-elevated/60 px-3 py-2">
              <Input
                value={item.name}
                onChange={(e) => fixed.update(item.id, { name: e.target.value })}
                className="h-9 w-full max-w-[260px] border-transparent bg-transparent text-sm font-medium focus-visible:border-border"
              />
              <div className="ml-auto flex items-center gap-2">
                <NumberInput
                  value={item.amount}
                  onChange={(v) => fixed.update(item.id, { amount: v })}
                  className="h-9 w-32 text-right text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-negative"
                  onClick={() => fixed.remove(item.id)}
                  aria-label={`${t("Eliminar", "Delete")} ${item.name}`}
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
            <Plus className="h-4 w-4" /> {t("Añadir gasto fijo", "Add fixed expense")}
          </Button>
          <span className="numeric ml-auto text-sm font-semibold">{t("Total", "Total")} {fmt(fixed.total)}{t("/mes", "/mo")}</span>
        </div>
      </Panel>







      <Panel
        title={t("Comparar mes vs mes", "Compare month vs month")}
        description={t("Elige dos meses de tus EEFF y mira dónde cambió el gasto", "Pick two months from your statements and see where spend changed")}
      >
        {monthKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Carga tus EEFF para comparar meses.", "Upload your statements to compare months.")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={mA ?? ""} onValueChange={(v) => setMonthA(v)}>
                <SelectTrigger className="h-9 w-[190px] capitalize">
                  <SelectValue placeholder={t("Mes A", "Month A")} />
                </SelectTrigger>
                <SelectContent>
                  {monthKeys.map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">
                      {monthLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{t("vs.", "vs.")}</span>
              <Select value={mB ?? ""} onValueChange={(v) => setMonthB(v)}>
                <SelectTrigger className="h-9 w-[190px] capitalize">
                  <SelectValue placeholder={t("Mes B", "Month B")} />
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

      <Panel
        title={t("Detalle por categoría", "Detail by category")}
        description={t("Mercado, Restaurantes, Salidas, Compras, Viajes, Transporte, Lifestyle, Apps y Marketing digital. Añade las tuyas con palabras clave.", "Groceries, Restaurants, Nightlife, Shopping, Travel, Transport, Lifestyle, Apps and Digital marketing. Add your own with keywords.")}
      >
        <Accordion type="single" collapsible className="w-full">
          {detailRows.map((c, i) => {
            const prev = prevByCategory.get(c.name) ?? 0;
            const variation = prev > 0 ? ((c.amount - prev) / prev) * 100 : null;
            
            return (
              <AccordionItem key={c.name} value={c.name} className="border-border">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex w-full items-center gap-3 pr-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                    <span className="truncate text-sm font-medium">{c.name}</span>
                    <span className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">
                      {c.items.length} {c.items.length === 1 ? t("mov.", "tx") : t("movs.", "txs")}
                    </span>
                    {variation !== null && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
                          variation > 0 ? "bg-negative/12 text-negative" : "bg-positive/12 text-positive",
                        )}
                        title={t("vs mes anterior", "vs last month")}
                      >
                        {variation > 0 ? "+" : ""}
                        {variation.toFixed(0)}%
                      </span>
                    )}

                    <span className="numeric ml-auto text-sm font-semibold">{fmt(c.amount)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {c.items.length === 0 ? (
                    <p className="pl-6 text-sm text-muted-foreground">{t("Sin gastos de esta categoría en el periodo.", "No expenses in this category for the period.")}</p>
                  ) : (
                    <ul className="max-h-[320px] space-y-1 overflow-auto pl-6">
                      {c.items
                        .slice()
                        .sort((a, b) => (a.tx_date! < b.tx_date! ? 1 : -1))
                        .map((tx) => (
                          <li key={tx.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-elevated/60">
                            <span className="w-16 shrink-0 text-xs text-muted-foreground">
                              {format(parseISO(tx.tx_date!), "d MMM", { locale: es })}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm">{tx.merchant}</p>
                              <p className="truncate text-xs text-muted-foreground">{tx.subcategory ?? t("Sin subcategoría", "No subcategory")}</p>
                            </div>
                            <span className="numeric ml-auto text-sm font-medium">{fmt(Math.abs(tx.amount))}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground">{t("Categorías propias", "Your own categories")}</p>
          {categories.items.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-elevated/60 px-3 py-2">
              <Input
                value={c.name}
                onChange={(e) => categories.update(c.id, { name: e.target.value })}
                placeholder={t("Nombre de la categoría", "Category name")}
                className="h-9 w-full max-w-[220px] border-transparent bg-transparent text-sm font-medium focus-visible:border-border"
              />
              <Input
                value={c.keywords}
                onChange={(e) => categories.update(c.id, { keywords: e.target.value })}
                placeholder={t("palabras clave separadas por coma (ej. netflix, gym)", "keywords separated by comma (e.g. netflix, gym)")}
                className="h-9 min-w-[200px] flex-1 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-negative"
                onClick={() => categories.remove(c.id)}
                aria-label={`${t("Eliminar", "Delete")} ${c.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => categories.add()}>
            <Plus className="h-4 w-4" /> {t("Añadir categoría", "Add category")}
          </Button>
        </div>
      </Panel>


      <Panel title={t("Top comercios", "Top merchants")} description={`${merchants.length} ${t("comercios en el periodo", "merchants in the period")}`}>
        {merchants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Sin comercios en este rango.", "No merchants in this range.")}</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {merchants.slice(0, 10).map((m) => (
              <li key={m.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.count} {t("transacciones", "transactions")}</p>
                </div>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(m.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel
        title={t("Recomendaciones de la IA", "AI recommendations")}
        description={t("Las 4 acciones de mayor impacto, generadas automáticamente con tus datos", "The 4 highest-impact actions, generated automatically from your data")}
        actions={
          <Button size="sm" onClick={runAdvice} disabled={adviceLoading || !hasData}>
            {adviceLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("Analizando", "Analyzing")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {t("Actualizar", "Refresh")}
              </>
            )}
          </Button>
        }
      >
        {adviceError && <p className="text-sm text-negative">{adviceError}</p>}
        {!advice && !adviceError && (
          <p className="text-sm text-muted-foreground">
            {hasData
              ? t("Analizando tus categorías, comercios y tu objetivo de gasto…", "Analyzing your categories, merchants and spend target…")
              : t("Carga tus EEFF para recibir recomendaciones.", "Upload your statements to get recommendations.")}
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
