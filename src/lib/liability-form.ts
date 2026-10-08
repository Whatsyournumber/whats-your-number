export const LIABILITY_FIELD_KEYS = ["name", "liabilityType", "amount", "rate", "date"] as const;

export const LIABILITY_TYPES = [
  "loan",
  "credit_card",
  "mortgage",
  "auto_loan",
  "student_loan",
  "credit_line",
  "tax_debt",
  "medical_debt",
  "other",
] as const;

export type LiabilityType = (typeof LIABILITY_TYPES)[number];

export type LiabilityFieldKey = (typeof LIABILITY_FIELD_KEYS)[number] | "entryPrice" | "monthlyContribution";

export function liabilityFieldVisible(field: LiabilityFieldKey): boolean {
  return (LIABILITY_FIELD_KEYS as readonly string[]).includes(field);
}

export function storedExpectedReturn(value: unknown): number {
  return value == null ? 7 : Number(value) || 0;
}

export function liabilityTypeFromNote(note: string | null | undefined): LiabilityType {
  const value = note?.match(/(?:^|;)liability:([^;]+)/)?.[1];
  return LIABILITY_TYPES.includes(value as LiabilityType) ? (value as LiabilityType) : "loan";
}

export function noteWithLiabilityType(note: string | null | undefined, type: LiabilityType): string {
  const parts = (note ?? "").split(";").filter((part) => part && !part.startsWith("liability:"));
  return [...parts, `liability:${type}`].join(";");
}