export const LIABILITY_FIELD_KEYS = ["name", "liabilityType", "amount", "rate", "date"] as const;

export function storedExpectedReturn(value: unknown): number {
  return value == null ? 7 : Number(value) || 0;
}