/** Monedas soportadas y ciudades base para deducir la moneda en el onboarding. */

import { currencies as WYN_CURRENCIES } from "@/lib/onboarding";

export type CurrencyInfo = { code: string; symbol: string; es: string; en: string };

function nameIn(locale: "es" | "en", code: string) {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "currency" });
    const name = dn.of(code);
    if (name && name !== code) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    /* Intl no disponible */
  }
  return code;
}

/** Misma lista de monedas que WhatsYourNumber, con las más usadas arriba. */
export const CURRENCIES: CurrencyInfo[] = WYN_CURRENCIES.map((c) => ({
  code: c.code,
  symbol: c.symbol,
  es: nameIn("es", c.code),
  en: nameIn("en", c.code),
}));


export type CityInfo = { city: string; country: string; currency: string; flag: string };

/** Ciudades frecuentes → moneda base. */
export const CITIES: CityInfo[] = [
  { city: "Madrid", country: "España", currency: "EUR", flag: "🇪🇸" },
  { city: "Barcelona", country: "España", currency: "EUR", flag: "🇪🇸" },
  { city: "Valencia", country: "España", currency: "EUR", flag: "🇪🇸" },
  { city: "Lisboa", country: "Portugal", currency: "EUR", flag: "🇵🇹" },
  { city: "París", country: "Francia", currency: "EUR", flag: "🇫🇷" },
  { city: "Berlín", country: "Alemania", currency: "EUR", flag: "🇩🇪" },
  { city: "Dublín", country: "Irlanda", currency: "EUR", flag: "🇮🇪" },
  { city: "Londres", country: "Reino Unido", currency: "GBP", flag: "🇬🇧" },
  { city: "Zúrich", country: "Suiza", currency: "CHF", flag: "🇨🇭" },
  { city: "Miami", country: "USA", currency: "USD", flag: "🇺🇸" },
  { city: "New York", country: "USA", currency: "USD", flag: "🇺🇸" },
  { city: "Los Angeles", country: "USA", currency: "USD", flag: "🇺🇸" },
  { city: "Toronto", country: "Canadá", currency: "CAD", flag: "🇨🇦" },
  { city: "Ciudad de México", country: "México", currency: "MXN", flag: "🇲🇽" },
  { city: "Bogotá", country: "Colombia", currency: "COP", flag: "🇨🇴" },
  { city: "Lima", country: "Perú", currency: "PEN", flag: "🇵🇪" },
  { city: "Santiago", country: "Chile", currency: "CLP", flag: "🇨🇱" },
  { city: "Buenos Aires", country: "Argentina", currency: "ARS", flag: "🇦🇷" },
  { city: "São Paulo", country: "Brasil", currency: "BRL", flag: "🇧🇷" },
  { city: "Panamá", country: "Panamá", currency: "USD", flag: "🇵🇦" },
  { city: "Quito", country: "Ecuador", currency: "USD", flag: "🇪🇨" },
  { city: "Sídney", country: "Australia", currency: "AUD", flag: "🇦🇺" },
];

/** Deduce la moneda a partir de un texto de ciudad libre. */
export function currencyForCity(input: string): string | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const hit =
    CITIES.find((c) => norm(c.city) === norm(q)) ??
    CITIES.find((c) => norm(c.city).includes(norm(q)) || norm(q).includes(norm(c.city))) ??
    CITIES.find((c) => norm(c.country).includes(norm(q)));
  return hit?.currency ?? null;
}

export function currencyLabel(code: string, lang: "es" | "en") {
  const c = CURRENCIES.find((x) => x.code === code);
  if (!c) return code;
  return `${c.code} · ${lang === "en" ? c.en : c.es}`;
}
