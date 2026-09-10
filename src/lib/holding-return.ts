import type { DailyPoint, SeriesPoint } from "@/lib/market.server";

/**
 * Precio de compra por unidad de una posición:
 * 1) Si hay unidades y monto de compra → monto / unidades.
 * 2) Si hay serie diaria y fecha de alta → cierre real del día de compra
 *    (o el día hábil anterior más cercano).
 * 3) Si no, el cierre real del mes en que se registró el activo (serie de 12 meses).
 */
export function purchaseUnitPrice(
  h: { quantity: number; cost_basis: number; created_at?: string | null },
  series?: SeriesPoint[] | null,
  daily?: DailyPoint[] | null,
): number | null {
  if (h.quantity > 0 && h.cost_basis > 0) return h.cost_basis / h.quantity;
  if (!h.created_at) return null;
  const bought = new Date(h.created_at);
  if (Number.isNaN(bought.getTime())) return null;
  const boughtSec = bought.getTime() / 1000;

  // Serie diaria: precisión del día exacto (compras recientes, p. ej. hace 2 días).
  if (daily && daily.length >= 2) {
    let best: DailyPoint | null = null;
    for (const p of daily) {
      if (p.t <= boughtSec && (!best || p.t > best.t)) best = p;
    }
    if (!best) best = daily[0] ?? null;
    if (best && best.price > 0) return best.price;
  }

  if (!series || series.length < 2) return null;
  const now = new Date();
  const monthsAgo =
    (now.getUTCFullYear() - bought.getUTCFullYear()) * 12 + (now.getUTCMonth() - bought.getUTCMonth());
  const idx = Math.min(series.length - 1, Math.max(0, series.length - 1 - monthsAgo));
  const p = series[idx]?.price;
  return typeof p === "number" && p > 0 ? p : null;
}

/** Rentabilidad % del activo: precio de hoy vs precio del día de compra. */
export function marketReturnPct(
  h: { quantity: number; cost_basis: number; created_at?: string | null },
  livePrice: number | null | undefined,
  series?: SeriesPoint[] | null,
  daily?: DailyPoint[] | null,
): number | null {
  if (!livePrice || livePrice <= 0) return null;
  const buy = purchaseUnitPrice(h, series, daily);
  if (!buy || buy <= 0) return null;
  return (livePrice / buy - 1) * 100;
}
