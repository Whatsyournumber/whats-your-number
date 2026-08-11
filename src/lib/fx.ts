/**
 * Conversión multimoneda para los movimientos importados.
 * Tasas aproximadas por unidad de USD (1 USD = X moneda). Se usan para
 * homogeneizar los EEFF cargados en cualquier divisa a la moneda del perfil.
 */
export const FX_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.88,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.9,
  PLN: 3.95,
  CZK: 23.2,
  HUF: 355,
  RON: 4.58,
  TRY: 34.5,
  RUB: 92,
  UAH: 41,
  CAD: 1.36,
  MXN: 18.5,
  BRL: 5.5,
  ARS: 980,
  CLP: 950,
  COP: 4100,
  PEN: 3.75,
  UYU: 40,
  DOP: 59,
  CRC: 520,
  GTQ: 7.8,
  PAB: 1,
  VES: 40,
  AUD: 1.52,
  NZD: 1.65,
  JPY: 152,
  CNY: 7.2,
  HKD: 7.8,
  SGD: 1.35,
  KRW: 1350,
  INR: 83,
  IDR: 15800,
  THB: 35,
  PHP: 57,
  MYR: 4.6,
  VND: 25000,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  ILS: 3.7,
  EGP: 48,
  MAD: 9.9,
  ZAR: 18.3,
  NGN: 1550,
  KES: 129,
};

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
