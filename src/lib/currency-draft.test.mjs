import { expect, test } from "bun:test";
import { currencyDraft } from "./currency-draft";
import { setLiveRates } from "./fx";

test("un millón de RUB se convierte junto con el patrimonio, sin modificar el original", () => {
  setLiveRates({ USD: 1, RUB: 100, EUR: 0.9 });
  const original = { currency: "RUB", assets_bank: 1000000, income_salary: 100000 };
  const holdings = [{ manual_value: 1000000, cost_basis: 900000, quantity: 10, expected_return: 7, linked_liability: 100000 }];
  const usd = currencyDraft(original, holdings, "USD");
  expect(usd.profile.assets_bank).toBe(10000);
  expect(usd.holdings[0].manual_value).toBe(10000);
  expect(usd.holdings[0].linked_liability).toBe(1000);
  expect(usd.holdings[0].quantity).toBe(10);
  expect(usd.holdings[0].expected_return).toBe(7);
  expect(original.assets_bank).toBe(1000000);
  expect(holdings[0].manual_value).toBe(1000000);
  const eur = currencyDraft(usd.profile, usd.holdings, "EUR");
  expect(eur.profile.assets_bank).toBe(9000);
  expect(eur.holdings[0].manual_value).toBe(9000);
  expect(currencyDraft(eur.profile, eur.holdings, "RUB").holdings[0].manual_value).toBe(1000000);
});