import { describe, expect, it } from "bun:test";

import { needsPurchasePrice, resolveQuotedPosition } from "./quoted-position";

describe("unidades a partir del monto", () => {
  it("calcula unidades con el precio de la fecha de compra cuando faltan", () => {
    expect(resolveQuotedPosition({ kind: "etf", quantity: 0, costBasis: 1000, entryPrice: 0, purchasePrice: 250 })).toEqual({
      quantity: 4,
      entryPrice: 250,
    });
  });

  it("prefiere el precio de entrada que escribió el usuario", () => {
    expect(resolveQuotedPosition({ kind: "stock", quantity: 0, costBasis: 870, entryPrice: 87, purchasePrice: 99 })).toEqual({
      quantity: 10,
      entryPrice: 87,
    });
  });

  it("respeta las unidades si el usuario ya las puso", () => {
    expect(resolveQuotedPosition({ kind: "etf", quantity: 3, costBasis: 1000, entryPrice: 0, purchasePrice: 250 })).toEqual({
      quantity: 3,
      entryPrice: 0,
    });
  });

  it("no aplica a cripto, que usa precio promedio", () => {
    expect(needsPurchasePrice({ kind: "crypto", quantity: 0, costBasis: 1000, entryPrice: 0 })).toBe(false);
    expect(needsPurchasePrice({ kind: "etf", quantity: 0, costBasis: 1000, entryPrice: 0 })).toBe(true);
  });
});
