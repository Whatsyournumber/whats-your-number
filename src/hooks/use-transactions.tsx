import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type Tx = {
  id: string;
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
        .select("id,tx_date,merchant,description,amount,currency,category,subcategory,excluded")
        .eq("user_id", userId!)
        .order("tx_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Tx[];
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
