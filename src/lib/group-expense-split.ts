import { expenseSplit, type ExpenseSplitMode } from "./expense-split";

export function groupExpenseShares(total: number, partnerCount: number, mode: ExpenseSplitMode = "equal", percent = 50, amount = 0): number[] {
  if (partnerCount < 1) return [];
  if (partnerCount === 1) {
    const { mine, theirs } = expenseSplit(total, mode, percent, amount);
    return [mine, theirs];
  }
  const cents = Math.max(0, Math.round(total * 100));
  const count = partnerCount + 1;
  const base = Math.floor(cents / count);
  const remainder = cents % count;
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
}