import { describe, expect, it } from "bun:test";
import { linkedParticipant, withSharedExpenseId } from "./shared-transaction-link";

describe("durable shared expense identity", () => {
  it("retains the link after merchant, date, amount and split change", () => {
    const rows = [{ user_id: "me", transaction_id: "tx", status: "accepted", merchant: "New shop", date: "2026-10-20", amount: 70 }];
    expect(linkedParticipant(rows, "me", "tx")).toBe(rows[0]);
    expect(linkedParticipant(rows, "me", "old-tx")).toBeUndefined();
  });
  it("does not resolve ambiguous or foreign participants", () => {
    const row = { user_id: "me", transaction_id: "tx", status: "accepted" };
    expect(linkedParticipant([row, row], "me", "tx")).toBeUndefined();
    expect(linkedParticipant([row], "other", "tx")).toBeUndefined();
    expect(linkedParticipant([{ ...row, status: "declined" }], "me", "tx")).toBeUndefined();
  });
  it("retains payer marker and receipt products when adding identity", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const receipt = 'shared:30/70|Carlos|owed|wyn-receipt:[{"name":"Milk","amount":12}]';
    expect(withSharedExpenseId(receipt, id)).toBe(`shared:30/70|Carlos|owed|expense:${id}|wyn-receipt:[{"name":"Milk","amount":12}]`);
    expect(withSharedExpenseId(withSharedExpenseId(receipt, id), id)).toBe(withSharedExpenseId(receipt, id));
  });
});