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
import { BarChart3, CalendarIcon, ChevronDown, GripVertical, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildTravelDays, categorizeTx, categorizeTxWithTravel } from "@/lib/categorize";
import { useLanguage, useT } from "@/hooks/use-language";
import { translateCategory, translateFixedName } from "@/lib/i18n-data";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { planCategories } from "@/lib/category-ai.functions";
import { CategoryChat } from "@/components/category-chat";
import { ManualExpenseDialog } from "@/components/manual-expense-dialog";
import { CategoryDetailDialog } from "@/components/category-detail-dialog";
import { useCategories } from "@/hooks/use-categories";

import { useFixedExpenses, useSpendTarget } from "@/hooks/use-fixed-expenses";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { compact, FIXED_FIELDS, money } from "@/lib/onboarding";
import { getSpendAdvice } from "@/lib/spend-advice.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { buildDataset } from "@/lib/profile-data";
import { yearsToFreedom } from "@/lib/lifestyle-cities";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

type AdviceAction = {
  label: string;
  diagnosis: string;
  action: string;
  monthlySaving: number;
  overspent: boolean;
};
import { cn } from "@/lib/utils";
import { Amount } from "@/components/ui/amount";

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
      { name: "robots", content: "noindex, nofollow" },
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

const RANGE_KEY = "wyn.gastos.range";
const FIXED_FIELD_IDS = new Set(FIXED_FIELDS.map((field) => field.key as string));

/** Mantiene el filtro del calendario aunque cambies de pestaña. */
function usePersistedRange(fallback: () => DateRange) {
  const [range, setRange] = useState<DateRange | undefined>(fallback);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RANGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { from?: string; to?: string };
      if (!parsed.from) return;
      setRange({ from: new Date(parsed.from), ...(parsed.to ? { to: new Date(parsed.to) } : {}) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = (next: DateRange | undefined) => {
    setRange(next);
    try {
      if (next?.from) {
        localStorage.setItem(
          RANGE_KEY,
          JSON.stringify({ from: next.from.toISOString(), to: next.to?.toISOString() ?? null }),
        );
      } else {
        localStorage.removeItem(RANGE_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  return [range, update] as const;
}

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


  const { lang } = useLanguage();
  const tc = (n: string) => translateCategory(n, lang);
  const { transactions, isLoading } = useTransactions();
  const fixed = useFixedExpenses();
  const categories = useCategories();
  const travelDays = useMemo(
    () => buildTravelDays(transactions, categories.rules),
    [transactions, categories.rules],
  );
  const categoryOf = (t: Tx) => categorizeTxWithTravel(t, categories.rules, travelDays);
  const [range, setRange] = usePersistedRange(() => buildPresets(t)[0]!.range());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detailCat, setDetailCat] = useState<string | null>(null);
  const [fixedOpen, setFixedOpen] = useState(true);

  // Selección explícita: 1er clic = inicio, 2º clic = fin, 3er clic = nuevo inicio.
  const handleDayClick = (day: Date) => {
    if (!range?.from || (range.from && range.to)) {
      setRange({ from: day, to: undefined });
      return;
    }
    if (day < range.from) setRange({ from: day, to: range.from });
    else setRange({ from: range.from, to: day });
  };


  const from = range?.from ?? subDays(new Date(), 29);
  const to = range?.to ?? from;
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const monthsInRange = Math.max(1, Math.round(days / 30));
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);

  const expenses = useMemo(() => transactions.filter(isExpense), [transactions]);
  const current = useMemo(() => expenses.filter((t) => inRange(t, from, to)), [expenses, from, to]);
  const previous = useMemo(() => expenses.filter((t) => inRange(t, prevFrom, prevTo)), [expenses, prevFrom, prevTo]);

  const variableTotal = sum(current);
  const prevVariable = sum(previous);
  // gastos fijos prorrateados a los días del periodo
  // Gasto del periodo = fijos + variables (los fijos se cuentan completos por mes del periodo)
  const fixedInPeriod = fixed.total * Math.max(1, Math.round(days / 30));
  const total = variableTotal + fixedInPeriod;
  const prevTotal = prevVariable + fixedInPeriod;
  const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
  const variableDelta = prevVariable > 0 ? ((variableTotal - prevVariable) / prevVariable) * 100 : 0;

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

  // Gastos fijos prorrateados al rango elegido (30 días -> 90 días, etc.)
  const periodFactor = days / 30;
  const fixedRows = useMemo(
    () =>
      fixed.items
        .filter((i) => Number(i.amount) > 0)
        .map((i) => ({ name: i.name, amount: i.amount * periodFactor, items: [] as Tx[], fixed: true }))
        .sort((a, b) => b.amount - a.amount),
    [fixed.items, periodFactor],
  );

  // Donut y detalle: solo gastos variables; los fijos tienen su propia sección.
  const donutData = useMemo(() => byCategory.map((c) => ({ ...c, fixed: false })).sort((a, b) => b.amount - a.amount), [byCategory]);

  // Categorías con gastos visibles por defecto; toggle para ver vacías
  const showEmptyCategories = false;
  // Orden manual (drag & drop) persistido localmente
  const CAT_ORDER_KEY = "wyn-category-order";
  const [catOrder, setCatOrder] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAT_ORDER_KEY);
      if (raw) setCatOrder(JSON.parse(raw) as string[]);
    } catch {
      /* noop */
    }
  }, []);
  const persistOrder = (next: string[]) => {
    setCatOrder(next);
    try {
      localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };
  const [dragName, setDragName] = useState<string | null>(null);

  const detailRows = useMemo(() => {
    // Las categorías base se muestran primero; las creadas por el usuario al final.
    const customNames = new Set(categories.items.map((i) => i.name.trim()).filter(Boolean));
    const map = new Map(byCategory.map((c) => [c.name, c]));
    const ordered: { name: string; amount: number; items: Tx[]; fixed?: boolean }[] = [];
    for (const name of categories.names) {
      const row = map.get(name) ?? { name, amount: 0, items: [] };
      if (row.amount > 0 || showEmptyCategories || customNames.has(name)) ordered.push(row);
      map.delete(name);
    }
    const rest = Array.from(map.values()).filter((c) => c.amount > 0 || showEmptyCategories);
    const all = [...ordered, ...rest].sort((a, b) => b.amount - a.amount);
    if (catOrder.length === 0) return all;
    const idx = (n: string) => {
      const i = catOrder.indexOf(n);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return all.slice().sort((a, b) => {
      const d = idx(a.name) - idx(b.name);
      return d !== 0 ? d : b.amount - a.amount;
    });
  }, [byCategory, categories.names, categories.items, showEmptyCategories, catOrder]);

  const reorderTo = (target: string) => {
    if (!dragName || dragName === target) return;
    const base = detailRows.map((r) => r.name);
    const from = base.indexOf(dragName);
    const to = base.indexOf(target);
    if (from === -1 || to === -1) return;
    const next = base.slice();
    next.splice(to, 0, next.splice(from, 1)[0]!);
    persistOrder(next);
  };



  // ---- Comparación mes vs mes ----
  const monthKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of expenses) {
      if (!inRange(t, from, to)) continue;
      set.add(format(parseISO(t.tx_date!), "yyyy-MM"));
    }
    return [...set].sort().reverse();
  }, [expenses, from, to]);


  const [monthA, setMonthA] = useState<string | null>(null);
  const [monthB, setMonthB] = useState<string | null>(null);
  const mA = (monthA && monthKeys.includes(monthA) ? monthA : monthKeys[0]) ?? null;
  const mB = (monthB && monthKeys.includes(monthB) ? monthB : monthKeys[1] ?? monthKeys[0]) ?? null;


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
      .map((name) => ({ name: tc(name), a: a.map.get(name) ?? 0, b: b.map.get(name) ?? 0 }))
      .sort((x, y) => y.a + y.b - (x.a + x.b));
    return { aTotal: a.total, bTotal: b.total, rows };
  }, [expenses, mA, mB, categories.rules]);

  const monthLabel = (k: string | null) => (k ? format(parseISO(`${k}-01`), "MMMM yyyy", { locale: es }) : "—");
  const monthDelta =
    monthCompare.bTotal > 0 ? ((monthCompare.aTotal - monthCompare.bTotal) / monthCompare.bTotal) * 100 : 0;

  // ---- Gasto objetivo ----
  const { target, setTarget } = useSpendTarget(Math.round(profile.monthly_expenses || 0));
  const isLongRange = days > 31;

  // Para rangos largos, el promedio mensual es el promedio de los totales mensuales
  // reales (variable del mes + fijos del mes). Así cada mes analizado pesa igual.
  const monthlyAverage = useMemo(() => {
    if (monthKeys.length === 0) return fixed.total;
    const map = new Map<string, number>();
    for (const t of current) {
      const key = format(parseISO(t.tx_date!), "yyyy-MM");
      map.set(key, (map.get(key) ?? 0) + Math.abs(t.amount));
    }
    const monthlyTotals = Array.from(map.values()).map((v) => v + fixed.total);
    return monthlyTotals.reduce((s, v) => s + v, 0) / monthlyTotals.length;
  }, [current, fixed.total, monthKeys.length]);

  const monthlyRun = isLongRange ? monthlyAverage : fixed.total + (variableTotal / days) * 30;
  const avgMonthlyVariable = monthlyAverage - fixed.total;
  const targetPct = target > 0 ? (monthlyRun / target) * 100 : 0;

  // ---- Recomendaciones IA ----
  const [advice, setAdvice] = useState<AdviceAction[] | null>(null);
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

  /** Comercios del periodo con su categoría actual, para el chat de categorías. */
  const merchantsForAi = useMemo(
    () =>
      merchants.slice(0, 60).map((m) => ({
        name: m.name,
        category: categorizeTx({ merchant: m.name } as Tx, categories.rules),
        amount: m.amount,
      })),
    [merchants, categories.rules],
  );

  /** Categoría a la que la IA está buscando movimientos ahora mismo. */
  const [autoCatId, setAutoCatId] = useState<string | null>(null);

  /** Pide a la IA que asigne los movimientos que correspondan a una categoría propia. */
  const autoAssign = async (cat: { id: string; name: string; keywords: string }) => {
    const name = cat.name.trim();
    if (!name || autoCatId) return;
    setAutoCatId(cat.id);
    try {
      const plan = await planCategories({
        data: {
          message:
            lang === "es"
              ? `Asigna a la categoría "${name}" todos los comercios del contexto que correspondan. Devuelve una sola operación assign con esa categoría.`
              : `Assign to the "${name}" category every merchant from the context that belongs there. Return a single assign op for that category.`,
          lang,
          environment: getPaddleEnvironment(),
          categories: categories.names,
          customRules: categories.rules.map((r) => ({ name: r.name, keywords: r.hints })),
          merchants: merchantsForAi,
        },
      });
      const op = plan.ops.find((o) => o.category.trim().toLowerCase() === name.toLowerCase()) ?? plan.ops[0];
      const found = (op?.keywords ?? []).map((k) => k.trim().toLowerCase()).filter(Boolean);
      if (!found.length) {
        toast.info(t("No encontré movimientos para esa categoría.", "I couldn't find movements for that category."));
        return;
      }
      const merged = Array.from(
        new Set([...cat.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean), ...found]),
      );
      categories.update(cat.id, { keywords: merged.join(", ") });
      toast.success(`${name}: ${found.length} ${t("coincidencias añadidas", "matches added")}`);
    } catch {
      toast.error(t("No pude analizar los movimientos.", "I couldn't analyze the movements."));
    } finally {
      setAutoCatId(null);
    }
  };


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
          environment: getPaddleEnvironment(),
          categories: byCategory.slice(0, 12).map((c) => ({
            name: c.name,
            amount: c.amount,
            prevAmount: prevByCategory.get(c.name) ?? 0,
          })),
          merchants: merchants.slice(0, 10).map((m) => ({ name: m.name, amount: m.amount, count: m.count })),
        },
      });
      setAdvice(res.actions);
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

  // ---- Impacto de cada acción sobre tu número ----
  const ds = useMemo(() => buildDataset(profile), [profile]);
  const annualTarget = Math.max(1, ds.plan.desiredIncome * 12);
  const baseYears = yearsToFreedom(
    Math.max(0, ds.netWorth),
    Math.max(0, ds.savings),
    annualTarget,
    profile.expected_return || 7,
  );
  const yearsGain = (extra: number) => {
    if (baseYears === null || extra <= 0) return null;
    const y = yearsToFreedom(
      Math.max(0, ds.netWorth),
      Math.max(0, ds.savings) + extra,
      annualTarget,
      profile.expected_return || 7,
    );
    return y === null ? null : Math.max(0, baseYears - y);
  };
  const totalSaving = (advice ?? []).reduce((s, a) => s + Math.max(0, a.monthlySaving), 0);
  const yearsWithAll =
    totalSaving > 0
      ? yearsToFreedom(
          Math.max(0, ds.netWorth),
          Math.max(0, ds.savings) + totalSaving,
          annualTarget,
          profile.expected_return || 7,
        )
      : null;

  // Valor futuro de recortar y reinvertir al 7% anual (capitalización mensual).
  const RATE = 7;
  const horizonYears = Math.min(30, Math.max(5, baseYears ?? 15));
  const futureValue = (monthly: number, years = horizonYears) => {
    const r = RATE / 100 / 12;
    const n = Math.round(years * 12);
    if (monthly <= 0) return 0;
    return monthly * ((Math.pow(1 + r, n) - 1) / r);
  };


  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Análisis de gastos", "Spending analysis")}
        title={t("¿En qué se fue mi dinero?", "Where did my money go?")}
        subtitle={t("Gastos fijos + variable de tus estados de cuenta, comparado periodo a periodo.", "Fixed + variable spend from your statements, compared period over period.")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="gap-2 rounded-full">
              <Link to="/configuracion">
                <Upload className="h-3.5 w-3.5" />
                {t("Importar gastos", "Import expenses")}
              </Link>
            </Button>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                      onClick={() => {
                        setRange(p.range());
                        setCalendarOpen(false);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{t("Inicio", "Start")}:</span>
                  <span className="font-medium">{range?.from ? format(range.from, "d MMM yyyy", { locale: es }) : "—"}</span>
                  <span className="text-muted-foreground">{t("Fin", "End")}:</span>
                  <span className="font-medium">{range?.to ? format(range.to, "d MMM yyyy", { locale: es }) : "—"}</span>
                </div>
                <Calendar
                  mode="range"
                  selected={range}
                  defaultMonth={range?.from ?? new Date()}
                  onDayClick={handleDayClick}
                  numberOfMonths={2}
                  locale={es}
                  className={cn("p-3 pointer-events-auto")}
                />
                <div className="flex items-center justify-between gap-2 border-t border-border p-3">
                  <Button size="sm" variant="ghost" onClick={() => setRange(presets[0]!.range())}>
                    {t("Restablecer", "Reset")}
                  </Button>
                  <Button size="sm" disabled={!range?.from || !range?.to} onClick={() => setCalendarOpen(false)}>
                    {t("Aplicar", "Apply")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {!hasData && !isLoading && (
        <Panel variant="minimal">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-elevated">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("Aún no hay estados de cuenta procesados", "No statements processed yet")}</p>
              <p className="text-xs text-muted-foreground">{t("Sube tus EEFF en PDF o CSV para ver el detalle real.", "Upload your statements as PDF or CSV to see the real detail.")}</p>
            </div>
            <Button asChild className="ml-auto gap-2">
              <Link to="/configuracion">
                <Upload className="h-4 w-4" />
                {t("Importar gastos", "Import expenses")}
              </Link>
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard variant="flat" label={t("Gasto del periodo", "Period spend")} value={fmt(total)} delta={Number(delta.toFixed(1))} hint={t("fijos + variables", "fixed + variable")} inverse accent index={0} />
        <KpiCard variant="flat" label={t("Gastos fijos", "Fixed expenses")} value={fmt(isLongRange ? fixed.total * monthsInRange : fixed.total)} hint={isLongRange ? t(`${monthsInRange} meses en el periodo`, `${monthsInRange} months in the period`) : t("mensual, editable", "monthly, editable")} index={1} />
        <KpiCard variant="flat" label={t("Gasto variable (EEFF)", "Variable spend (statements)")} value={fmt(variable)} hint={`${current.length} ${t("transacciones", "transactions")}`} index={2} />
        <KpiCard variant="flat" label={t("Promedio diario", "Daily average")} value={fmt(total / days)} hint={`${days} ${t("días", "days")}`} index={3} />
      </div>

      <Panel
        variant="minimal"
        title={isLongRange ? t("Promedio mensual vs objetivo", "Monthly average vs target") : t("Gasto objetivo mensual", "Monthly spend target")}
        description={
          isLongRange
            ? monthKeys.length > 0
              ? t(
                  `Promedio mensual de los ${monthKeys.length} meses analizados vs. tu techo de gasto.`,
                  `Monthly average of the ${monthKeys.length} months analyzed vs. your spending ceiling.`,
                )
              : t("Promedio mensual vs. tu techo de gasto.", "Monthly average vs. your spending ceiling.")
            : t("Ritmo actual vs. tu techo de gasto según tu número.", "Current pace vs. your spending ceiling based on your number.")
        }
      >
        <div className="grid gap-5 md:grid-cols-[200px_1fr] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{t("Objetivo", "Target")}</p>
            <div className="mt-2 flex items-center gap-2">
              <NumberInput
                value={target}
                onChange={setTarget}
                format
                className="h-10 w-36 text-base font-semibold"
              />
              <span className="text-xs text-muted-foreground">{t("/mes", "/mo")}</span>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="numeric text-xl font-semibold">{fmt(monthlyRun)}</span>
              <span className="text-xs text-muted-foreground">
                {isLongRange
                  ? t(`promedio mensual de ${monthKeys.length} meses`, `monthly average of ${monthKeys.length} months`)
                  : t("ritmo mensual estimado", "estimated monthly pace")}
                {" · "}
                {t("objetivo", "target")} {fmt(target)}/{t("mes", "mo")}
              </span>
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
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", monthlyRun <= target ? "bg-positive" : "bg-negative")}
                style={{ width: `${Math.min(100, targetPct)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {targetPct.toFixed(0)}% {t("del objetivo", "of target")} · {t("fijos", "fixed")} {fmt(fixed.total)} + {t("variable", "variable")} {fmt(isLongRange ? avgMonthlyVariable : (variableTotal / days) * 30)}
            </p>
          </div>
        </div>
      </Panel>



      <div className="grid items-stretch gap-3 lg:grid-cols-3">
        <Panel variant="minimal" title={t("Distribución por categoría", "Spend by category")} description={t("Solo gastos variables del periodo seleccionado.", "Variable spend only for the selected period.")} className="flex h-full flex-col">

          {donutData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Sin movimientos en este rango.", "No transactions in this range.")}</p>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={90}
                      outerRadius={130}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((c, i) => (
                        <Cell key={c.name} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={fmt} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-semibold"><Amount full={fmt(variableTotal)} short={fmtCompact(variableTotal)} from="lg" /></p>
                  <p className="text-sm text-muted-foreground">{t("gasto variable del periodo", "variable period spend")}</p>
                  <p className={cn("numeric mt-0.5 text-xs", variableDelta > 0 ? "text-negative" : "text-positive")}>
                    {variableDelta > 0 ? "+" : ""}
                    {variableDelta.toFixed(1)}% {t("vs. periodo anterior", "vs. previous period")}
                  </p>
                </div>
              </div>
              <ul className="mt-auto grid grid-cols-1 gap-x-4 gap-y-1.5 pt-4">
                {donutData.slice(0, 8).map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                    <span className="text-muted-foreground">
                      {tc(c.name)}
                      {c.fixed ? ` · ${t("fijo", "fixed")}` : ""}
                    </span>
                    <span className="numeric ml-auto font-medium">{((c.amount / Math.max(1, total)) * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>



        <Panel variant="minimal" title={t("Evolución del gasto", "Spend evolution")} description={`${t("Comparando con", "Comparing with")} ${format(prevFrom, "d MMM", { locale: es })} — ${format(prevTo, "d MMM yyyy", { locale: es })}`} className="flex h-full flex-col lg:col-span-2">
          <ResponsiveContainer width="100%" height={340}>

            <ComposedChart data={series} margin={{ left: -8, right: 8, top: 12 }}>
              <CartesianGrid strokeDasharray="4 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingBottom: 12, color: "var(--color-muted-foreground)" }}
              />
              <Bar dataKey="anterior" name={t("Periodo anterior", "Previous period")} fill="#5B6370" fillOpacity={0.85} radius={[5, 5, 0, 0]} barSize={12} />
              <Bar dataKey="gasto" name={t("Este periodo", "This period")} fill="#FF7B7B" radius={[5, 5, 0, 0]} barSize={12} />
              <Line dataKey="fijo" name={t("Fijos (prorrateado)", "Fixed (prorated)")} stroke="#E6C86C" strokeWidth={2.5} strokeDasharray="6 6" dot={false} activeDot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:grid-cols-4">
            {[
              { l: t("Este periodo", "This period"), v: fmt(variableTotal) },
              { l: t("Periodo anterior", "Previous period"), v: fmt(prevVariable) },
              {
                l: t("Variación", "Change"),
                v: `${variableTotal - prevVariable > 0 ? "+" : ""}${fmt(variableTotal - prevVariable)}`,
              },
              { l: t("Día más caro", "Most expensive day"), v: series.length ? fmt(Math.max(...series.map((s) => s.gasto))) : "—" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-border/60 bg-elevated/40 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">{k.l}</p>
                <p className="numeric text-sm font-semibold">{k.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Periodo anterior", "Previous period")}: <span className="numeric font-medium">{fmt(prevTotal)}</span>
          </p>
        </Panel>
      </div>

      <Collapsible open={fixedOpen} onOpenChange={setFixedOpen}>
        <Panel
          variant="minimal"
          title={t("Gastos fijos mensuales", "Monthly fixed expenses")}
          description={t("Edita el monto mensual; abajo se muestra lo que representa en el periodo seleccionado.", "Edit the monthly amount; below you see what it represents for the selected period.")}
          actions={
            <div className="flex items-center gap-3">
              {!fixedOpen && (
                <div className="flex flex-col items-end">
                  <span className="numeric text-sm font-semibold">{fmt(fixed.total)}{t("/mes", "/mo")}</span>
                  <span className="numeric text-[11px] text-muted-foreground">
                    {isLongRange
                      ? `${fmt(fixed.total * monthsInRange)} · ${t(`${monthsInRange} meses`, `${monthsInRange} months`)}`
                      : `${fmt(fixed.total)} ${t("en este periodo", "in this period")}`}
                  </span>
                </div>
              )}
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label={fixedOpen ? t("Colapsar gastos fijos", "Collapse fixed expenses") : t("Expandir gastos fijos", "Expand fixed expenses")}>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", !fixedOpen && "-rotate-90")} />
                </Button>
              </CollapsibleTrigger>
            </div>
          }
        >
          <CollapsibleContent>
            <div className="space-y-2">
              {fixed.items.map((item) => {
                const isStandardFixed = FIXED_FIELD_IDS.has(item.id);
                return (
                  <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-elevated/40 px-3 py-2">
                    <Input
                      value={translateFixedName(item.name, lang)}
                      readOnly={isStandardFixed}
                      onChange={(e) => fixed.update(item.id, { name: e.target.value })}
                      className={cn(
                        "h-8 w-full max-w-[260px] border-transparent bg-transparent text-sm font-medium focus-visible:border-border",
                        isStandardFixed && "cursor-default focus-visible:ring-0",
                      )}
                    />
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <NumberInput
                          value={item.amount}
                          onChange={(v) => fixed.update(item.id, { amount: v })}
                          className="h-8 w-28 text-right text-sm"
                        />
                        <span className="numeric mt-0.5 text-[11px] text-muted-foreground">
                          {isLongRange
                            ? `${fmt(item.amount * monthsInRange)} · ${t(`${monthsInRange} meses`, `${monthsInRange} months`)}`
                            : `${fmt(item.amount)} ${t("en este periodo", "in this period")}`}
                        </span>
                      </div>
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
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-3"
                          style={{ width: `${fixed.total > 0 ? (item.amount / fixed.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="outline" className="gap-2" onClick={fixed.add}>
                <Plus className="h-4 w-4" /> {t("Añadir gasto fijo", "Add fixed expense")}
              </Button>
            </div>
          </CollapsibleContent>
          {fixedOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3">
              <div className="ml-auto flex flex-col items-end">
                <span className="numeric text-sm font-semibold">{t("Total", "Total")} {fmt(fixed.total)}{t("/mes", "/mo")}</span>
                <span className="numeric text-[11px] text-muted-foreground">
                  {isLongRange
                    ? `${fmt(fixed.total * monthsInRange)} · ${t(`${monthsInRange} meses en el periodo`, `${monthsInRange} months in the period`)}`
                    : `${fmt(fixed.total)} ${t("en este periodo", "in this period")}`}
                </span>
              </div>
            </div>
          )}
        </Panel>
      </Collapsible>







      <Panel
        variant="minimal"
        title={t("Comparar mes vs mes", "Compare month vs month")}
        description={t("Elige dos meses de tus EEFF y mira dónde cambió el gasto", "Pick two months from your statements and see where spend changed")}
      >
        {monthKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Carga tus EEFF para comparar meses.", "Upload your statements to compare months.")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={mA ?? ""} onValueChange={(v) => setMonthA(v)}>
                <SelectTrigger className="h-8 w-[180px] text-sm capitalize">
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
                <SelectTrigger className="h-8 w-[180px] text-sm capitalize">
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

            <div className="mt-3">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthCompare.rows.slice(0, 10)} margin={{ left: -8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    {...axisProps}
                    interval={0}
                    minTickGap={4}
                    height={64}
                    angle={-35}
                    textAnchor="end"
                    tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
                  />
                  <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
                  <Tooltip content={<ChartTooltip formatter={fmt} />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
                  <Bar dataKey="a" name={monthLabel(mA)} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="b" name={monthLabel(mB)} fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>

      <Panel
        variant="minimal"
        title={t("Gastos variables", "Variable expenses")}
        description={t(
          "Solo categorías con gastos · puedes ordenarlas arrastrándolas y agregar nuevas categorías.",
          "Only categories with spending · drag to reorder and add new categories.",
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="gap-2 rounded-full">
              <Link to="/configuracion">
                <Upload className="h-3.5 w-3.5" />
                {t("Importar gastos", "Import expenses")}
              </Link>
            </Button>
            <ManualExpenseDialog categories={categories.names} />
          </div>
        }
      >
        <Accordion type="single" collapsible className="w-full">
          {detailRows.map((c, i) => {
            const prev = prevByCategory.get(c.name) ?? 0;
            const variation = prev > 0 ? ((c.amount - prev) / prev) * 100 : null;
            return (
              <AccordionItem key={c.name} value={c.name} className="border-border">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex w-full min-w-0 items-center gap-2 pr-2 sm:gap-3 sm:pr-3">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{tc(c.name)}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t("Ver análisis", "View analysis")}
                      title={t("Ver análisis", "View analysis")}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDetailCat(c.name);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setDetailCat(c.name);
                        }
                      }}
                      className="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-elevated hover:text-foreground"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </span>
                    <span className="hidden shrink-0 rounded-full bg-elevated/50 px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
                      {`${c.items.length} ${c.items.length === 1 ? t("mov.", "tx") : t("movs.", "txs")}`}
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
                    <span className="numeric shrink-0 whitespace-nowrap text-sm font-semibold">{fmt(c.amount)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {c.items.length === 0 ? (
                    <p className="pl-6 text-sm text-muted-foreground">{t("Sin gastos de esta categoría en el periodo.", "No expenses in this category for the period.")}</p>
                  ) : (
                    <ul className="max-h-[320px] space-y-0.5 overflow-auto pl-6">
                      {c.items
                        .slice()
                        .sort((a: Tx, b: Tx) => (a.tx_date! < b.tx_date! ? 1 : -1))
                        .map((tx: Tx) => (
                          <li key={tx.id} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-elevated/50">
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

        {detailCat && (
          <CategoryDetailDialog
            open={Boolean(detailCat)}
            onOpenChange={(v) => !v && setDetailCat(null)}
            name={tc(detailCat)}
            items={detailRows.find((r) => r.name === detailCat)?.items ?? []}
            amount={detailRows.find((r) => r.name === detailCat)?.amount ?? 0}
            prevAmount={prevByCategory.get(detailCat) ?? 0}
            periodTotal={variableTotal}
            days={days}
            fmt={fmt}
            fmtCompact={fmtCompact}
          />
        )}

        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <CategoryChat
            categories={categories.names}
            items={categories.items}
            customRules={categories.rules.map((r) => ({ name: r.name, keywords: r.hints }))}
            merchants={merchantsForAi}
            onCreate={(name, keywords) => categories.add(name, keywords)}
            onUpdate={categories.update}
            onRemove={categories.remove}
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("Categorías propias", "Custom categories")}</p>
          <div className="grid gap-2">
            {categories.items.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-elevated/40 px-3 py-2">
                <Input
                  value={cat.name}
                  onChange={(e) => categories.update(cat.id, { name: e.target.value })}
                  className="h-7 flex-1 border-transparent bg-transparent text-sm focus-visible:bg-background"
                  placeholder={t("Nombre", "Name")}
                />
                <Input
                  value={cat.keywords}
                  onChange={(e) => categories.update(cat.id, { keywords: e.target.value })}
                  className="h-7 flex-[1.5] border-transparent bg-transparent text-sm text-muted-foreground focus-visible:bg-background"
                  placeholder={t("Palabras clave", "Keywords")}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary hover:bg-primary/10"
                  disabled={autoCatId !== null || !cat.name.trim()}
                  onClick={() => void autoAssign(cat)}
                  aria-label={t("Añadir movimientos con IA", "Add movements with AI")}
                  title={t("Añadir movimientos con IA", "Add movements with AI")}
                >
                  {autoCatId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-negative"
                  onClick={() => categories.remove(cat.id)}
                  aria-label={t("Eliminar categoría", "Delete category")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => categories.add()}>
            <Plus className="h-4 w-4" /> {t("Añadir categoría", "Add category")}
          </Button>
        </div>
      </Panel>



      <Panel variant="minimal" title={t("Top comercios", "Top merchants")} description={`${merchants.length} ${t("comercios en el periodo", "merchants in the period")}`}>
        {merchants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Sin comercios en este rango.", "No merchants in this range.")}</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {merchants.slice(0, 10).map((m) => (
              <li key={m.name} className="flex items-center gap-3 rounded-xl border border-border/60 bg-elevated/40 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold">
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
        variant="minimal"
        title={t("Recomendaciones de la IA", "AI recommendations")}
        description={t("Acciones concretas ordenadas por impacto, y cuánto te acercan a tu número", "Concrete actions ranked by impact, and how much closer they get you to your number")}
        actions={
          <Button size="sm" variant="outline" onClick={runAdvice} disabled={adviceLoading || !hasData}>
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
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-elevated/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                {t("Si recortas y lo inviertes al 7%", "If you cut back and invest it at 7%")}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="numeric text-xl font-semibold">{fmt(totalSaving)}<span className="text-xs font-normal text-muted-foreground">{t("/mes", "/mo")}</span></p>
                  <p className="text-xs text-muted-foreground">{t("ahorro potencial total", "total potential savings")}</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-positive"><Amount full={fmt(futureValue(totalSaving))} short={fmtCompact(futureValue(totalSaving))} from="xl" /></p>
                  <p className="text-xs text-muted-foreground">
                    {t("en", "in")} {horizonYears.toFixed(0)} {t("años al 7% anual", "years at 7% a year")}
                  </p>
                </div>
                <div>
                  {baseYears !== null && (
                    <>
                      <p className="numeric text-xl font-semibold">
                        {yearsWithAll !== null ? yearsWithAll : baseYears} <span className="text-xs font-normal text-muted-foreground">{t("años", "yrs")}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {yearsWithAll !== null && baseYears - yearsWithAll > 0 ? (
                          <>
                            {t("a tu número", "to your number")} · <span className="text-positive">−{(baseYears - yearsWithAll).toFixed(1)} {t("años", "yrs")}</span>
                          </>
                        ) : (
                          t("a tu número con tu ritmo actual", "to your number at your current pace")
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <ul className="grid gap-2 md:grid-cols-2">
              {advice.map((a, i) => {
                const gain = yearsGain(a.monthlySaving);
                const fv = futureValue(a.monthlySaving);
                return (
                  <li
                    key={i}
                    className="flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-elevated/40 p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="numeric flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-[10px] font-semibold text-primary">
                          {i + 1}
                        </span>
                        <p className="text-sm font-semibold">{a.label}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          a.overspent ? "bg-negative/12 text-negative" : "bg-positive/12 text-positive",
                        )}
                      >
                        {a.overspent ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {a.overspent ? t("Te excediste", "Overspent") : t("Oportunidad", "Opportunity")}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{a.diagnosis}</p>
                    <p className="text-sm font-medium text-foreground/90">→ {a.action}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span className="text-positive">+{fmt(a.monthlySaving)}{t("/mes", "/mo")} {t("recorte", "cut")}</span>
                      <span className="text-muted-foreground">{fmtCompact(fv)} {t("al 7% en", "at 7% in")} {horizonYears.toFixed(0)}a</span>
                      {gain !== null && gain > 0 && (
                        <span className="inline-flex items-center gap-1 text-positive">
                          <TrendingUp className="h-3 w-3" />
                          −{gain.toFixed(1)} {t("años", "yrs")} {t("a tu número", "to your number")}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </Panel>
    </PageShell>
  );
}
