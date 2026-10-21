import { convertAmount, PROFILE_MONEY_FIELDS } from "./fx";

export const HOLDING_MONEY_FIELDS = ["cost_basis", "manual_value", "monthly_contribution", "linked_liability", "monthly_income"] as const;

/** Drafts use cents, not display rounding; units and rates are never monetary. */
export function convertMoneyFields<T extends object>(value: T, fields: readonly string[], rate: number): T {
  const next = { ...value } as Record<string, unknown>;
  for (const field of fields) {
    const amount = Number(next[field]);
    if (Number.isFinite(amount)) next[field] = Math.round(amount * rate * 100) / 100;
  }
  return next as T;
}

export function currencyDraft<P extends { currency: string }, H extends object>(profile: P, holdings: H[], to: string) {
  const rate = convertAmount(1, profile.currency || "EUR", to);
  return {
    profile: { ...convertMoneyFields(profile, PROFILE_MONEY_FIELDS, rate), currency: to },
    holdings: holdings.map((holding) => convertMoneyFields(holding, HOLDING_MONEY_FIELDS, rate)),
  };
}