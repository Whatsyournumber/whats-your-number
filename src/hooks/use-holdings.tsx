import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const HOLDING_KINDS = [
  "cash",
  "bank",
  "money_market",
  "etf",
  "stock",
  "bond",
  "tbill",
  "note",
  "structured",
  "crypto",
  "other",
  "retirement",
  "property",
  "reit",
  "future",
  "debt",
] as const;

export type HoldingKind = (typeof HOLDING_KINDS)[number];

export type Holding = {
  id: string;
  kind: HoldingKind;
  label: string;
  ticker: string | null;
  quantity: number;
  cost_basis: number;
  manual_value: number;
  monthly_contribution: number;
  expected_return: number;
  linked_liability: number;
  monthly_income: number;
  target_year: number | null;
  probability: number;
  note: string | null;
  position: number;
  /** Fecha de alta del activo (para ubicar el aporte en el mes correcto). */
  created_at?: string | null;
  /** Fecha real de compra; si falta, se usa created_at. */
  purchased_at?: string | null;
};


type Row = Record<string, unknown>;

const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);

function toHolding(r: Row, i: number): Holding {
  return {
    id: String(r["id"]),
    kind: (String(r["kind"] ?? "etf") as HoldingKind) ?? "etf",
    label: String(r["label"] ?? ""),
    ticker: (r["ticker"] as string | null) ?? null,
    quantity: num(r["quantity"]),
    cost_basis: num(r["cost_basis"]),
    manual_value: num(r["manual_value"]),
    monthly_contribution: num(r["monthly_contribution"]),
    expected_return: num(r["expected_return"]) || 7,
    linked_liability: num(r["linked_liability"]),
    monthly_income: num(r["monthly_income"]),
    target_year: (r["target_year"] as number | null) ?? null,
    probability: r["probability"] == null ? 100 : num(r["probability"]),
    note: (r["note"] as string | null) ?? null,
    position: r["position"] == null ? i : num(r["position"]),
    created_at: (r["created_at"] as string | null) ?? null,
    purchased_at: (r["purchased_at"] as string | null) ?? null,
  };
}

/** Retorno anual sugerido por tipo de activo. */
export function defaultReturn(kind: HoldingKind): number {
  if (kind === "crypto") return 12;
  if (kind === "stock") return 9;
  if (kind === "property") return 4;
  if (kind === "reit") return 8;
  if (kind === "bond") return 5;
  if (kind === "tbill") return 4;
  if (kind === "note") return 5;
  if (kind === "structured") return 6;
  if (kind === "debt") return 0;
  return 7;
}

export function newHolding(kind: HoldingKind, label = "", position = 0): Holding {
  return {
    id: crypto.randomUUID(),
    kind,
    label,
    ticker: null,
    quantity: kind === "structured" ? 100 : 0,
    cost_basis: 0,
    manual_value: 0,
    monthly_contribution: 0,
    expected_return: defaultReturn(kind),
    linked_liability: 0,
    monthly_income: 0,
    target_year: kind === "future" ? new Date().getFullYear() + 5 : null,
    probability: 100,
    note: null,
    position,
  };
}

/** Valor actual de una posición: precio de mercado si hay ticker + unidades, si no el valor manual; como último recurso, el monto de compra. */
export function holdingValue(h: Holding, prices?: Record<string, number>): number {
  if (h.ticker && h.quantity > 0) {
    const p = prices?.[h.ticker.toUpperCase()];
    if (p && p > 0) return Math.round(h.quantity * p);
  }
  if (h.manual_value > 0) return Math.round(h.manual_value);
  if (h.cost_basis > 0) return Math.round(h.cost_basis);
  return 0;
}

export type WealthTotals = {
  assets_cash: number;
  assets_bank: number;
  assets_retirement: number;
  assets_etf: number;
  assets_stocks: number;
  assets_crypto: number;
  assets_property: number;
  liabilities: number;
};

/** Agrega los holdings en los campos del perfil para que toda la app se recalcule igual. */
export function wealthTotals(list: Holding[], prices?: Record<string, number>): WealthTotals {
  const sum = (kinds: HoldingKind[]) =>
    list.filter((h) => kinds.includes(h.kind)).reduce((s, h) => s + holdingValue(h, prices), 0);

  const debts =
    sum(["debt"]) + list.filter((h) => h.kind === "property").reduce((s, h) => s + h.linked_liability, 0);

  return {
    assets_cash: sum(["cash"]),
    assets_bank: sum(["bank", "money_market"]),
    assets_retirement: sum(["retirement"]),
    assets_etf: sum(["etf", "other", "bond", "tbill", "note", "structured"]),
    assets_stocks: sum(["stock"]),
    assets_crypto: sum(["crypto"]),
    assets_property: sum(["property"]),
    liabilities: Math.round(debts),
  };
}

/** Crea el detalle inicial a partir de los totales del perfil (para quien nunca lo ha editado). */
export function seedHoldingsFromTotals(p: {
  assets_cash: number;
  assets_bank: number;
  assets_retirement: number;
  assets_etf: number;
  assets_stocks: number;
  assets_crypto: number;
  assets_property: number;
  liabilities: number;
  expected_return: number;
  housing?: string;
  mortgage_balance?: number;
}): Holding[] {
  // La hipoteca de la vivienda queda ligada a la propiedad, no duplicada en Deudas.
  const homeMortgage = p.housing === "hipoteca" ? Math.max(0, Math.round(p.mortgage_balance ?? 0)) : 0;
  const otherDebts = Math.max(0, Math.round(p.liabilities) - homeMortgage);
  const rows: [HoldingKind, string, number][] = [
    ["cash", "Efectivo", p.assets_cash],
    ["bank", "Cuentas bancarias", p.assets_bank],
    ["retirement", "Fondo de retiro", p.assets_retirement],
    ["etf", "ETFs / fondos", p.assets_etf],
    ["stock", "Acciones", p.assets_stocks],
    ["crypto", "Cripto", p.assets_crypto],
    ["property", "Propiedad", p.assets_property],
    ["debt", "Deudas", otherDebts],
  ];
  return rows
    .filter(([kind, , v]) => v > 0 || (kind === "property" && homeMortgage > 0))
    .map(([kind, label, v], i) => ({
      ...newHolding(kind, label, i),
      manual_value: Math.round(v),
      ...(kind === "property" ? { linked_liability: homeMortgage, note: HOME_HOLDING_NOTE } : {}),
      expected_return: ["crypto", "stock", "property"].includes(kind) ? defaultReturn(kind) : p.expected_return || 7,
    }));
}

/** Marca interna de la vivienda creada desde el onboarding. */
export const HOME_HOLDING_NOTE = "onboarding:vivienda";

/**
 * Garantiza que la vivienda del onboarding exista como activo real:
 * el valor en Propiedades (activo) y el saldo de la hipoteca ligado (pasivo).
 * Si ya hay propiedades creadas a mano y ninguna marcada, no toca nada.
 */
export async function syncHomeHolding(
  supabaseClient: any,
  userId: string,
  p: { housing?: string; assets_property?: number | null; mortgage_balance?: number | null },
  label: string,
): Promise<void> {
  const owns = p.housing === "hipoteca" || p.housing === "pagada";
  const value = Math.max(0, Math.round(p.assets_property ?? 0));
  const mortgage = p.housing === "hipoteca" ? Math.max(0, Math.round(p.mortgage_balance ?? 0)) : 0;
  if (!owns || (value <= 0 && mortgage <= 0)) {
    await supabaseClient.from("holdings").delete().eq("user_id", userId).eq("note", HOME_HOLDING_NOTE);
    return;
  }
  const { data: marked } = await supabaseClient
    .from("holdings")
    .select("id")
    .eq("user_id", userId)
    .eq("note", HOME_HOLDING_NOTE)
    .maybeSingle();
  if (marked) {
    await supabaseClient
      .from("holdings")
      .update({ manual_value: value, cost_basis: value, linked_liability: mortgage })
      .eq("id", marked.id);
    return;
  }
  const { count } = await supabaseClient
    .from("holdings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "property");
  if ((count ?? 0) > 0) return; // ya gestiona sus propiedades a mano
  await supabaseClient.from("holdings").insert({
    user_id: userId,
    kind: "property",
    label,
    ticker: null,
    quantity: 0,
    cost_basis: value,
    manual_value: value,
    monthly_contribution: 0,
    expected_return: 4,
    linked_liability: mortgage,
    monthly_income: 0,
    target_year: null,
    probability: 100,
    note: HOME_HOLDING_NOTE,
    position: 999,
  });
}

/** Aporte mensual total declarado en inversiones + retiro. */

export function monthlyContributions(list: Holding[]) {
  return list
    .filter((h) => ["etf", "stock", "bond", "tbill", "note", "structured", "crypto", "other", "retirement"].includes(h.kind))
    .reduce((s, h) => s + h.monthly_contribution, 0);
}

/** Renta mensual neta que generan las propiedades. */
export function propertyIncome(list: Holding[]) {
  return list.filter((h) => h.kind === "property").reduce((s, h) => s + h.monthly_income, 0);
}

/** Detalle editable del patrimonio (liquidez, inversiones, propiedades, deudas…). */
export function useHoldings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const key = ["holdings", userId];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .eq("user_id", userId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Row[]).map(toHolding);
    },
  });

  const saveAll = useMutation({
    mutationFn: async (list: Holding[]) => {
      if (!userId) throw new Error("Sin sesión");
      const keep = new Set(list.map((h) => h.id));
      const previous = query.data ?? [];
      const removed = previous.filter((h) => !keep.has(h.id)).map((h) => h.id);
      if (removed.length) {
        const { error } = await supabase.from("holdings").delete().in("id", removed);
        if (error) throw error;
      }
      if (list.length) {
        // Saneamos: cualquier NaN/undefined numérico rompería el upsert con un 400.
        const payload = list.map((h, i) => ({
          id: h.id,
          user_id: userId,
          kind: h.kind,
          label: h.label || "Posición",
          ticker: h.ticker || null,
          quantity: num(h.quantity),
          cost_basis: num(h.cost_basis),
          manual_value: num(h.manual_value),
          monthly_contribution: num(h.monthly_contribution),
          expected_return: num(h.expected_return),
          linked_liability: num(h.linked_liability),
          monthly_income: num(h.monthly_income),
          target_year: h.target_year == null || Number.isNaN(h.target_year) ? null : Math.round(num(h.target_year)),
          probability: h.probability == null || Number.isNaN(h.probability) ? 100 : num(h.probability),
          note: h.note || null,
          position: i,
          purchased_at: h.purchased_at || null,
        }));
        const { error } = await supabase.from("holdings").upsert(payload);
        if (error) throw error;
      }
      return list;
    },
    onSuccess: (list) => {
      qc.setQueryData(key, list);
      void qc.invalidateQueries();
    },
  });

  return {
    holdings: query.data ?? [],
    isLoading: query.isLoading,
    saveAll: saveAll.mutateAsync,
    saving: saveAll.isPending,
  };
}
