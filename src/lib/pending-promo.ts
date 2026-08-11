const KEY = "wyn_pending_promo_code";

export function setPendingPromoCode(code: string) {
  if (typeof window === "undefined") return;
  const clean = code.trim().toUpperCase();
  if (!clean) return;
  window.localStorage.setItem(KEY, clean);
}

export function getPendingPromoCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function clearPendingPromoCode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
