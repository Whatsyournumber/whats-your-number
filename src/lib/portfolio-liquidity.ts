/** Liquidity is shared with net worth regardless of the screen that created it. */
export function portfolioLiquidity<T extends { kind: string }>(holdings: T[]): T[] {
  return holdings.filter((holding) => ["cash", "bank", "money_market"].includes(holding.kind));
}