import { describe, expect, it } from "bun:test";

import { LIABILITY_FIELD_KEYS, liabilityFieldVisible, storedExpectedReturn } from "./liability-form";

describe("formulario de pasivos", () => {
  it("muestra únicamente nombre, tipo de pasivo, monto, tasa y fecha", () => {
    expect(LIABILITY_FIELD_KEYS).toEqual(["name", "liabilityType", "amount", "rate", "date"]);
    expect(liabilityFieldVisible("entryPrice")).toBe(false);
    expect(liabilityFieldVisible("monthlyContribution")).toBe(false);
  });

  it("conserva una tasa de 0%", () => {
    expect(storedExpectedReturn(0)).toBe(0);
  });
});