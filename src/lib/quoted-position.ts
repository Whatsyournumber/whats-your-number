/** Reglas para completar una posición cotizada (ETF/acción) a partir del monto invertido. */
export type QuotedPositionInput = {
  kind: string;
  quantity: number;
  costBasis: number;
  /** Precio de entrada que escribió el usuario (0 si lo dejó vacío). */
  entryPrice: number;
  /** Cierre del ticker en la fecha de compra, ya en la moneda del perfil. */
  purchasePrice: number | null;
};

export const UNITS_FROM_AMOUNT_KINDS = ["etf", "stock"] as const;

export function needsPurchasePrice(input: Omit<QuotedPositionInput, "purchasePrice">): boolean {
  return (
    (UNITS_FROM_AMOUNT_KINDS as readonly string[]).includes(input.kind) &&
    input.quantity <= 0 &&
    input.costBasis > 0 &&
    input.entryPrice <= 0
  );
}

/** Sin unidades: unidades = inversión inicial ÷ precio de entrada (el del usuario o el de la fecha de compra). */
export function resolveQuotedPosition(input: QuotedPositionInput): { quantity: number; entryPrice: number } {
  const { kind, quantity, costBasis, entryPrice, purchasePrice } = input;
  if (!(UNITS_FROM_AMOUNT_KINDS as readonly string[]).includes(kind) || quantity > 0 || costBasis <= 0) {
    return { quantity, entryPrice };
  }
  const price = entryPrice > 0 ? entryPrice : purchasePrice && purchasePrice > 0 ? purchasePrice : 0;
  if (price <= 0) return { quantity, entryPrice };
  return {
    quantity: Math.round((costBasis / price) * 1e6) / 1e6,
    entryPrice: Math.round(price * 100) / 100,
  };
}
