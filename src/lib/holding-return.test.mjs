import { describe, expect, it } from "bun:test";

import { purchaseUnitPrice } from "./holding-return";

const at = (iso) => Date.parse(iso) / 1000;
const daily = [
  { t: at("2026-11-11T14:30:00Z"), price: 506.96 },
  { t: at("2026-11-12T14:30:00Z"), price: 501.73 },
  { t: at("2026-11-13T14:30:00Z"), price: 500 },
];

describe("precio del día de compra", () => {
  it("usa el cierre del mismo día de la fecha de compra", () => {
    expect(purchaseUnitPrice({ quantity: 76, cost_basis: 0, purchased_at: "2026-11-12" }, null, daily)).toBe(501.73);
  });

  it("si es fin de semana, usa el día hábil anterior", () => {
    expect(purchaseUnitPrice({ quantity: 1, cost_basis: 0, purchased_at: "2026-11-15" }, null, daily)).toBe(500);
  });
});
