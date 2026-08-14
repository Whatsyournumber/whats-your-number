const KEY = "wyn_pending_ref";

export function setPendingRef(code: string) {
  if (typeof window === "undefined") return;
  const clean = code.trim().toUpperCase().slice(0, 24);
  if (!clean) return;
  window.localStorage.setItem(KEY, clean);
}

export function getPendingRef(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function clearPendingRef() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
