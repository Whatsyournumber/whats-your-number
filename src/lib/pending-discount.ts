const KEY = "wyn_checkout_discount";

export type PendingDiscount = { code: string; label: string };

/** Descuento validado en Paddle que debe aplicarse al abrir el checkout. */
export function setPendingDiscount(discount: PendingDiscount) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(discount));
}

export function getPendingDiscount(): PendingDiscount | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingDiscount;
    return parsed?.code ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingDiscount() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
