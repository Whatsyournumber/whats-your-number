import { supabase } from "@/integrations/supabase/client";

/** Contenedor lógico para los gastos que el usuario registra sin estados de cuenta. */
export async function ensureManualStatement(userId: string) {
  const { data: existing } = await supabase
    .from("statements")
    .select("id")
    .eq("user_id", userId)
    .eq("storage_path", "manual")
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("statements")
    .insert({
      user_id: userId,
      file_name: "Gastos manuales",
      file_type: "manual",
      file_size: 0,
      storage_path: "manual",
      status: "processed",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function saveExpense(input: {
  userId: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
}) {
  const statementId = await ensureManualStatement(input.userId);
  const { error } = await supabase.from("imported_transactions").insert({
    user_id: input.userId,
    statement_id: statementId,
    tx_date: input.date,
    merchant: input.merchant,
    description: input.description,
    amount: -Math.abs(input.amount),
    currency: input.currency,
    category: input.category,
  });
  if (error) throw new Error(error.message);
}
