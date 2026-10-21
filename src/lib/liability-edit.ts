export function profileLiabilityPatch(source: "mortgage" | "debts", amount: number, rate: number, current: { liabilities: number; mortgage_balance: number }, mortgageCovered: number) {
  if (source === "debts") return { liabilities: mortgageCovered + amount };
  return {
    mortgage_balance: amount,
    mortgage_rate: rate,
    liabilities: current.liabilities >= mortgageCovered ? current.liabilities - mortgageCovered + amount : current.liabilities,
  };
}

export function mortgageAllocation(balances: number[], amount: number): number[] {
  const total = balances.reduce((sum, balance) => sum + balance, 0);
  if (total <= 0) return balances.map(() => 0);
  const cents = Math.round(amount * 100);
  let remaining = cents;
  return balances.map((balance, index) => {
    const share = index === balances.length - 1 ? remaining : Math.round(cents * balance / total);
    remaining -= share;
    return share / 100;
  });
}