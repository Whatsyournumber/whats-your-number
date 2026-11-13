/** Liquidity is shared with net worth regardless of the screen that created it. */
export function portfolioLiquidity<T extends { kind: string }>(holdings: T[]): T[] {
  return holdings.filter((holding) => ["cash", "bank", "money_market"].includes(holding.kind));
}

/** Holdings marked as loans (note contains "liability:loan") are never portfolio assets. */
export function isLoanHolding<T extends { note?: string | null }>(holding: T): boolean {
  return !!holding.note && holding.note.includes("liability:loan");
}
/** Cash, bank and money-market holdings are edited as one balance amount. */
export function isLiquidityKind(kind: string): boolean {
  return ["cash", "bank", "money_market"].includes(kind);
}

/** Saved balance of a liquidity holding, whichever amount field holds it. */
export function liquidityBalance(holding: { manual_value?: number | null; cost_basis?: number | null }): number {
  const manual = Number(holding.manual_value) || 0;
  return manual > 0 ? manual : Number(holding.cost_basis) || 0;
}
