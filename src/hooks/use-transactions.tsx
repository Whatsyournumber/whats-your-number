import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type Tx = {
  id: string;
  statement_id?: string;
  tx_date: string | null;
  merchant: string;
  description: string | null;
  amount: number;
  currency: string;
  category: string | null;
  subcategory: string | null;
  excluded: boolean;
};

/** Transacciones importadas desde los estados de cuenta (EEFF) del usuario. */
export function useTransactions() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["imported-transactions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imported_transactions")
        .select("id,statement_id,tx_date,merchant,description,amount,currency,category,subcategory,excluded")
        .eq("user_id", userId!)
        .order("tx_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      const rows = (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }));
      // Dedupe: un mismo movimiento cargado en varios EEFF se cuenta una sola vez.
      const seen = new Map<string, string>();
      const unique = rows.filter((t) => {
        const key = `${t.tx_date}|${t.merchant.trim().toLowerCase()}|${t.amount}|${(t.description ?? "").trim().toLowerCase()}`;
        const owner = seen.get(key);
        if (owner && owner !== t.statement_id) return false;
        seen.set(key, t.statement_id as string);
        return true;
      });
      return unique as Tx[];
    },
  });

  const all = query.data ?? [];
  const transactions = all.filter((t) => !t.excluded && t.tx_date);


  return {
    transactions,
    isLoading: query.isLoading,
    hasData: transactions.length > 0,
  };
}
