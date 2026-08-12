/** Ciudades que el usuario eligió a mano (máx. 3). Se guardan en este navegador. */
const KEY = "wyn:my-cities";
const EVENT = "wyn:my-cities-changed";

export function readMyCities(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function saveMyCities(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 3)));
  } catch {
    /* almacenamiento no disponible */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeMyCities(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
