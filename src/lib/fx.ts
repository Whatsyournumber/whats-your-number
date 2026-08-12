/**
 * Conversión multimoneda para los movimientos importados.
 * Tasas por unidad de USD (1 USD = X moneda). Se parte de una tabla de respaldo
 * y se actualiza con las tasas del día (open.er-api.com) para que los EEFF en
 * cualquier divisa se homogeneicen a la moneda del perfil.
 */
const FALLBACK_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.88,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.9,
  ISK: 138,
  PLN: 3.95,
  CZK: 23.2,
  HUF: 355,
  RON: 4.58,
  BGN: 1.8,
  RSD: 108,
  HRK: 6.9,
  ALL: 92,
  MKD: 56.5,
  BAM: 1.8,
  MDL: 17.8,
  TRY: 34.5,
  RUB: 92,
  UAH: 41,
  BYN: 3.3,
  GEL: 2.7,
  AMD: 390,
  AZN: 1.7,
  KZT: 480,
  UZS: 12800,
  KGS: 86,
  TJS: 10.9,
  TMT: 3.5,
  MNT: 3400,
  CAD: 1.36,
  MXN: 18.5,
  BRL: 5.5,
  ARS: 980,
  CLP: 950,
  COP: 4100,
  PEN: 3.75,
  UYU: 40,
  PYG: 7800,
  BOB: 6.9,
  DOP: 59,
  CRC: 520,
  GTQ: 7.8,
  HNL: 24.7,
  NIO: 36.8,
  PAB: 1,
  VES: 40,
  CUP: 24,
  JMD: 157,
  TTD: 6.8,
  BBD: 2,
  BSD: 1,
  BZD: 2,
  XCD: 2.7,
  HTG: 132,
  SRD: 35,
  GYD: 209,
  AUD: 1.52,
  NZD: 1.65,
  FJD: 2.25,
  PGK: 3.9,
  JPY: 152,
  CNY: 7.2,
  HKD: 7.8,
  TWD: 32.4,
  MOP: 8,
  SGD: 1.35,
  KRW: 1350,
  INR: 83,
  PKR: 278,
  BDT: 120,
  LKR: 295,
  NPR: 133,
  IDR: 15800,
  THB: 35,
  PHP: 57,
  MYR: 4.6,
  VND: 25000,
  KHR: 4100,
  LAK: 21800,
  MMK: 2100,
  BND: 1.35,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.376,
  OMR: 0.385,
  JOD: 0.71,
  LBP: 89500,
  ILS: 3.7,
  IQD: 1310,
  IRR: 42000,
  YER: 250,
  SYP: 13000,
  EGP: 48,
  MAD: 9.9,
  DZD: 134,
  TND: 3.1,
  LYD: 4.8,
  SDG: 601,
  ETB: 120,
  KES: 129,
  UGX: 3700,
  TZS: 2700,
  RWF: 1350,
  ZAR: 18.3,
  NGN: 1550,
  GHS: 15.6,
  XOF: 604,
  XAF: 604,
  CDF: 2850,
  ZMW: 26.5,
  MWK: 1735,
  MZN: 63.8,
  BWP: 13.4,
  NAD: 18.3,
  MUR: 46.5,
  MGA: 4550,
  AOA: 910,
  SLL: 22000,
  GMD: 70,
  LRD: 195,
  SOS: 571,
  ZWL: 26,
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
  "monthly_expenses",
  "monthly_savings",
  "fixed_housing",
  "fixed_utilities",
  "fixed_insurance",
  "fixed_transport",
  "fixed_education",
  "fixed_subscriptions",
  "fixed_savings",
  "fixed_other",
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
