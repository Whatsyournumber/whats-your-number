import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Upload } from "lucide-react";
import { categorizeTx } from "@/lib/categorize";
import { useCategories } from "@/hooks/use-categories";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { lifestyle, topMerchants } from "@/lib/data";
import { compact, money } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lifestyle")({
  head: () => ({
    meta: [
      { title: "Lifestyle — Your north" },
      { name: "description", content: "Cuánto cuesta tu estilo de vida con datos reales de tus estados de cuenta, comparando meses, semanas y días." },
      { property: "og:title", content: "Lifestyle — Your north" },
      { property: "og:description", content: "Analiza tu gasto de estilo de vida por rango de fechas y compáralo con el periodo anterior." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lifestyle,
});

const LIFESTYLE_HINTS = [
  "restaurant",
  "comida",
  "food",
  "cafe",
  "bar",
  "viaje",
  "travel",
  "hotel",
  "vuelo",
  "flight",
  "ocio",
  "entreten",
  "compra",
  "shopping",
  "ropa",
  "suscrip",
  "subscription",
  "gimnasio",
  "gym",
  "delivery",
];

function isLifestyle(t: Tx) {
  const hay = `${t.category ?? ""} ${t.subcategory ?? ""}`.toLowerCase();
  return LIFESTYLE_HINTS.some((h) => hay.includes(h));
}

type Preset = { id: string; label: string; range: () => DateRange };

const presets: Preset[] = [
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

function sum(list: Tx[]) {
  return list.reduce((s, t) => s + Math.abs(t.amount), 0);
}

function inRange(t: Tx, from: Date, to: Date) {
  const d = parseISO(t.tx_date!);
  return d >= from && d <= to;
}

function group(list: Tx[], key: (t: Tx) => string) {
  const map = new Map<string, { name: string; amount: number; count: number }>();
  for (const t of list) {
    const k = key(t) || "Sin categoría";
    const prev = map.get(k) ?? { name: k, amount: 0, count: 0 };
    prev.amount += Math.abs(t.amount);
    prev.count += 1;
    map.set(k, prev);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

function Lifestyle() {
  const { profile } = useProfile();
  const currency = profile.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);
  const fmtCompact = (n: number) => compact(n, currency);

  const { transactions, isLoading } = useTransactions();
  const [range, setRange] = useState<DateRange | undefined>(() => presets[0]!.range());
  const [onlyLifestyle, setOnlyLifestyle] = useState(true);

  const from = range?.from ?? subDays(new Date(), 29);
  const to = range?.to ?? from;
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);

  const base = useMemo(
    () => (onlyLifestyle ? transactions.filter(isLifestyle) : transactions),
    [transactions, onlyLifestyle],
  );
  const current = useMemo(() => base.filter((t) => inRange(t, from, to)), [base, from, to]);
  const previous = useMemo(() => base.filter((t) => inRange(t, prevFrom, prevTo)), [base, prevFrom, prevTo]);

  const total = sum(current);
  const prevTotal = sum(previous);
  const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
  const perDay = total / days;
  const ticket = current.length ? total / current.length : 0;

  const categories = useCategories();
  const byCategory = useMemo(() => group(current, (t) => categorizeTx(t, categories.rules)), [current, categories.rules]);
  const prevByCategory = useMemo(() => group(previous, (t) => categorizeTx(t, categories.rules)), [previous, categories.rules]);
  const byMerchant = useMemo(() => group(current, (t) => t.merchant), [current]);

  // Serie temporal: por día si el rango es corto, por mes si es largo.
  const byMonth = days > 62;
  const series = useMemo(() => {
    const buckets = new Map<string, { key: string; label: string; actual: number; anterior: number }>();
    const keyOf = (d: Date) => (byMonth ? format(d, "yyyy-MM") : format(d, "yyyy-MM-dd"));
    const labelOf = (d: Date) => (byMonth ? format(d, "MMM yy", { locale: es }) : format(d, "d MMM", { locale: es }));
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      const k = keyOf(d);
      if (!buckets.has(k)) buckets.set(k, { key: k, label: labelOf(d), actual: 0, anterior: 0 });
    }
    for (const t of current) {
      const k = keyOf(parseISO(t.tx_date!));
      const b = buckets.get(k);
      if (b) b.actual += Math.abs(t.amount);
    }
    // Periodo anterior alineado por posición (desplazado el mismo número de días).
    for (const t of previous) {
      const shifted = addDays(parseISO(t.tx_date!), days);
      const b = buckets.get(keyOf(shifted));
      if (b) b.anterior += Math.abs(t.amount);
    }
    return [...buckets.values()];
  }, [current, previous, from, days, byMonth]);

  const hasData = transactions.length > 0;

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d MMM yyyy", { locale: es })} — ${format(range.to, "d MMM yyyy", { locale: es })}`
      : "Selecciona un rango";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Estilo de vida"
        title="Lifestyle"
        subtitle="El costo real de disfrutar, con los datos de tus estados de cuenta."
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
                  <Button key={p.id} size="sm" variant="secondary" className="h-7 rounded-full text-[11px]" onClick={() => setRange(p.range())}>
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

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={onlyLifestyle ? "default" : "outline"}
          className="h-7 rounded-full text-[11px]"
          onClick={() => setOnlyLifestyle(true)}
        >
          Solo lifestyle
        </Button>
        <Button
          size="sm"
          variant={!onlyLifestyle ? "default" : "outline"}
          className="h-7 rounded-full text-[11px]"
          onClick={() => setOnlyLifestyle(false)}
        >
          Todos los gastos
        </Button>
        <span className="text-xs text-muted-foreground">
          Comparando con {format(prevFrom, "d MMM", { locale: es })} — {format(prevTo, "d MMM yyyy", { locale: es })}
        </span>
      </div>

      {!hasData && !isLoading && (
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-elevated">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Aún no hay estados de cuenta procesados</p>
              <p className="text-xs text-muted-foreground">
                Sube tus EEFF en PDF o CSV y este módulo se llenará con tus gastos reales.
              </p>
            </div>
            <Button asChild className="ml-auto">
              <Link to="/configuracion">Cargar EEFF</Link>
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gasto del periodo" value={fmt(total)} delta={Number(delta.toFixed(1))} inverse accent index={0} />
        <KpiCard label="Periodo anterior" value={fmt(prevTotal)} hint={`${days} días comparados`} index={1} />
        <KpiCard label="Promedio diario" value={fmt(perDay)} hint={`${current.length} transacciones`} index={2} />
        <KpiCard label="Ticket promedio" value={fmt(ticket)} hint={byCategory[0]?.name ?? "Sin categorías"} index={3} />
      </div>

      <Panel
        title={byMonth ? "Gasto por mes" : "Gasto por día"}
        description="Barra clara: periodo actual · barra tenue: periodo anterior alineado"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={series} margin={{ left: -8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
            <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={64} />
            <Tooltip content={<ChartTooltip formatter={fmt} />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
            <Bar dataKey="anterior" name="Periodo anterior" fill="var(--color-muted-foreground)" opacity={0.35} radius={[6, 6, 0, 0]} />
            <Bar dataKey="actual" name="Periodo actual" fill="var(--color-chart-7)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Categorías" description="Variación vs. periodo anterior">
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos en este rango.</p>
          ) : (
            <ul className="space-y-2">
              {byCategory.slice(0, 10).map((c) => {
                const prev = prevByCategory.find((p) => p.name === c.name)?.amount ?? 0;
                const v = prev > 0 ? ((c.amount - prev) / prev) * 100 : null;
                const share = total > 0 ? (c.amount / total) * 100 : 0;
                return (
                  <li key={c.name} className="rounded-xl bg-elevated/60 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      {v !== null && (
                        <Badge
                          variant="secondary"
                          className={cn("rounded-full text-[10px]", v > 0 ? "text-negative" : "text-positive")}
                        >
                          {v > 0 ? "+" : ""}
                          {v.toFixed(0)}%
                        </Badge>
                      )}
                      <span className="numeric ml-auto text-sm font-semibold">{fmt(c.amount)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-7" style={{ width: `${share}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {c.count} transacciones · {share.toFixed(0)}% del gasto
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Comercios del periodo">
          {byMerchant.length === 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {topMerchants.slice(0, 6).map((m) => (
                <div key={m.name} className="rounded-xl bg-elevated/60 p-3 opacity-60">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="numeric mt-1 text-lg font-semibold">{fmt(m.amount)}</p>
                  <p className="text-xs text-muted-foreground">ejemplo</p>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {byMerchant.slice(0, 10).map((m) => (
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
      </div>

      <Panel title="Movimientos del periodo" description={`${current.length} transacciones`}>
        {current.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada que mostrar en este rango de fechas.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <ul className="space-y-1.5">
              {current
                .slice()
                .sort((a, b) => (a.tx_date! < b.tx_date! ? 1 : -1))
                .slice(0, 100)
                .map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-elevated/60">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      {format(parseISO(t.tx_date!), "d MMM", { locale: es })}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.merchant}</p>
                      <p className="truncate text-xs text-muted-foreground">{categorizeTx(t, categories.rules)}</p>
                    </div>
                    <span className="numeric ml-auto text-sm font-semibold">{fmt(Math.abs(t.amount))}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel title="Suscripciones detectadas" description="Referencia de tu estilo de vida recurrente">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lifestyle.subscriptions.map((s) => (
            <div key={s.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">desde {s.since}</p>
              </div>
              <span className="numeric ml-auto text-sm font-semibold">{fmt(s.amount)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
