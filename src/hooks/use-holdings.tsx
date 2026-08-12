import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useQuotes } from "@/hooks/use-market";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { convertAmount } from "@/lib/fx";

export type HoldingKind =
  | "cash"
  | "bank"
  | "retirement"
  | "etf"
  | "stock"
  | "crypto"
  | "property"
  | "liability";

export type Holding = {
  id: string;
  kind: HoldingKind;
  label: string;
  ticker: string;
  quantity: number;
  cost_basis: number;
  manual_value: number;
  monthly_contribution: number;
  expected_return: number;
  note: string;
  position: number;
};

export type PricedHolding = Holding & {
  /** Valor de mercado en la moneda del perfil. */
  value: number;
  /** Coste invertido en la moneda del perfil. */
  cost: number;
  gain: number;
  ret: number;
  livePrice: number | null;
  liveChangePct: number | null;
};

export const HOLDING_KINDS: { kind: HoldingKind; es: string; en: string; group: "liquid" | "invest" | "real" | "debt" }[] = [
  { kind: "cash", es: "Efectivo", en: "Cash", group: "liquid" },
  { kind: "bank", es: "Cuentas bancarias", en: "Bank accounts", group: "liquid" },
  { kind: "etf", es: "ETFs / fondos", en: "ETFs / funds", group: "invest" },
  { kind: "stock", es: "Acciones", en: "Stocks", group: "invest" },
  { kind: "crypto", es: "Cripto", en: "Crypto", group: "invest" },
  { kind: "retirement", es: "Fondo de retiro", en: "Retirement fund", group: "invest" },
  { kind: "property", es: "Propiedades", en: "Properties", group: "real" },
  { kind: "liability", es: "Deudas", en: "Liabilities", group: "debt" },
];

export const INVESTABLE_KINDS: HoldingKind[] = ["etf", "stock", "crypto", "retirement"];

const PROFILE_FIELD: Record<HoldingKind, string> = {
  cash: "assets_cash",
  bank: "assets_bank",
  retirement: "assets_retirement",
  etf: "assets_etf",
  stock: "assets_stocks",
  crypto: "assets_crypto",
  property: "assets_property",
  liability: "liabilities",
};

function rowToHolding(r: Record<string, unknown>): Holding {
  return {
    id: String(r["id"]),
    kind: (String(r["kind"] ?? "etf") as HoldingKind),
    label: String(r["label"] ?? ""),
    ticker: String(r["ticker"] ?? ""),
    quantity: Number(r["quantity"] ?? 0),
    cost_basis: Number(r["cost_basis"] ?? 0),
    manual_value: Number(r["manual_value"] ?? 0),
    monthly_contribution: Number(r["monthly_contribution"] ?? 0),
    expected_return: Number(r["expected_return"] ?? 7),
    note: String(r["note"] ?? ""),
    position: Number(r["position"] ?? 0),
  };
}

/**
 * Posiciones reales del usuario (activos y deudas). Los que tienen ticker se
 * valoran con precio de mercado en vivo y se convierten a la moneda del perfil.
 */
export function useHoldings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const { profile, save } = useProfile();
  const currency = profile.currency || "USD";

  const query = useQuery({
    queryKey: ["holdings", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .eq("user_id", userId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => rowToHolding(r as Record<string, unknown>));
    },
  });

  const holdings = useMemo(() => query.data ?? [], [query.data]);

  const tickers = useMemo(
    () => [...new Set(holdings.filter((h) => h.ticker && h.quantity > 0).map((h) => h.ticker.toUpperCase()))],
    [holdings],
  );
  const quotesQuery = useQuotes(tickers);

  const priceMap = useMemo(() => {
    const map = new Map<string, { price: number; changePct: number; currency: string }>();
    for (const q of quotesQuery.data?.quotes ?? []) {
      map.set(q.symbol.toUpperCase(), { price: q.price, changePct: q.changePct, currency: q.currency || "USD" });
    }
    return map;
  }, [quotesQuery.data]);

  const priced: PricedHolding[] = useMemo(
    () =>
      holdings.map((h) => {
        const quote = h.ticker ? priceMap.get(h.ticker.toUpperCase()) : undefined;
        const live = quote && h.quantity > 0 ? convertAmount(quote.price * h.quantity, quote.currency, currency) : null;
        const value = Math.round(live ?? h.manual_value);
        const cost = Math.round(h.cost_basis || (h.quantity && quote ? 0 : 0) || h.cost_basis);
        const gain = cost > 0 ? value - cost : 0;
        return {
          ...h,
          value,
          cost,
          gain,
          ret: cost > 0 ? (gain / cost) * 100 : 0,
          livePrice: quote?.price ?? null,
          liveChangePct: quote?.changePct ?? null,
        };
      }),
    [holdings, priceMap, currency],
  );

  const totals = useMemo(() => {
    const byKind = {} as Record<HoldingKind, number>;
    for (const k of HOLDING_KINDS) byKind[k.kind] = 0;
    for (const h of priced) byKind[h.kind] = (byKind[h.kind] ?? 0) + h.value;
    const assets = priced.filter((h) => h.kind !== "liability").reduce((s, h) => s + h.value, 0);
    const liabilities = byKind.liability ?? 0;
    return { byKind, assets, liabilities, netWorth: assets - liabilities };
  }, [priced]);

  /** Vuelca los totales de las posiciones al perfil para que toda la app cuadre. */
  const syncProfile = async (list: PricedHolding[] = priced) => {
    if (!list.length) return;
    const patch: Record<string, number> = {};
    for (const k of HOLDING_KINDS) patch[PROFILE_FIELD[k.kind]] = 0;
    for (const h of list) patch[PROFILE_FIELD[h.kind]] = (patch[PROFILE_FIELD[h.kind]] ?? 0) + h.value;
    await save(patch as never);
  };

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["holdings", userId] });
  };

  const add = useMutation({
    mutationFn: async (h: Partial<Holding>) => {
      if (!userId) throw new Error("Sin sesión");
      const { error } = await supabase.from("holdings").insert({
        user_id: userId,
        kind: h.kind ?? "etf",
        label: h.label ?? "",
        ticker: h.ticker ?? null,
        quantity: h.quantity ?? 0,
        cost_basis: h.cost_basis ?? 0,
        manual_value: h.manual_value ?? 0,
        monthly_contribution: h.monthly_contribution ?? 0,
        expected_return: h.expected_return ?? 7,
        note: h.note ?? null,
        position: holdings.length,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Holding> }) => {
      const { error } = await supabase.from("holdings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("holdings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    holdings: priced,
    raw: holdings,
    totals,
    currency,
    isLoading: query.isLoading,
    pricesUpdatedAt: quotesQuery.data?.updatedAt ?? null,
    refreshPrices: () => quotesQuery.refetch(),
    isPricing: quotesQuery.isFetching,
    add: add.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    saving: add.isPending || update.isPending || remove.isPending,
    syncProfile,
  };
}

export type Snapshot = { id: string; taken_on: string; assets: number; liabilities: number; net_worth: number };

/** Fotos históricas del patrimonio para ver la evolución real mes a mes. */
export function useNetWorthSnapshots() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["net-worth-snapshots", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("net_worth_snapshots")
        .select("id, taken_on, assets, liabilities, net_worth")
        .eq("user_id", userId!)
        .order("taken_on", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: String(r.id),
        taken_on: String(r.taken_on),
        assets: Number(r.assets),
        liabilities: Number(r.liabilities),
        net_worth: Number(r.net_worth),
      })) as Snapshot[];
    },
  });

  const save = useMutation({
    mutationFn: async (s: { assets: number; liabilities: number; currency: string; breakdown?: Record<string, number> }) => {
      if (!userId) throw new Error("Sin sesión");
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("net_worth_snapshots").upsert(
        {
          user_id: userId,
          taken_on: today,
          assets: Math.round(s.assets),
          liabilities: Math.round(s.liabilities),
          net_worth: Math.round(s.assets - s.liabilities),
          currency: s.currency,
          breakdown: s.breakdown ?? {},
        },
        { onConflict: "user_id,taken_on" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["net-worth-snapshots", userId] });
    },
  });

  return { snapshots: query.data ?? [], isLoading: query.isLoading, saveSnapshot: save.mutateAsync, saving: save.isPending };
}
