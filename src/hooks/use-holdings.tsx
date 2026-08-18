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
  "crypto",
  "other",
  "retirement",
  "property",
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
  };
}

export function newHolding(kind: HoldingKind, label = "", position = 0): Holding {
  return {
    id: crypto.randomUUID(),
    kind,
    label,
    ticker: null,
    quantity: 0,
    cost_basis: 0,
    manual_value: 0,
    monthly_contribution: 0,
    expected_return: kind === "crypto" ? 12 : kind === "stock" ? 9 : kind === "property" ? 4 : 7,
    linked_liability: 0,
    monthly_income: 0,
    target_year: kind === "future" ? new Date().getFullYear() + 5 : null,
    probability: 100,
    note: null,
    position,
  };
}

/** Valor actual de una posición: precio de mercado si hay ticker + unidades, si no el valor manual. */
export function holdingValue(h: Holding, prices?: Record<string, number>): number {
  if (h.ticker && h.quantity > 0) {
    const p = prices?.[h.ticker.toUpperCase()];
    if (p && p > 0) return Math.round(h.quantity * p);
  }
  return Math.round(h.manual_value);
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
    assets_etf: sum(["etf", "other"]),
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
}): Holding[] {
  const rows: [HoldingKind, string, number][] = [
    ["cash", "Efectivo", p.assets_cash],
    ["bank", "Cuentas bancarias", p.assets_bank],
    ["retirement", "Fondo de retiro", p.assets_retirement],
    ["etf", "ETFs / fondos", p.assets_etf],
    ["stock", "Acciones", p.assets_stocks],
    ["crypto", "Cripto", p.assets_crypto],
    ["property", "Propiedad", p.assets_property],
    ["debt", "Deudas", p.liabilities],
  ];
  return rows
    .filter(([, , v]) => v > 0)
    .map(([kind, label, v], i) => ({
      ...newHolding(kind, label, i),
      manual_value: Math.round(v),
      expected_return: kind === "crypto" ? 12 : kind === "stock" ? 9 : kind === "property" ? 4 : p.expected_return || 7,
    }));
}

/** Aporte mensual total declarado en inversiones + retiro. */

export function monthlyContributions(list: Holding[]) {
  return list
    .filter((h) => ["etf", "stock", "crypto", "other", "retirement"].includes(h.kind))
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
        const payload = list.map((h, i) => ({
          id: h.id,
          user_id: userId,
          kind: h.kind,
          label: h.label,
          ticker: h.ticker,
          quantity: h.quantity,
          cost_basis: h.cost_basis,
          manual_value: h.manual_value,
          monthly_contribution: h.monthly_contribution,
          expected_return: h.expected_return,
          linked_liability: h.linked_liability,
          monthly_income: h.monthly_income,
          target_year: h.target_year,
          probability: h.probability,
          note: h.note,
          position: i,
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
