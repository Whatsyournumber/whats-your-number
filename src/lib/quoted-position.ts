/** Reglas para completar una posición cotizada (ETF/acción): con dos datos calculamos el tercero. */
export type QuotedPositionInput = {
  kind: string;
  quantity: number;
  costBasis: number;
  /** Precio de entrada que escribió el usuario (0 si lo dejó vacío). */
  entryPrice: number;
  /** Cierre del ticker en la fecha de compra, ya en la moneda del perfil. */
  purchasePrice: number | null;
};

export type QuotedPosition = { quantity: number; costBasis: number; entryPrice: number };

export const UNITS_FROM_AMOUNT_KINDS = ["etf", "stock"] as const;

const isQuoted = (kind: string) => (UNITS_FROM_AMOUNT_KINDS as readonly string[]).includes(kind);
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Hace falta el precio de la fecha de compra cuando no hay precio de entrada y solo hay unidades o solo monto. */
export function needsPurchasePrice(input: Omit<QuotedPositionInput, "purchasePrice">): boolean {
  if (!isQuoted(input.kind) || input.entryPrice > 0) return false;
  const hasQty = input.quantity > 0;
  const hasCost = input.costBasis > 0;
  return hasQty !== hasCost;
}

/**
 * Unidades, inversión inicial y precio de entrada: el que falte se calcula con los otros dos.
 * Si falta el precio de entrada, usamos el cierre de la fecha de compra.
 */
export function resolveQuotedPosition(input: QuotedPositionInput): QuotedPosition {
  const { kind, quantity, costBasis, entryPrice, purchasePrice } = input;
  if (!isQuoted(kind)) return { quantity, costBasis, entryPrice };
  const hasQty = quantity > 0;
  const hasCost = costBasis > 0;
  if (hasQty && hasCost) {
    return { quantity, costBasis, entryPrice: entryPrice > 0 ? entryPrice : round(costBasis / quantity, 2) };
  }
  const price = entryPrice > 0 ? entryPrice : purchasePrice && purchasePrice > 0 ? round(purchasePrice, 2) : 0;
  if (price <= 0) return { quantity, costBasis, entryPrice };
  if (hasCost) return { quantity: round(costBasis / price, 6), costBasis, entryPrice: price };
  if (hasQty) return { quantity, costBasis: round(quantity * price, 2), entryPrice: price };
  return { quantity, costBasis, entryPrice };
}
