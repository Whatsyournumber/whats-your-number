import { expect, test } from "bun:test";
import { groupExpenseShares } from "./group-expense-split";

test("una cena de 90 con Carlos y Ana cuenta 30 propios, no 60", () => {
  expect(groupExpenseShares(90, 2)).toEqual([30, 30, 30]);
});
test("los céntimos conservan el total entre tres participantes", () => {
  const shares = groupExpenseShares(100, 2);
  expect(shares).toEqual([33.34, 33.33, 33.33]);
  expect(Math.round(shares.reduce((sum, value) => sum + value, 0) * 100)).toBe(10000);
});
test("dos personas conservan reparto por porcentaje y monto", () => {
  expect(groupExpenseShares(90, 1, "percent", 20)).toEqual([18, 72]);
  expect(groupExpenseShares(90, 1, "amount", 50, 10)).toEqual([10, 80]);
});