/** Liquidity is shared with net worth regardless of the screen that created it. */
export function portfolioLiquidity<T extends { kind: string }>(holdings: T[]): T[] {
  return holdings.filter((holding) => ["cash", "bank", "money_market"].includes(holding.kind));
}

/** Holdings marked as loans (note contains "liability:loan") are never portfolio assets. */
export function isLoanHolding<T extends { note?: string | null }>(holding: T): boolean {
  return !!holding.note && holding.note.includes("liability:loan");
}