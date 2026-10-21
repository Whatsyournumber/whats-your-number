import { expect, test } from "bun:test";
import { isLoanHolding, portfolioLiquidity } from "./portfolio-liquidity";

test("los 85 mil de Banco creados en Patrimonio aparecen una sola vez en Portafolio", () => {
  const banco = { id: "banco", kind: "cash", cost_basis: 85000, note: "source:patrimonio" };
  const rows = portfolioLiquidity([banco, { id: "empty", kind: "bank", cost_basis: 0 }, { id: "debt", kind: "debt", cost_basis: 10000 }]);
  expect(rows.map((row) => row.id)).toEqual(["banco", "empty"]);
  expect(rows.reduce((sum, row) => sum + row.cost_basis, 0)).toBe(85000);
});

test("las cuentas bancarias y de mercado monetario de Patrimonio también se incluyen", () => {
  expect(portfolioLiquidity([
    { kind: "bank", note: "source:patrimonio" },
    { kind: "money_market", note: "source:patrimonio" },
    { kind: "property", note: "source:patrimonio" },
  ]).map((row) => row.kind)).toEqual(["bank", "money_market"]);
});

test("el préstamo del bono por 200 mil no cuenta para el total de Portafolio", () => {
  const prestamo = { id: "prestamo", kind: "bond", cost_basis: 200000, manual_value: 0, note: "source:patrimonio;liability:loan" };
  const bono = { id: "bono", kind: "bond", manual_value: 200000, note: null };
  expect(isLoanHolding(prestamo)).toBe(true);
  expect(isLoanHolding(bono)).toBe(false);
});
