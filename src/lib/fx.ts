/**
 * Conversión multimoneda para los movimientos importados.
 * Tasas por unidad de USD (1 USD = X moneda). Se parte de una tabla de respaldo
 * y se actualiza con las tasas del día (open.er-api.com) para que los EEFF en
 * cualquier divisa se homogeneicen a la moneda del perfil.
 */
const FALLBACK_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.8706,
  GBP: 0.7482,
  CHF: 0.8247,
  SEK: 9.8208,
  NOK: 9.4206,
  DKK: 6.5137,
  ISK: 121.83,
  PLN: 3.7959,
  CZK: 21.18,
  HUF: 316.22,
  RON: 4.583,
  BGN: 1.7028,
  RSD: 102.27,
  HRK: 6.5597,
  ALL: 79.61,
  MKD: 53.35,
  BAM: 1.7028,
  MDL: 17.49,
  TRY: 48.73,
  RUB: 84.47,
  UAH: 44.69,
  BYN: 3.0325,
  GEL: 2.6042,
  AMD: 363.61,
  AZN: 1.6999,
  KZT: 445.57,
  UZS: 11802,
  KGS: 87.48,
  TJS: 9.2272,
  TMT: 3.502,
  MNT: 3628,
  CAD: 1.3979,
  MXN: 17.19,
  BRL: 5.1363,
  ARS: 1510,
  CLP: 953.44,
  COP: 3129,
  PEN: 3.368,
  UYU: 40.36,
  PYG: 5950,
  BOB: 11.11,
  DOP: 58.79,
  CRC: 448.5,
  GTQ: 7.6399,
  HNL: 26.85,
  NIO: 36.75,
  PAB: 1,
  VES: 848.55,
  CUP: 24,
  JMD: 157.91,
  TTD: 6.7801,
  BBD: 2,
  BSD: 1,
  BZD: 2,
  XCD: 2.7,
  HTG: 130.71,
  SRD: 37.85,
  GYD: 209.29,
  AUD: 1.406,
  NZD: 1.7443,
  FJD: 2.2277,
  PGK: 4.4907,
  JPY: 155.84,
  CNY: 6.7218,
  HKD: 7.8452,
  TWD: 31.86,
  MOP: 8.0806,
  SGD: 1.2757,
  KRW: 1381,
  INR: 95.96,
  PKR: 277.28,
  BDT: 123.06,
  LKR: 331.88,
  NPR: 153.53,
  IDR: 17741,
  THB: 33.29,
  PHP: 62.78,
  MYR: 4.0964,
  VND: 25964,
  KHR: 4047,
  LAK: 22315,
  MMK: 2101,
  BND: 1.2756,
  AED: 3.6725,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.3082,
  BHD: 0.376,
  OMR: 0.3845,
  JOD: 0.709,
  LBP: 89500,
  ILS: 3.0288,
  IQD: 1309,
  IRR: 1393138,
  YER: 236.56,
  SYP: 121.77,
  EGP: 52.14,
  MAD: 9.4901,
  DZD: 133.8,
  TND: 2.9232,
  LYD: 6.3537,
  SDG: 511.65,
  ETB: 161.33,
  KES: 129.53,
  UGX: 3776,
  TZS: 2645,
  RWF: 1474,
  ZAR: 16.26,
  NGN: 1330,
  GHS: 11.44,
  XOF: 571.09,
  XAF: 571.09,
  CDF: 2311,
  ZMW: 19.34,
  MWK: 1745,
  MZN: 63.8,
  BWP: 13.88,
  NAD: 16.26,
  MUR: 47.39,
  MGA: 4362,
  AOA: 921.4,
  SLL: 24668,
  GMD: 74.62,
  LRD: 174.02,
  SOS: 571.59,
  ZWL: 26.67,
};

/** Tasas activas (respaldo + tasas del día cuando ya se cargaron). */
export const FX_PER_USD: Record<string, number> = { ...FALLBACK_PER_USD };

let liveUpdatedAt: string | null = null;

/** Aplica las tasas del día descargadas del proveedor. */
export function setLiveRates(rates: Record<string, number>, updatedAt?: string) {
  for (const [code, value] of Object.entries(rates)) {
    if (Number.isFinite(value) && value > 0) FX_PER_USD[code.toUpperCase()] = value;
  }
  liveUpdatedAt = updatedAt ?? new Date().toISOString();
}

export const getRatesUpdatedAt = () => liveUpdatedAt;

export const isKnownCurrency = (code: string | null | undefined) =>
  Boolean(code && FX_PER_USD[code.toUpperCase()]);

/** Convierte un monto de una moneda a otra. Si alguna es desconocida, devuelve el monto tal cual. */
export function convertAmount(amount: number, from: string | null | undefined, to: string | null | undefined): number {
  const f = (from || "USD").toUpperCase();
  const t = (to || "USD").toUpperCase();
  if (f === t) return amount;
  const rf = FX_PER_USD[f];
  const rt = FX_PER_USD[t];
  if (!rf || !rt) return amount;
  return (amount / rf) * rt;
}

/** Todos los códigos ISO soportados, ordenados alfabéticamente. */
export const SUPPORTED_CURRENCY_CODES = Object.keys(FALLBACK_PER_USD).sort();

/** Campos monetarios del perfil que deben reconvertirse al cambiar de moneda. */
export const PROFILE_MONEY_FIELDS = [
  "income_salary",
  "income_bonus",
  "income_rent",
  "income_other",
  "income_business",
  "income_partner_salary",
  "income_partner_other",
  "expenses_partner",
  "monthly_expenses",
  "monthly_savings",
  "fixed_housing",
  "fixed_utilities",
  "fixed_groceries",
  "fixed_insurance",
  "fixed_health",
  "fixed_transport",
  "fixed_education",
  "fixed_family",
  "fixed_debt",
  "fixed_subscriptions",
  "fixed_savings",
  "fixed_other",
  "fixed_restaurants",
  "fixed_delivery",
  "fixed_travel",
  "fixed_nightlife",
  "fixed_shopping",
  "fixed_gym",
  "fixed_professional",
  "assets_cash",
  "assets_bank",
  "assets_retirement",
  "assets_etf",
  "assets_stocks",
  "assets_crypto",
  "assets_property",
  "liabilities",
  "mortgage_balance",
  "desired_retirement_income",
] as const;

/** Redondeo amable según la magnitud de la moneda destino. */
function roundForCurrency(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 100000) return Math.round(value / 100) * 100;
  if (abs >= 10000) return Math.round(value / 10) * 10;
  if (abs >= 100) return Math.round(value);
  return Math.round(value * 100) / 100;
}

/**
 * Reconvierte todos los importes del perfil de una moneda a otra usando las
 * tasas del día ya cargadas en FX_PER_USD.
 */
export function convertProfileCurrency<T extends Record<string, unknown>>(profile: T, from: string, to: string): T {
  if (!from || !to || from.toUpperCase() === to.toUpperCase()) return profile;
  const next = { ...profile } as Record<string, unknown>;
  for (const key of PROFILE_MONEY_FIELDS) {
    const raw = Number(next[key]);
    if (!Number.isFinite(raw) || raw === 0) continue;
    next[key] = roundForCurrency(convertAmount(raw, from, to));
  }
  return next as T;
}

/** Reconvierte una lista de importes sueltos (p. ej. gastos fijos locales). */
export const convertMoneyValue = (value: number, from: string, to: string) =>
  roundForCurrency(convertAmount(value, from, to));

/**
 * Descarga las tasas de mercado del día (base USD) y las aplica antes de
 * convertir. Si ya se refrescaron hace menos de 1h, reutiliza las cargadas.
 */
let ratesPromise: Promise<void> | null = null;
let lastFetch = 0;

export async function ensureLiveRates(force = false): Promise<boolean> {
  const fresh = Date.now() - lastFetch < 1000 * 60 * 60;
  if (!force && fresh && liveUpdatedAt) return true;
  if (!ratesPromise) {
    ratesPromise = (async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) return;
        const json = (await res.json()) as { rates?: Record<string, number>; time_last_update_utc?: string };
        if (json.rates) {
          setLiveRates(json.rates, json.time_last_update_utc);
          lastFetch = Date.now();
        }
      } catch {
        /* sin red: se usan las tasas de respaldo */
      } finally {
        ratesPromise = null;
      }
    })();
  }
  await ratesPromise;
  return Boolean(liveUpdatedAt);
}
