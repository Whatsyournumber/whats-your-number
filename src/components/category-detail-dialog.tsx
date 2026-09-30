import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, Info, ReceiptText, Sparkles } from "lucide-react";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { Button } from "@/components/ui/button";
import { Tooltip as Hint, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGroceryRules } from "@/hooks/use-grocery-rules";
import { useT } from "@/hooks/use-language";
import { merchantKey, type Tx } from "@/hooks/use-transactions";
import { GROCERY_GROUPS, GROCERY_LABELS, summarizeGroceryReceipts, type GroceryGroup } from "@/lib/receipt-insights";
import { cn } from "@/lib/utils";

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
      if (rule.origin === "corrected") continue;
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
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{name === "Nightlife" ? t("Nightlife / Ocio", "Nightlife / Leisure") : name}</DialogTitle>
          <DialogDescription>
            {t("Análisis del rubro en el periodo seleccionado.", "Category analysis for the selected period.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <div className="mt-1 rounded-2xl border border-border bg-elevated/40 p-3">
            <p className="mb-2 text-xs text-muted-foreground">{t("Evolución del rubro", "Category trend")}</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trend} margin={{ left: -12, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="catGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
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
        )}

        {grocery && grocery.receiptCount > 0 && (
          <section className="border-t border-border pt-3">
            <Button type="button" variant="ghost" className="h-auto w-full justify-between gap-2 px-1 py-1.5 text-left" aria-expanded={groceryOpen} aria-controls="grocery-receipt-insights" onClick={() => setGroceryOpen((v) => !v)}>
              <span className="flex min-w-0 items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><Sparkles className="size-3.5" /></span><span className="min-w-0 text-sm font-semibold whitespace-normal">{t(`Análisis de ${grocery.receiptCount} tickets del súper del mes`, `Analysis of ${grocery.receiptCount} grocery receipts this month`)}</span></span>
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
                    <span className="min-w-0 truncate text-sm">{tx.merchant}</span>
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
  const comparable = summary.previousReceiptCount > 0;
  const delta = summary.total - summary.previousTotal;
  const max = Math.max(...summary.groups.map((group) => group.amount), 1);
  return (
    <section className="pt-0" aria-label={t(`Análisis de ${summary.receiptCount} tickets del súper del mes`, `Analysis of ${summary.receiptCount} grocery receipts this month`)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 pl-9 -mt-1">
        <p className="min-w-0 text-xs text-muted-foreground">
          {t("Podrás cambiar de categoría si no se registra correctamente.", "You can change the category if it wasn't captured correctly.")}
        </p>
        {comparable && (
          <div className={cn("numeric rounded-md px-2 py-1 text-xs font-semibold", delta > 0 ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive")}>
            {delta > 0 ? "+" : delta < 0 ? "−" : ""}{fmt(Math.abs(delta))}
            <span className="ml-1 text-xs font-normal">{t("vs. tickets anteriores", "vs. prior receipts")}</span>
          </div>
        )}
      </div>

      <TooltipProvider delayDuration={150}><div className="mt-2 divide-y divide-border/70">
        {[...summary.groups].sort((a, b) => comparable
          ? (b.amount - b.previousAmount) - (a.amount - a.previousAmount)
          : b.amount - a.amount).map((group) => {
          const label = GROCERY_LABELS[group.id];
          const difference = group.amount - group.previousAmount;
          const open = expanded === group.id;
          return (
            <div key={group.id}>
              <div className="flex items-center gap-1"><Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start rounded-md px-1 py-2 text-left hover:bg-elevated/50" onClick={() => setExpanded(open ? null : group.id)} aria-expanded={open} aria-label={`${t(label.es, label.en)}: ${fmt(group.amount)}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-sm" aria-hidden="true">{label.icon}</span>
                <span className="ml-2 grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(70px,0.7fr)] sm:items-center sm:gap-3">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-xs font-medium text-foreground">{t(label.es, label.en)}</span>
                      <span className="numeric text-xs font-semibold text-foreground">{fmt(group.amount)}</span>
                      {comparable && <span className={cn("numeric text-xs", difference > 0 ? "text-negative" : "text-positive")}>{difference > 0 ? "+" : difference < 0 ? "−" : ""}{fmt(Math.abs(difference))}</span>}
                    </span>
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {comparable
                        ? t(`${group.count} productos vs. ${group.previousCount} antes`, `${group.count} items vs. ${group.previousCount} before`)
                        : t(`${group.count} productos en tus tickets`, `${group.count} items on your receipts`)}
                    </span>
                  </span>
                  <span className="h-1 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", label.color)} style={{ width: `${Math.max(3, (group.amount / max) * 100)}%` }} /></span>
                </span>
                <ChevronDown className={cn("ml-2 size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
              </Button><Hint><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" aria-label={t(`Qué incluye ${label.es}`, `What ${label.en} includes`)}><Info className="size-3.5" /></Button></TooltipTrigger><TooltipContent side="top" className="max-w-60">{(() => { const detail = t(label.detailEs, label.detailEn); const extras = (addedByGroup.get(group.id) ?? []).join(", "); return extras ? `${detail}, ${extras}` : detail; })()}</TooltipContent></Hint></div>
              {open && (
                <ul className="mb-2 ml-9 space-y-1 border-l border-border pl-3">
                  {group.products.map((product) => (
                    <li key={product.name} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 break-words text-muted-foreground">{product.name}{product.count > 1 ? ` · ${product.count}×` : ""}</span>
                      <span className="numeric ml-auto shrink-0 text-foreground">{fmt(product.amount)}</span>
                      <select aria-label={t(`Clasificar ${product.name}`, `Classify ${product.name}`)} value={group.id} onChange={(event) => onCorrect(product.name, event.target.value as GroceryGroup)} className="max-w-full rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground">
                        {GROCERY_GROUPS.map((id) => <option key={id} value={id}>{t(GROCERY_LABELS[id].es, GROCERY_LABELS[id].en)}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div></TooltipProvider>
      <p className="mt-2 flex items-center gap-1.5 whitespace-nowrap overflow-hidden border-t border-border pt-3 text-xs text-muted-foreground" title={t("Solo tickets desglosados; si no se registra bien, podrás cambiarlo y se guarda como regla para la próxima vez.", "Itemized receipts only; if something is misclassified, change it and it's saved as a rule for next time.")}>
        <ReceiptText className="size-3.5 shrink-0" />
        <span className="truncate">{t("Solo tickets desglosados; si algo no cuadra, cámbialo y se guarda como regla.", "Itemized receipts only; fix any item and it's saved as a rule.")}</span>
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
    <div className="rounded-2xl border border-border bg-elevated/40 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "numeric mt-1 text-lg font-semibold",
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
