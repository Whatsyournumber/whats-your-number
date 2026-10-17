import { describe, expect, it } from "bun:test";
import { expenseSplit } from "./expense-split";

describe("reparto de recibos compartidos", () => {
  it("divide por igual sin perder céntimos", () => {
    expect(expenseSplit(12.01, "equal")).toEqual({ mine: 6.01, theirs: 6, label: "50/50" });
  });
  it("permite un porcentaje diferente", () => {
    expect(expenseSplit(100, "percent", 30)).toEqual({ mine: 30, theirs: 70, label: "30/70" });
  });
  it("permite un monto propio y asigna el resto a la otra persona", () => {
    expect(expenseSplit(87, "amount", 50, 20)).toEqual({ mine: 20, theirs: 67, label: "23/77" });
  });
  it("permite que la otra persona asuma todo sin exceder el total", () => {
    expect(expenseSplit(87, "amount", 50, 0).theirs).toBe(87);
    expect(expenseSplit(87, "amount", 50, 120).mine).toBe(87);
  });
});