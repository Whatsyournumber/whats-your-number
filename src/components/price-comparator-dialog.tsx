import { useMemo } from "react";
import { Trophy } from "lucide-react";

import type { Tx } from "@/hooks/use-transactions";
import { receiptItemsFrom } from "@/lib/receipt-insights";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ComparatorKind = "groceries" | "nightlife";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: ComparatorKind;
  /** Historial completo de movimientos de esa categoría. */
  txs: Tx[];
  fmt: (n: number) => string;
  t: (es: string, en: string) => string;
};

const cleanStore = (s: string) =>
  s
    .replace(/\b(s\.?a\.?|s\.?l\.?|sucursal|tienda|madrid|barcelona)\b/gi, "")
    .replace(/[0-9#*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Palabras genéricas que no distinguen una tienda: "SUP.EX. PONZANO" y "Super Express Ponzano" son la misma. */
const GENERIC_STORE_TOKENS = new Set([
  "super", "supermercado", "sup", "ex", "exp", "expreso", "expres", "express", "market", "mercado",
  "tienda", "sucursal", "hiper", "hipermercado", "minimarket", "shop", "store", "sl", "sa",
  "de", "la", "el", "los", "las", "del", "y",
]);

const storeTokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !GENERIC_STORE_TOKENS.has(w) && !/^\d+$/.test(w));

const storeKey = (s: string) => {
  const tokens = storeTokens(s);
  return (tokens.length ? tokens : storeTokens(cleanStore(s))).slice(0, 2).join(" ");
};

const productKey = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\d+([.,]\d+)?\s*(g|gr|kg|ml|l|cl|ud|uds|x|pack)?\b/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");

const ENTRY_RE = /entrada|ticket|cover|acceso|lista|guest|entry/i;
const DRINK_RE = /trago|copa|cerveza|beer|gin|vodka|ron|rum|whisk|tequila|mojito|cocktail|coctel|cóctel|vino|wine|cava|champ|shot|chupito|botella|bottle|drink|refresco|agua/i;

export function PriceComparatorDialog({ open, onOpenChange, kind, txs, fmt, t }: Props) {
  const data = useMemo(() => {
    const stores = new Map<string, { name: string; names: Map<string, number>; total: number; visits: Set<string>; count: number; last: string }>();
    const products = new Map<string, { name: string; prices: Map<string, number[]> }>();
    const nightItems = { entry: new Map<string, number[]>(), drink: new Map<string, number[]>() };

    for (const tx of txs) {
      const raw = tx.merchant || tx.description || "";
      const key = storeKey(raw);
      if (!key) continue;
      const amount = Math.abs(Number(tx.amount) || 0);
      const day = String(tx.tx_date ?? "").slice(0, 10);
      const s = stores.get(key) ?? { name: cleanStore(raw) || raw, names: new Map<string, number>(), total: 0, visits: new Set(), count: 0, last: "" };
      const variant = cleanStore(raw) || raw;
      s.names.set(variant, (s.names.get(variant) ?? 0) + 1);
      // Nombre visible: la variante más frecuente; en empate, la más corta y limpia
      s.name = [...s.names.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]![0];
      s.total += amount;
      s.count += 1;
      if (day) s.visits.add(day);
      if (day > s.last) s.last = day;
      stores.set(key, s);

      for (const item of receiptItemsFrom(tx.description)) {
        if (kind === "nightlife") {
          const bucket = ENTRY_RE.test(item.name) ? nightItems.entry : DRINK_RE.test(item.name) ? nightItems.drink : null;
          if (bucket) bucket.set(key, [...(bucket.get(key) ?? []), item.amount]);
          continue;
        }
        const pk = productKey(item.name);
        if (pk.length < 3) continue;
        const p = products.get(pk) ?? { name: item.name, prices: new Map() };
        p.prices.set(key, [...(p.prices.get(key) ?? []), item.amount]);
        products.set(pk, p);
      }
    }

    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    const storeRows = [...stores.entries()]
      .map(([key, s]) => {
        const visits = kind === "nightlife" ? Math.max(1, s.visits.size) : s.count;
        return { key, name: s.name, total: s.total, visits, avg: s.total / Math.max(1, visits), last: s.last };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    const storeKeys = new Set(storeRows.map((r) => r.key));
    const nameOf = (k: string) => storeRows.find((r) => r.key === k)?.name ?? k;

    const productRows = [...products.values()]
      .map((p) => {
        const entries = [...p.prices.entries()].filter(([k]) => storeKeys.has(k)).map(([k, v]) => ({ store: k, price: avg(v), n: v.length }));
        return { name: p.name, entries, buys: entries.reduce((s, e) => s + e.n, 0) };
      })
      .filter((p) => p.entries.length > 0)
      .sort((a, b) => b.entries.length - a.entries.length || b.buys - a.buys)
      .slice(0, 10);

    const nightRows = (["entry", "drink"] as const).map((k) => ({
      kind: k,
      entries: [...nightItems[k].entries()].filter(([s]) => storeKeys.has(s)).map(([s, v]) => ({ store: s, price: avg(v), n: v.length })),
    }));

    const frequent = storeRows.filter((r) => r.visits >= 1);
    const cheapest = [...frequent].sort((a, b) => a.avg - b.avg)[0];
    const priciest = [...frequent].sort((a, b) => b.avg - a.avg)[0];
    const saving = cheapest && priciest && cheapest.key !== priciest.key ? (priciest.avg - cheapest.avg) * priciest.visits : 0;
    const months = new Set(txs.map((x) => String(x.tx_date ?? "").slice(0, 7)).filter(Boolean)).size || 1;

    return { storeRows, productRows, nightRows, cheapest, priciest, monthlySaving: saving / months, nameOf };
  }, [txs, kind]);

  const isNight = kind === "nightlife";
  const visitWord = isNight ? t("salidas", "nights") : t("compras", "trips");

  const PriceTable = ({ entries }: { entries: { store: string; price: number; n: number }[] }) => {
    const min = Math.min(...entries.map((e) => e.price));
    return (
      <div className="flex flex-wrap gap-1.5">
        {[...entries].sort((a, b) => a.price - b.price).map((e) => (
          <span
            key={e.store}
            className={cn(
              "numeric inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
              e.price === min && entries.length > 1 ? "bg-positive/15 text-positive" : "bg-muted/40 text-muted-foreground",
            )}
          >
            {data.nameOf(e.store).slice(0, 14)} {fmt(e.price)}
          </span>
        ))}
      </div>
    );
  };

  const sortedStores = [...data.storeRows].sort((a, b) => a.avg - b.avg);
  const winnerKey = sortedStores[0]?.key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-2xl overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle>{isNight ? t("Comparador de nightlife", "Nightlife comparator") : t("Comparador de supermercados", "Supermarket comparator")}</DialogTitle>
          <DialogDescription>{t("Con todo tu historial de gastos", "Using your full spending history")}</DialogDescription>
        </DialogHeader>

        {data.storeRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("Aún no hay gastos para comparar.", "No spending to compare yet.")}</p>
        ) : (
          <div className="min-w-0 space-y-5">
            {data.cheapest && (
              <div className="flex items-start gap-3 rounded-2xl border border-positive/30 bg-positive/10 p-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    {t("Ganador", "Winner")}: {data.cheapest.name} · {fmt(data.cheapest.avg)} {t("de media", "avg")}
                  </p>
                  {data.monthlySaving > 0 && data.priciest && (
                    <p className="text-xs text-muted-foreground">
                      {t(`Si cambias ${data.priciest.name} por ${data.cheapest.name} ahorras`, `Switch ${data.priciest.name} for ${data.cheapest.name} and save`)}{" "}
                      <span className="numeric font-semibold text-positive">{fmt(data.monthlySaving)}{t("/mes", "/mo")}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <section>
              <p className="mb-2 text-[12px] uppercase tracking-wide text-muted-foreground">
                {isNight ? t("Sitios", "Venues") : t("Supermercados", "Stores")}
              </p>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[340px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">{isNight ? t("Sitio", "Venue") : t("Tienda", "Store")}</th>
                      <th className="px-3 py-2 text-right font-medium">{visitWord}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("Total", "Total")}</th>
                      <th className="px-3 py-2 text-right font-medium">{isNight ? t("Por salida", "Per night") : t("Ticket medio", "Avg ticket")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStores.map((r) => (
                      <tr key={r.key} className={cn("border-b border-border/40 last:border-0", r.key === winnerKey && "bg-positive/10")}>
                        <td className="max-w-[140px] truncate px-3 py-2 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {r.key === winnerKey && <Trophy className="h-3.5 w-3.5 shrink-0 text-positive" />}
                            <span className="truncate">{r.name}</span>
                          </span>
                        </td>
                        <td className="numeric px-3 py-2 text-right text-muted-foreground">{r.visits}</td>
                        <td className="numeric px-3 py-2 text-right text-muted-foreground">{fmt(r.total)}</td>
                        <td className={cn("numeric px-3 py-2 text-right font-semibold", r.key === winnerKey && "text-positive")}>{fmt(r.avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {isNight ? (
              <section className="space-y-3">
                {data.nightRows.map((row) => (
                  <div key={row.kind}>
                    <p className="mb-1.5 text-[12px] uppercase tracking-wide text-muted-foreground">
                      {row.kind === "entry" ? t("Entradas", "Entry tickets") : t("Tragos", "Drinks")}
                    </p>
                    {row.entries.length ? (
                      <PriceTable entries={row.entries} />
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("Sube fotos de tickets para comparar precios.", "Upload receipt photos to compare prices.")}</p>
                    )}
                  </div>
                ))}
              </section>
            ) : (
              <section>
                <p className="mb-2 text-[12px] uppercase tracking-wide text-muted-foreground">{t("Productos: precio por tienda", "Products: price per store")}</p>
                {data.productRows.length ? (
                  <div className="overflow-x-auto rounded-xl border border-border/60">
                    <table className="w-full min-w-[340px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2 font-medium">{t("Producto", "Product")}</th>
                          {sortedStores.map((s) => (
                            <th key={s.key} className="max-w-[90px] truncate px-3 py-2 text-right font-medium">{s.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.productRows.map((p) => {
                          const min = Math.min(...p.entries.map((e) => e.price));
                          return (
                            <tr key={p.name} className="border-b border-border/40 last:border-0">
                              <td className="max-w-[130px] truncate px-3 py-2 font-medium">{p.name}</td>
                              {sortedStores.map((s) => {
                                const e = p.entries.find((x) => x.store === s.key);
                                return (
                                  <td
                                    key={s.key}
                                    className={cn(
                                      "numeric px-3 py-2 text-right",
                                      e && e.price === min && p.entries.length > 1 ? "font-semibold text-positive" : "text-muted-foreground",
                                    )}
                                  >
                                    {e ? fmt(e.price) : "—"}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("Sube fotos de tickets para comparar productos.", "Upload receipt photos to compare products.")}</p>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
