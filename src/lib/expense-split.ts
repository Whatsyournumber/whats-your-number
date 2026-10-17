export type ExpenseSplitMode = "equal" | "percent" | "amount";

export function expenseSplit(total: number, mode: ExpenseSplitMode, percent = 50, amount = 0) {
  const safeTotal = Math.max(0, Math.round(total * 100) / 100);
  const requested = mode === "equal" ? safeTotal / 2 : mode === "percent" ? safeTotal * percent / 100 : amount;
  const mine = Math.round(Math.min(safeTotal, Math.max(0, requested)) * 100) / 100;
  const theirs = Math.round((safeTotal - mine) * 100) / 100;
  const pct = safeTotal > 0 ? Math.round(mine / safeTotal * 100) : 50;
  return { mine, theirs, label: `${pct}/${100 - pct}` };
}