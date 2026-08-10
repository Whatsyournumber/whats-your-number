/**
 * Snapshot del demo gratuito ("Tu número" en 3 preguntas).
 * Se guarda en el navegador para poder rellenar el número del dashboard
 * cuando el perfil todavía no tiene datos cargados.
 */

const KEY = "yn.demo";

export type DemoSnapshot = {
  monthlySpend: number;
  netWorth: number;
  monthlyInvest: number;
  currency: "EUR" | "USD";
  savedAt: number;
};

export function saveDemoSnapshot(s: Omit<DemoSnapshot, "savedAt">) {
  if (typeof window === "undefined") return;
  if (s.monthlySpend <= 0) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
  } catch {
    /* storage no disponible */
  }
}

export function readDemoSnapshot(): DemoSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSnapshot;
    if (!parsed || typeof parsed.monthlySpend !== "number" || parsed.monthlySpend <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
