import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/hooks/use-language";
import type { Tx } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  items: Tx[];
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
  amount,
  prevAmount,
  periodTotal,
  days,
  fmt,
  fmtCompact,
}: Props) {
  const t = useT();
  const byMonth = days > 62;

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
      const key = tx.merchant?.trim() || t("Sin comercio", "Unknown");
      const prev = map.get(key) ?? { name: key, amount: 0, count: 0 };
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{name}</DialogTitle>
          <DialogDescription>
            {t("Análisis del rubro en el periodo seleccionado.", "Category analysis for the selected period.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("Total", "Total")} value={fmt(amount)} />
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
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("Movimientos", "Transactions")}</p>
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
