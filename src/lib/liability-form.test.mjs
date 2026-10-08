import { describe, expect, it } from "bun:test";

import {
  LIABILITY_FIELD_KEYS,
  LIABILITY_TYPES,
  liabilityFieldVisible,
  liabilityTypeFromNote,
  noteWithLiabilityType,
  storedExpectedReturn,
} from "./liability-form";

describe("formulario de pasivos", () => {
  it("muestra únicamente nombre, tipo de pasivo, monto, tasa y fecha", () => {
    expect(LIABILITY_FIELD_KEYS).toEqual(["name", "liabilityType", "amount", "rate", "date"]);
    expect(liabilityFieldVisible("entryPrice")).toBe(false);
    expect(liabilityFieldVisible("monthlyContribution")).toBe(false);
  });

  it("conserva una tasa de 0%", () => {
    expect(storedExpectedReturn(0)).toBe(0);
  });

  it("ofrece los tipos habituales de pasivo y conserva el elegido", () => {
    expect(LIABILITY_TYPES).toEqual([
      "loan",
      "credit_card",
      "mortgage",
      "auto_loan",
      "student_loan",
      "credit_line",
      "tax_debt",
      "medical_debt",
      "other",
    ]);
    expect(liabilityTypeFromNote(noteWithLiabilityType("source:patrimonio", "credit_card"))).toBe("credit_card");
  });
});