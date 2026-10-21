import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { convertAmount, isKnownCurrency } from "@/lib/fx";

/** Cache invalidation happens only after the transaction commits, for this account. */
export function clearCurrencyCaches(userId: string) {
  const prefixes = ["spend-budgets", "fixed-expenses", "spend-target", "app-subscriptions", "savings-allocation", "savings-goals"];
  for (const key of Object.keys(window.localStorage)) {
    if (prefixes.some((prefix) => key === `whatsyournumber:${prefix}:${userId}` || key.startsWith(`whatsyournumber:${prefix}:${userId}:`))) {
      window.localStorage.removeItem(key);
    }
  }
}

/** One checked database transaction owns profile, holdings, goals and budgets. */
export async function saveFinancialProfile(userId: string, from: string, to: string, profile: object, holdings?: object[]) {
  if (!isKnownCurrency(from) || !isKnownCurrency(to)) throw new Error("Unknown currency");
  const { error } = await supabase.rpc("save_financial_profile", {
    _from: from.toUpperCase(), _to: to.toUpperCase(), _rate: convertAmount(1, from, to),
    _profile: profile as Json, ... (holdings ? { _holdings: holdings as Json } : {}),
  });
  if (error) throw new Error(error.message);
  if (from !== to) clearCurrencyCaches(userId);
}