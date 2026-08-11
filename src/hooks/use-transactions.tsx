import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { isExcludedTx } from "@/lib/categorize";
import { convertAmount } from "@/lib/fx";
import { supabase } from "@/integrations/supabase/client";

export type Tx = {
  id: string;
  statement_id?: string;
  tx_date: string | null;
  merchant: string;
  description: string | null;
  amount: number;
  currency: string;
  /** Moneda y monto originales del EEFF antes de convertir a la moneda del perfil. */
  original_amount?: number;
  original_currency?: string;
  category: string | null;
  subcategory: string | null;
  excluded: boolean;
};

const normalizeTransactionText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/** Transacciones importadas desde los estados de cuenta (EEFF) del usuario. */
export function useTransactions() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const userId = user?.id ?? null;
  const baseCurrency = (profile?.currency as string) || "EUR";

  const query = useQuery({
    queryKey: ["imported-transactions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("imported_transactions")
        .select("id,statement_id,tx_date,merchant,description,amount,currency,category,subcategory,excluded")
        .eq("user_id", userId)
        .order("tx_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      const rows = (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) }));
      // El mismo movimiento puede llegar con mayúsculas o acentos distintos
      // desde varios EEFF. Su identidad financiera es fecha + comercio + monto
      // + descripción normalizados, independientemente del statement de origen.
      const seen = new Set<string>();
      const unique = rows.filter((t) => {
        const amount = Math.abs(Number(t.amount)).toFixed(2);
        const key = `${t.tx_date}|${normalizeTransactionText(t.merchant)}|${amount}|${normalizeTransactionText(t.description)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return unique as Tx[];
    },
  });

  const all = query.data ?? [];
  // Se descartan movimientos excluidos y los que duplican gastos fijos (p. ej. "Servicio en un 2x3").
  // Todo se convierte a la moneda del perfil para que EEFF en RUB, USD, GBP… sumen correctamente.
  const transactions = all
    .filter((t) => !t.excluded && t.tx_date && !isExcludedTx(t))
    .map((t) => ({
      ...t,
      original_amount: t.amount,
      original_currency: t.currency,
      amount: convertAmount(t.amount, t.currency, baseCurrency),
      currency: baseCurrency,
    }));

  return {
    transactions,
    isLoading: query.isLoading,
    hasData: transactions.length > 0,
  };
}
