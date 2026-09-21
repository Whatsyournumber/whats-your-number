import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { useFxRates } from "@/hooks/use-fx-rates";
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

/** Ruido de pasarelas y formas jurídicas que ensucian el nombre del comercio. */
const MERCHANT_NOISE = new Set([
  "sum", "sp", "sq", "tpv", "pos", "pay", "paypal", "mp", "mpo", "pmt", "compra", "card",
  "srl", "sl", "sa", "sas", "sau", "slu", "ltd", "llc", "inc", "gmbh", "bv", "oy", "ab", "spa",
  "the", "de", "del", "la", "el", "los", "las", "and", "y",
]);

/**
 * Huella del comercio: el mismo negocio llega con nombres distintos
 * ("Sixt" vs "SIXT RENT A CAR", "SUM*ISTAWOOD SRL" vs "Istawood").
 * Se limpian prefijos de pasarela, formas jurídicas y se toma la palabra principal.
 */
export const merchantKey = (value: string | null | undefined) => {
  const tokens = normalizeTransactionText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !MERCHANT_NOISE.has(w) && !/^\d+$/.test(w));
  return tokens[0] ?? normalizeTransactionText(value);
};

/** True si dos nombres apuntan al mismo comercio. */
export const sameMerchant = (a: string | null | undefined, b: string | null | undefined) => {
  const ka = merchantKey(a);
  const kb = merchantKey(b);
  if (!ka || !kb) return false;
  return ka === kb || ka.includes(kb) || kb.includes(ka);
};



/** Transacciones importadas desde los estados de cuenta (EEFF) del usuario. */
export function useTransactions() {
  const { user } = useAuth();
  const { profile } = useProfile();
  // Tasas del día: al cargarse cambia `fxUpdatedAt` y se recalculan las conversiones.
  const { updatedAt: fxUpdatedAt } = useFxRates();
  const userId = user?.id ?? null;
  const baseCurrency = (profile?.currency as string) || "EUR";

  const query = useQuery({
    queryKey: ["imported-transactions", userId, fxUpdatedAt],
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
      // El mismo movimiento puede llegar con nombres distintos desde varios EEFF
      // ("SUM*ISTAWOOD SRL" vs "Istawood") y con fecha de cargo distinta (1-3 días).
      // Regla: mismo importe + mismo comercio y
      //  - misma fecha (aunque venga del mismo archivo), o
      //  - fechas a menos de 4 días si vienen de archivos distintos
      //    (EEFF solapados, o recibo manual + cargo del banco).
      // Dentro de un mismo archivo, cargos repetidos en días distintos son reales
      // (p. ej. peajes o suscripciones), así que no se descartan.
      type Kept = { day: number; merchant: string; statement: string };
      const kept = new Map<string, Kept[]>();
      const dayOf = (date: string | null) => (date ? Math.round(new Date(date).getTime() / 86_400_000) : NaN);
      const unique = rows.filter((t) => {
        const amount = Math.abs(Number(t.amount)).toFixed(2);
        const day = dayOf(t.tx_date);
        const statement = t.statement_id ?? "";
        const seen = kept.get(amount) ?? [];
        const isDuplicate = seen.some((k) => {
          if (!sameMerchant(k.merchant, t.merchant)) return false;
          if (Number.isNaN(day) || Number.isNaN(k.day)) return k.day === day;
          const gap = Math.abs(k.day - day);
          if (gap === 0) return true;
          return gap <= 3 && k.statement !== statement;
        });
        if (isDuplicate) return false;
        seen.push({ day, merchant: t.merchant ?? "", statement });
        kept.set(amount, seen);
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
