import { describe, expect, it } from "bun:test";

import { needsPurchasePrice, resolveQuotedPosition } from "./quoted-position";

describe("unidades, inversión y precio de entrada", () => {
  it("calcula unidades con el precio de la fecha de compra cuando faltan", () => {
    expect(resolveQuotedPosition({ kind: "etf", quantity: 0, costBasis: 1000, entryPrice: 0, purchasePrice: 250 })).toEqual({
      quantity: 4,
      costBasis: 1000,
      entryPrice: 250,
    });
  });

  it("monto 38.188,49 y precio 500,65 dan 76,277 unidades", () => {
    expect(resolveQuotedPosition({ kind: "etf", quantity: 0, costBasis: 38188.49, entryPrice: 500.65, purchasePrice: 495.81 })).toEqual({
      quantity: 76.277819,
      costBasis: 38188.49,
      entryPrice: 500.65,
    });
  });

  it("con unidades y precio calcula la inversión inicial", () => {
    expect(resolveQuotedPosition({ kind: "stock", quantity: 10, costBasis: 0, entryPrice: 87, purchasePrice: 99 })).toEqual({
      quantity: 10,
      costBasis: 870,
      entryPrice: 87,
    });
  });

  it("con unidades y monto calcula el precio de entrada", () => {
    expect(resolveQuotedPosition({ kind: "etf", quantity: 4, costBasis: 1000, entryPrice: 0, purchasePrice: 300 })).toEqual({
      quantity: 4,
      costBasis: 1000,
      entryPrice: 250,
    });
  });

  it("solo con unidades usa el precio de la fecha de compra", () => {
    expect(resolveQuotedPosition({ kind: "etf", quantity: 2, costBasis: 0, entryPrice: 0, purchasePrice: 500.65 })).toEqual({
      quantity: 2,
      costBasis: 1001.3,
      entryPrice: 500.65,
    });
  });

  it("no aplica a cripto, que usa precio promedio", () => {
    expect(needsPurchasePrice({ kind: "crypto", quantity: 0, costBasis: 1000, entryPrice: 0 })).toBe(false);
    expect(needsPurchasePrice({ kind: "etf", quantity: 0, costBasis: 1000, entryPrice: 0 })).toBe(true);
    expect(needsPurchasePrice({ kind: "etf", quantity: 5, costBasis: 0, entryPrice: 0 })).toBe(true);
    expect(needsPurchasePrice({ kind: "etf", quantity: 5, costBasis: 1000, entryPrice: 0 })).toBe(false);
  });
});
