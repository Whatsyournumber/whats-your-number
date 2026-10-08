export const LIABILITY_FIELD_KEYS = ["name", "liabilityType", "amount", "rate", "date"] as const;

export type LiabilityFieldKey = (typeof LIABILITY_FIELD_KEYS)[number] | "entryPrice" | "monthlyContribution";

export function liabilityFieldVisible(field: LiabilityFieldKey): boolean {
  return (LIABILITY_FIELD_KEYS as readonly string[]).includes(field);
}

export function storedExpectedReturn(value: unknown): number {
  return value == null ? 7 : Number(value) || 0;
}