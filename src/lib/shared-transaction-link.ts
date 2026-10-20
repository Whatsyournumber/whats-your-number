/** Keep identity metadata before receipt JSON and after the existing owed marker. */
export function withSharedExpenseId(description: string, expenseId: string) {
  const clean = description.replace(/\|expense:[0-9a-f-]{36}/g, "");
  const receiptAt = clean.indexOf("|wyn-receipt:");
  return receiptAt < 0 ? `${clean}|expense:${expenseId}` : `${clean.slice(0, receiptAt)}|expense:${expenseId}${clean.slice(receiptAt)}`;
}

export function linkedParticipant<T extends { user_id: string; transaction_id?: string | null; status: string }>(rows: T[], userId: string | undefined, transactionId: string) {
  const matches = rows.filter((row) => row.user_id === userId && row.status === "accepted" && row.transaction_id === transactionId);
  return matches.length === 1 ? matches[0] : undefined;
}