import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, Info, ReceiptText, Sparkles, Users } from "lucide-react";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { Button } from "@/components/ui/button";
import { Tooltip as Hint, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGroceryRules } from "@/hooks/use-grocery-rules";
import { useLanguage, useT } from "@/hooks/use-language";
import { merchantKey, type Tx } from "@/hooks/use-transactions";
import { GROCERY_GROUPS, GROCERY_LABELS, summarizeGroceryReceipts, type GroceryGroup } from "@/lib/receipt-insights";
import { cn } from "@/lib/utils";
import { parseShared } from "@/components/shared-expense";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  items: Tx[];
  previousItems?: Tx[];
  isSupermarket?: boolean;
  amount: number;
  prevAmount: number;
  periodTotal: number;
  days: number;
  fmt: (n: number) => string;
  fmtCompact: (n: number) => string;
};

/** Análisis minimalista de un rubro: KPIs, tendencia, comercios y movimientos. */
export function CategoryDetailDialog({
  open,
  onOpenChange,
  name,
  items,
  previousItems = [],
  isSupermarket = false,
  amount,
  prevAmount,
  periodTotal,
  days,
  fmt,
  fmtCompact,
}: Props) {
  const t = useT();
  const groceryRules = useGroceryRules();
  const [groceryOpen, setGroceryOpen] = useState(true);
  const byMonth = days > 62;
  const isGrocery = isSupermarket || ["supermercado", "mercado", "groceries"].includes(name.trim().toLowerCase());
  const grocery = useMemo(() => isGrocery ? summarizeGroceryReceipts(items, previousItems, groceryRules.rules) : null, [isGrocery, items, previousItems, groceryRules.rules]);
  // Productos que el usuario añadió a mano en Reglas del súper, por rubro; las correcciones no aparecen.
  const addedByGroup = useMemo(() => {
    const map = new Map<GroceryGroup, string[]>();
    for (const rule of groceryRules.rules) {
      if (rule.origin !== "added") continue;
      const list = map.get(rule.group) ?? [];
      list.push(rule.match);
      map.set(rule.group, list);
    }
    return map;
  }, [groceryRules.rules]);

  const trend = useMemo(() => {
    const map = new Map<string, { label: string; gasto: number }>();
    for (const tx of items) {
      if (!tx.tx_date) continue;
      const d = parseISO(tx.tx_date);
      const key = byMonth ? format(d, "yyyy-MM") : format(d, "yyyy-MM-dd");
      const label = byMonth ? format(d, "MMM yy", { locale: es }) : format(d, "d MMM", { locale: es });
      const prev = map.get(key) ?? { label, gasto: 0 };
      prev.gasto += Math.abs(tx.amount);
      map.set(key, prev);
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, v]) => v);
  }, [items, byMonth]);

  const merchants = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number }>();
    for (const tx of items) {
      const label = tx.merchant?.trim() || t("Sin comercio", "Unknown");
      const key = merchantKey(label) || label.toLowerCase();
      const prev = map.get(key) ?? { name: label, amount: 0, count: 0 };
      // Se conserva el nombre más corto y legible del mismo comercio.
      if (label.length < prev.name.length) prev.name = label;
      prev.amount += Math.abs(tx.amount);
      prev.count += 1;
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [items, t]);

  const share = periodTotal > 0 ? (amount / periodTotal) * 100 : 0;
  const variation = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : null;
  const avgTicket = items.length > 0 ? amount / items.length : 0;
  const maxMerchant = merchants[0]?.amount ?? 1;
  // Se cuentan días distintos con gasto de fiesta: varias copas la misma noche son una sola salida.
  const outings = useMemo(
    () => new Set(items.map((tx) => tx.tx_date).filter(Boolean)).size,
    [items],
  );
  const outingsLabel = outings === 1
    ? t("salida de fiesta", "night out")
    : t("salidas de fiesta", "nights out");
  const nightlifeHint = `${outings} ${outingsLabel}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-2xl min-w-0 gap-4 overflow-x-hidden overflow-y-auto rounded-2xl p-4 sm:max-h-[92dvh] sm:w-full sm:p-6">
        <DialogHeader className="min-w-0 px-7 text-center sm:px-0 sm:pr-8 sm:text-left">
          <DialogTitle className="truncate text-lg">{name === "Nightlife" ? t("Nightlife / Ocio", "Nightlife / Leisure") : name}</DialogTitle>
          <DialogDescription className="text-pretty text-xs leading-relaxed sm:text-sm">
            {t("Análisis del rubro en el periodo seleccionado.", "Category analysis for the selected period.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <Stat
            label={t("Total", "Total")}
            value={fmt(amount)}
            hint={name === "Nightlife" ? nightlifeHint : undefined}
          />
          <Stat label={t("% del gasto", "% of spend")} value={`${share.toFixed(0)}%`} />
          <Stat
            label={t("vs periodo anterior", "vs previous")}
            value={variation === null ? "—" : `${variation > 0 ? "+" : ""}${variation.toFixed(0)}%`}
            tone={variation === null ? undefined : variation > 0 ? "negative" : "positive"}
          />
          <Stat label={t("Ticket medio", "Avg ticket")} value={fmt(avgTicket)} hint={`${items.length} ${t("movs.", "txs")}`} />
        </div>

        {trend.length > 1 && (
          <div className="mt-1 min-w-0 overflow-hidden rounded-2xl border border-border bg-elevated/40 p-3 sm:p-4">
            <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">{t("Evolución del rubro", "Category trend")}</p>
            <div className="h-36 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -18, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="catGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={52} />
                <Tooltip content={<ChartTooltip formatter={fmt} />} />
                <Area
                  type="monotone"
                  dataKey="gasto"
                  name={t("Gasto", "Spend")}
                  stroke="var(--color-chart-1)"
                  fill="url(#catGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}

        {grocery && grocery.receiptCount > 0 && (
          <section className="min-w-0 border-t border-border pt-4">
            <Button type="button" variant="ghost" className="grid h-auto w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 whitespace-normal px-1 py-1.5 text-left" aria-expanded={groceryOpen} aria-controls="grocery-receipt-insights" onClick={() => setGroceryOpen((v) => !v)}>
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><Sparkles className="size-4" /></span><span className="min-w-0 text-sm font-semibold leading-snug">{t(`Análisis de ${grocery.receiptCount} ${grocery.receiptCount === 1 ? "ticket" : "tickets"} del súper del mes`, `Analysis of ${grocery.receiptCount} grocery ${grocery.receiptCount === 1 ? "receipt" : "receipts"} this month`)}</span>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", groceryOpen && "rotate-180")} />
            </Button>
            {groceryOpen && <div id="grocery-receipt-insights"><GroceryInsights summary={grocery} fmt={fmt} onCorrect={groceryRules.learn} addedByGroup={addedByGroup} /></div>}
          </section>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("Top comercios", "Top merchants")}</p>
            <div className="space-y-2">
              {merchants.map((m) => (
                <div key={m.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm">{m.name}</span>
                    <span className="numeric shrink-0 text-xs text-muted-foreground">
                      {fmt(m.amount)} · {m.count}x
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (m.amount / maxMerchant) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {merchants.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("Sin movimientos.", "No transactions.")}</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("Movimientos", "Transactions")}
              {name === "Nightlife" && outings > 0 && (
                <span className="ml-1.5 normal-case text-foreground/80">· {nightlifeHint}</span>
              )}
            </p>
            <ul className="max-h-[240px] space-y-0.5 overflow-auto pr-1">
              {items
                .slice()
                .sort((a, b) => (a.tx_date! < b.tx_date! ? 1 : -1))
                .map((tx) => (
                  <li key={tx.id} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-elevated/50">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">
                      {tx.tx_date ? format(parseISO(tx.tx_date), "d MMM", { locale: es }) : "—"}
                    </span>
                     <span className="flex min-w-0 items-center gap-1.5 text-sm"><span className="truncate">{tx.merchant}</span>{parseShared(tx.description) && <Users className="size-3.5 shrink-0 text-positive" aria-label={t("Compartido", "Shared")} />}{parseShared(tx.description)?.name && <span className="truncate text-xs text-muted-foreground">· {parseShared(tx.description)?.name}</span>}</span>
                    <span className="numeric ml-auto text-sm font-medium">{fmt(Math.abs(tx.amount))}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroceryInsights({ summary, fmt, onCorrect, addedByGroup }: { summary: ReturnType<typeof summarizeGroceryReceipts>; fmt: (n: number) => string; onCorrect: (name: string, group: GroceryGroup) => void; addedByGroup: Map<GroceryGroup, string[]> }) {
  const t = useT();
  const [expanded, setExpanded] = useState<GroceryGroup | null>(null);
  const max = Math.max(...summary.groups.map((group) => group.amount), 1);
  return (
    <section className="pt-0" aria-label={t(`Análisis de ${summary.receiptCount} tickets del súper del mes`, `Analysis of ${summary.receiptCount} grocery receipts this month`)}>
      <div className="mt-1 grid min-w-0 gap-2 pl-11 pr-1 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-3 sm:gap-y-1">
        <p className="whitespace-nowrap text-xs text-muted-foreground">
          {t("Podrás cambiar de categoría si no se registra bien.", "You can change the category if it wasn't captured correctly.")}
        </p>
      </div>

      <TooltipProvider delayDuration={150}><div className="mt-2 divide-y divide-border/70">
        {[...summary.groups].sort((a, b) => b.amount - a.amount).map((group) => {
          const label = GROCERY_LABELS[group.id];
          const open = expanded === group.id;
          return (
            <div key={group.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1"><Button variant="ghost" className="h-auto min-w-0 justify-start rounded-md px-1 py-2 text-left hover:bg-elevated/50" onClick={() => setExpanded(open ? null : group.id)} aria-expanded={open} aria-label={`${t(label.es, label.en)}: ${fmt(group.amount)}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-sm" aria-hidden="true">{label.icon}</span>
                <span className="ml-2 grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(70px,0.7fr)] sm:items-center sm:gap-3">
                  <span className="min-w-0">
                    <span className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-2">
                      <span className="truncate text-xs font-medium text-foreground" title={t(label.es, label.en)}>{t(label.es, label.en)}</span>
                      <span className="numeric shrink-0 text-xs font-semibold text-foreground">{fmt(group.amount)}</span>
                    </span>
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {t(`${group.count} productos en tus tickets`, `${group.count} items on your receipts`)}
                    </span>
                  </span>
                  <span className="h-1 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", label.color)} style={{ width: `${Math.max(3, (group.amount / max) * 100)}%` }} /></span>
                </span>
                <ChevronDown className={cn("ml-1 size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
              </Button><Hint><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" aria-label={t(`Qué incluye ${label.es}`, `What ${label.en} includes`)}><Info className="size-3.5" /></Button></TooltipTrigger><TooltipContent side="top" className="max-w-60">{(() => { const detail = t(label.detailEs, label.detailEn); const extras = (addedByGroup.get(group.id) ?? []).join(", "); return extras ? `${detail}, ${extras}` : detail; })()}</TooltipContent></Hint></div>
              {open && (
                <ul className="mb-2 ml-9 space-y-1 border-l border-border pl-3">
                  {group.products.map((product) => {
                    const meta = [product.store, product.date ? format(parseISO(product.date), "d MMM", { locale: lang === "en" ? enUS : es }) : ""].filter(Boolean).join(" · ");
                    return (
                      <li key={product.name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-1.5 text-xs">
                        <span className="min-w-0 break-words text-foreground/90">{product.name}{product.count > 1 ? ` · ${product.count}×` : ""}</span>
                        <span className="numeric justify-self-end shrink-0 text-foreground">{fmt(product.amount)}</span>
                        <span className="min-w-0 truncate text-[11px] text-muted-foreground" title={meta}>{meta}</span>
                        <span className="relative justify-self-end">
                          <select aria-label={t(`Clasificar ${product.name}`, `Classify ${product.name}`)} value={group.id} onChange={(event) => onCorrect(product.name, event.target.value as GroceryGroup)} className="h-6 max-w-[8.5rem] min-w-0 cursor-pointer appearance-none rounded-md border border-border/70 bg-background/80 pl-2 pr-5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:max-w-[11rem]">
                            {GROCERY_GROUPS.map((id) => <option key={id} value={id}>{t(GROCERY_LABELS[id].es, GROCERY_LABELS[id].en)}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div></TooltipProvider>
      <p className="mt-2 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <ReceiptText className="size-3.5 shrink-0" />
        <span>{t("Tickets desglosados; si algo no cuadra, cámbialo.", "Itemized receipts; fix anything that's off.")}</span>
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  tone?: "positive" | "negative" | undefined;
}) {
  return (
    <div className="flex h-[94px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-elevated/40 p-3 sm:h-auto">
      <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight text-muted-foreground" title={label}>{label}</p>
      <p
        className={cn(
          "numeric text-xl font-semibold",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
