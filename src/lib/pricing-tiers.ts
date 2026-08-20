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

/** Precios visibles en USD por tier. */
export const TIER_PRICES: Record<PricingTier, { pro: PlanPrice; family: PlanPrice }> = {
  accessible: {
    pro: { monthly: 2.99, yearly: 29 },
    family: { monthly: 5.99, yearly: 59 },
  },
  standard: {
    pro: { monthly: 5.99, yearly: 59 },
    family: { monthly: 9.99, yearly: 99 },
  },
  premium: {
    pro: { monthly: 8.99, yearly: 89 },
    family: { monthly: 12.99, yearly: 129 },
  },
};

export function formatUsd(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/** Precio mensual equivalente del plan anual, ej. 29/12 = 2.42 */
export function monthlyEquivalent(yearly: number): string {
  return `$${(yearly / 12).toFixed(2)}`;
}
