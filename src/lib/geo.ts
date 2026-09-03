/**
 * Detección de región del visitante (proxy de IP) usando la zona horaria del
 * navegador + el idioma del sistema. Sirve para elegir moneda e idioma por defecto.
 */

export type Currency = "EUR" | "USD";
export type DetectedLang = "es" | "en";

/** Zonas horarias de países de la Unión Europea / zona euro. */
const EU_ZONES = new Set([
  "Europe/Madrid",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Athens",
  "Europe/Luxembourg",
  "Europe/Ljubljana",
  "Europe/Bratislava",
  "Europe/Tallinn",
  "Europe/Riga",
  "Europe/Vilnius",
  "Europe/Malta",
  "Europe/Nicosia",
  "Asia/Nicosia",
  "Europe/Zagreb",
  "Europe/Sofia",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Prague",
  "Europe/Warsaw",
  "Europe/Copenhagen",
  "Europe/Stockholm",
  "Atlantic/Canary",
]);

/** Zonas horarias de Hispanoamérica + España. */
const SPANISH_ZONES = new Set([
  "Europe/Madrid",
  "Atlantic/Canary",
  "America/Mexico_City",
  "America/Tijuana",
  "America/Monterrey",
  "America/Cancun",
  "America/Chihuahua",
  "America/Merida",
  "America/Hermosillo",
  "America/Mazatlan",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Montevideo",
  "America/Asuncion",
  "America/La_Paz",
  "America/Guayaquil",
  "America/Panama",
  "America/Costa_Rica",
  "America/Guatemala",
  "America/Tegucigalpa",
  "America/El_Salvador",
  "America/Managua",
  "America/Havana",
  "America/Santo_Domingo",
  "America/Puerto_Rico",
]);

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

const GEO_CACHE_KEY = "wyn-geo-currency";

/**
 * Moneda por defecto: primero el resultado cacheado de la detección por IP
 * (Europa → EUR, resto del mundo → USD); si aún no llegó, fallback por zona
 * horaria/locale.
 */
export function defaultCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached === "EUR" || cached === "USD") return cached;
  } catch {
    // localStorage no disponible
  }
  return detectCurrency();
}

/** Lanza la detección por IP una sola vez y cachea el resultado. */
export async function initGeoCurrency(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(GEO_CACHE_KEY)) return;
  } catch {
    return;
  }
  try {
    const { detectRegionByIp } = await import("@/lib/geo-currency.functions");
    const result = await detectRegionByIp();
    const currency = result?.currency === "EUR" ? "EUR" : "USD";
    localStorage.setItem(GEO_CACHE_KEY, currency);
  } catch {
    try {
      localStorage.setItem(GEO_CACHE_KEY, detectCurrency());
    } catch {
      // sin caché disponible
    }
  }
}

/** EUR si el visitante está en la UE, USD en el resto del mundo. */
export function detectCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  const tz = timeZone();
  if (EU_ZONES.has(tz)) return "EUR";
  const locale = (navigator.language || "").toLowerCase();
  if (/-(es|pt|fr|de|it|nl|be|at|ie|fi|gr|lu|si|sk|ee|lv|lt|mt|cy|hr)$/.test(locale)) return "EUR";
  return "USD";
}

/** Español si el visitante está en España o Hispanoamérica, inglés en el resto. */
export function detectLang(): DetectedLang {
  if (typeof window === "undefined") return "en";
  const tz = timeZone();
  if (SPANISH_ZONES.has(tz)) return "es";
  const langs = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean);
  if (langs.some((l) => l.toLowerCase().startsWith("es"))) return "es";
  return "en";
}
