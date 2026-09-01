/**
 * Regional pricing (USD only).
 *
 * Los nombres de los tiers (accessible / standard / premium) son INTERNOS.
 * Nunca deben mostrarse al usuario: el visitante solo ve Free / Pro / Family
 * con el precio que corresponde a su región.
 *
 * `standard` es el tier por defecto para cualquier país no listado.
 * La IP solo sirve para mostrar el precio inicial; el precio final lo valida
 * Paddle en el checkout con el país de facturación (unit_price_overrides).
 */

export type PricingTier = "accessible" | "standard" | "premium";
export type BillingCycle = "monthly" | "yearly";

/** Tier 1 — Accessible: LatAm, África, sur/este de Europa y Asia emergente. */
export const ACCESSIBLE_COUNTRIES = [
  // LatAm & Caribe
  "MX", "GT", "BZ", "SV", "HN", "NI", "CR", "PA", "CU", "DO", "HT", "JM", "TT",
  "BS", "BB", "CO", "VE", "EC", "PE", "BO", "PY", "UY", "AR", "CL", "BR", "GY", "SR",
  // África (todo el continente)
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CD", "CG",
  "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
  "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
  "ZM", "ZW",
  // Sur / este de Europa y equivalentes
  "ES", "PT", "IT", "GR", "CY", "MT", "PL", "CZ", "SK", "HU", "RO", "BG", "HR",
  "SI", "EE", "LV", "LT", "RS", "BA", "MK", "AL", "ME", "UA", "MD", "GE", "AM", "AZ",
  // Asia emergente y Oriente Medio no premium
  "TR", "IN", "ID", "PH", "VN", "TH", "MY", "BD", "PK", "LK", "NP", "KH", "LA",
  "MM", "MN", "UZ", "KZ", "KG", "TJ", "JO", "LB", "IQ",
] as const;

/** Tier 3 — Premium: Norteamérica, Australia, Suiza y países nórdicos. */
export const PREMIUM_COUNTRIES = ["US", "CA", "AU", "CH", "NO", "SE", "DK", "FI", "IS"] as const;

const ACCESSIBLE = new Set<string>(ACCESSIBLE_COUNTRIES);
const PREMIUM = new Set<string>(PREMIUM_COUNTRIES);

export function tierForCountry(country: string | null | undefined): PricingTier {
  if (!country) return "standard";
  const code = country.trim().toUpperCase();
  if (PREMIUM.has(code)) return "premium";
  if (ACCESSIBLE.has(code)) return "accessible";
  return "standard";
}

export interface PlanPrice {
  monthly: number;
  yearly: number;
}

/** Precios visibles por tier (mismo número, la moneda cambia según región). */
export const TIER_PRICES: Record<PricingTier, { pro: PlanPrice; family: PlanPrice }> = {
  accessible: {
    pro: { monthly: 2.99, yearly: 29 },
    family: { monthly: 5.99, yearly: 53 },
  },
  standard: {
    pro: { monthly: 5.99, yearly: 59 },
    family: { monthly: 9.99, yearly: 89 },
  },
  premium: {
    pro: { monthly: 8.99, yearly: 89 },
    family: { monthly: 12.99, yearly: 116 },
  },
};

/**
 * Perfil extra del plan Familiar (a partir del 4º perfil, contando adultos e hijos).
 * Escala con el tier regional igual que el resto de precios.
 */
export const EXTRA_SEAT_PRICE: Record<PricingTier, number> = {
  accessible: 2,
  standard: 3,
  premium: 4,
};

export type DisplayCurrency = "USD" | "EUR";

/** Europa (incl. no-UE): mostramos precios en EUR. */
const EUROPE_COUNTRIES = new Set<string>([
  "ES", "PT", "IT", "GR", "CY", "MT", "PL", "CZ", "SK", "HU", "RO", "BG", "HR",
  "SI", "EE", "LV", "LT", "RS", "BA", "MK", "AL", "ME", "UA", "MD",
  "FR", "DE", "BE", "NL", "LU", "AT", "IE", "CH", "NO", "SE", "DK", "FI", "IS",
  "GB", "LI", "MC", "AD", "SM", "VA",
]);

export function currencyForCountry(country: string | null | undefined): DisplayCurrency {
  if (!country) return "USD";
  return EUROPE_COUNTRIES.has(country.trim().toUpperCase()) ? "EUR" : "USD";
}

const SYMBOL: Record<DisplayCurrency, string> = { USD: "$", EUR: "€" };

export function formatMoney(amount: number, currency: DisplayCurrency = "USD"): string {
  const s = SYMBOL[currency];
  return Number.isInteger(amount) ? `${s}${amount}` : `${s}${amount.toFixed(2)}`;
}

export function formatUsd(amount: number): string {
  return formatMoney(amount, "USD");
}

/** Precio mensual equivalente del plan anual, ej. 29/12 = 2.42 */
export function monthlyEquivalent(yearly: number, currency: DisplayCurrency = "USD"): string {
  return `${SYMBOL[currency]}${(yearly / 12).toFixed(2)}`;
}

