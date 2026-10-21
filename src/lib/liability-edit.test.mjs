import { describe, expect, test } from "bun:test";
import { mortgageAllocation, profileLiabilityPatch } from "./liability-edit";

describe("edición de pasivos existentes", () => {
  test("eliminar deudas deja únicamente el saldo de hipoteca", () => {
    expect(profileLiabilityPatch("debts", 0, 0, { liabilities: 360000, mortgage_balance: 173700 }, 173700)).toEqual({ liabilities: 173700 });
  });
  test("eliminar la hipoteca conserva las demás deudas y elimina saldos vinculados", () => {
    expect(profileLiabilityPatch("mortgage", 0, 0, { liabilities: 360000, mortgage_balance: 173700 }, 173700)).toEqual({ mortgage_balance: 0, mortgage_rate: 0, liabilities: 186300 });
    expect(mortgageAllocation([100, 200], 0)).toEqual([0, 0]);
  });
  test("editar deudas conserva la hipoteca que ya está incluida", () => {
    expect(profileLiabilityPatch("debts", 150000, 0, { liabilities: 360000, mortgage_balance: 173700 }, 173700)).toEqual({ liabilities: 323700 });
  });
  test("editar hipoteca conserva las demás deudas", () => {
    expect(profileLiabilityPatch("mortgage", 170000, 5.5, { liabilities: 360000, mortgage_balance: 173700 }, 173700)).toEqual({ mortgage_balance: 170000, mortgage_rate: 5.5, liabilities: 356300 });
  });
  test("hipotecas vinculadas reparten el saldo sin duplicar ni perder céntimos", () => {
    expect(mortgageAllocation([100, 200], 100)).toEqual([33.33, 66.67]);
    expect(mortgageAllocation([173700], 170000)).toEqual([170000]);
  });
});