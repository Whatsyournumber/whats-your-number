import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Pencil } from "lucide-react";

import { cn } from "@/lib/utils";


import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { MonthEvolutionPicker } from "@/components/month-evolution-picker";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useT, useLanguage } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions } from "@/hooks/use-transactions";
import { holdingValue, useHoldings } from "@/hooks/use-holdings";
import { useDailySeries, useMarketSeries, useQuotes } from "@/hooks/use-market";
import { marketReturnPct, purchaseUnitPrice } from "@/lib/holding-return";
import { buildDataset } from "@/lib/profile-data";
import { buildRealMonths } from "@/lib/real-months";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimonio — WhatsYournumber" },
      { name: "description", content: "Activos, pasivos, asset allocation y crecimiento de tu patrimonio neto." },
      { property: "og:title", content: "Patrimonio — WhatsYournumber" },
      { property: "og:description", content: "Efectivo, bancos, fondos, ETFs, cripto, propiedades y deudas consolidados." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Patrimonio,
});

type RiskLevel = "low" | "mid" | "high";

/** Clase de activo y nivel de riesgo por rubro del patrimonio. */
const ASSET_CLASS: Record<string, { es: string; en: string; risk: RiskLevel }> = {
  assets_cash: { es: "Efectivo y equivalentes", en: "Cash & equivalents", risk: "low" },
  assets_bank: { es: "Efectivo y equivalentes / depósitos", en: "Cash & equivalents / deposits", risk: "low" },
  assets_retirement: { es: "Fondos de inversión / mixto", en: "Mutual funds / balanced", risk: "mid" },
  assets_etf: { es: "Fondos y ETF (renta fija y variable)", en: "Funds & ETFs (fixed income & equities)", risk: "mid" },
  assets_bonds: { es: "Renta fija", en: "Fixed income", risk: "low" },
  assets_structured: { es: "Productos estructurados", en: "Structured products", risk: "mid" },
  assets_stocks: { es: "Renta variable", en: "Equities", risk: "high" },
  assets_crypto: { es: "Activos digitales", en: "Digital assets", risk: "high" },
  assets_property: { es: "Bienes raíces", en: "Real estate", risk: "mid" },
  assets_commodities: { es: "Materias primas", en: "Commodities", risk: "mid" },
  assets_private_equity: { es: "Inversiones alternativas", en: "Private equity", risk: "high" },
  assets_future: { es: "Inversiones alternativas / futuras", en: "Alternative / future assets", risk: "high" },
};

const RISK_LABEL: Record<RiskLevel, { es: string; en: string; cls: string }> = {
  low: { es: "riesgo bajo", en: "low risk", cls: "text-positive/80 border-positive/25 bg-positive/10" },
  mid: { es: "riesgo medio", en: "medium risk", cls: "text-chart-4 border-chart-4/25 bg-chart-4/10" },
  high: { es: "riesgo alto", en: "high risk", cls: "text-negative/90 border-negative/25 bg-negative/10" },
};

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function monthlyReturns(values: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1]!;
    r.push(prev === 0 ? 0 : (values[i]! - prev) / prev);
  }
  return r;
}

function maxDrawdown(values: number[]): number {
  if (values.length === 0) return 0;
  let peak = values[0]!;
  let dd = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    if (peak > 0) dd = Math.max(dd, (peak - v) / peak);
  }
  return -dd;
}

const BETA_BY_CLASS: Record<string, number> = {
  assets_cash: 0,
  assets_bank: 0,
  assets_bonds: 0.3,
  assets_structured: 0.5,
  assets_etf: 0.7,
  assets_retirement: 0.6,
  assets_property: 0.8,
  assets_stocks: 1.1,
  assets_crypto: 1.5,
  assets_future: 1.3,
  assets_private_equity: 1.4,
};

const VOL_BY_CLASS: Record<string, number> = {
  assets_cash: 0,
  assets_bank: 0,
  assets_bonds: 0.05,
  assets_structured: 0.08,
  assets_etf: 0.15,
  assets_retirement: 0.10,
  assets_property: 0.12,
  assets_stocks: 0.20,
  assets_crypto: 0.60,
  assets_future: 0.30,
  assets_private_equity: 0.35,
};

const RETURN_BY_CLASS: Record<string, number> = {
  assets_cash: 0.0,
  assets_bank: 0.01,
  assets_bonds: 0.04,
  assets_structured: 0.05,
  assets_etf: 0.07,
  assets_retirement: 0.05,
  assets_property: 0.06,
  assets_stocks: 0.09,
  assets_crypto: 0.15,
  assets_future: 0.12,
  assets_private_equity: 0.11,
};

function PatrimonioContent() {
  const isMobile = useIsMobile();
  const t = useT();
  const { lang } = useLanguage();
  const { profile } = useProfile();
  const { transactions } = useTransactions();
  const { holdings } = useHoldings();
  const d = buildDataset(profile);
  const { fmt, fmtCompact, assets } = d;
  const [evoMonth, setEvoMonth] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<"none" | "sp500" | "nasdaq" | "world">("none");
  const seriesQuery = useMarketSeries(["^GSPC", "^IXIC", "URTH"]);



  // Precios reales para posiciones con ticker.
  const holdingSymbols = holdings.filter((h) => h.ticker && (h.quantity > 0 || h.cost_basis > 0 || h.manual_value > 0)).map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries((holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]));
  const dayChange: Record<string, number> = Object.fromEntries(
    (holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.changePct ?? 0]),
  );
  // Series mensuales reales para deducir el precio del día de compra cuando no hay unidades.
  const holdingSeriesQuery = useMarketSeries(holdingSymbols);
  const holdingSeries = holdingSeriesQuery.data?.series ?? {};
  // Cierres diarios: rentabilidad exacta desde el día de compra (compras de hace días).
  const holdingDaily = useDailySeries(holdingSymbols).data?.series ?? {};

  // Pasivos: deudas explícitas (TDC, préstamos) + hipotecas ligadas a propiedades.
  const debtRows = holdings
    .filter((h) => h.kind === "debt" && holdingValue(h) > 0)
    .map((h) => ({ id: h.id, label: h.label || t("Deuda", "Debt"), value: holdingValue(h), interest: h.expected_return }));
  const mortgageRows = holdings
    .filter((h) => h.kind === "property" && h.linked_liability > 0)
    .map((h) => ({ id: `mort-${h.id}`, label: t(`Hipoteca · ${h.label || t("Propiedad", "Property")}`, `Mortgage · ${h.label || t("Property", "Property")}`), value: h.linked_liability, interest: 0 }));
  const liabilityRows = [...debtRows, ...mortgageRows].sort((a, b) => b.value - a.value);

  // Detalle completo: inversiones + inmuebles + retiro + cash + activos futuros (trading, venta, etc.).
  const groupOf = (kind: string) =>
    ["cash", "bank", "money_market"].includes(kind)
      ? { key: "cash", label: t("Liquidez", "Cash") }
      : kind === "retirement"
        ? { key: "retirement", label: t("Fondo de retiro", "Retirement fund") }
        : kind === "property"
          ? { key: "property", label: t("Inmuebles", "Real estate") }
          : kind === "future"
            ? { key: "future", label: t("Activos futuros", "Future assets") }
            : { key: "invest", label: t("Inversiones", "Investments") };

  const kindLabel = (kind: string) =>
    ({
      cash: t("Efectivo", "Cash"),
      bank: t("Cuenta bancaria", "Bank account"),
      money_market: t("Money market", "Money market"),
      etf: t("ETF", "ETF"),
      stock: t("Acción", "Stock"),
      bond: t("Bono", "Bond"),
      tbill: t("Letra del tesoro", "T-Bill"),
      note: t("Nota", "Note"),
      structured: t("Producto estructurado", "Structured product"),
      crypto: t("Cripto", "Crypto"),
      retirement: t("Fondo de retiro", "Retirement fund"),
      property: t("Inmueble", "Real estate"),
      future: t("Activo futuro", "Future asset"),
      other: t("Otro", "Other"),
    })[kind] ?? t("Activo", "Asset");

  const detailRows = holdings
    .filter((h) => h.kind !== "debt")
    .map((h) => {
      const raw = holdingValue(h, prices);
      const weighted = h.kind === "future" ? Math.round((raw * (h.probability ?? 100)) / 100) : raw;

      // Ganancia real por tipo de activo:
      // · Inmueble → renta anual declarada (no revalorización).
      // · Efectivo → no genera intereses.
      // · Ticker con costo de compra → plusvalía real de mercado (valor hoy − costo).
      // · Resto → rentabilidad esperada.
      // Mismo criterio que Portafolio: el costo mostrado es el valor de compra registrado
      // y la plusvalía se mide contra el costo total (precio de compra × unidades).
      const cost = h.cost_basis > 0 ? Math.round(h.cost_basis) : 0;
      // cost_basis guarda el MONTO TOTAL de compra (no el precio por unidad).
      const marketCost = h.cost_basis > 0 ? h.cost_basis : 0;
      const marketGain = h.ticker && marketCost > 0 && raw > 0 ? raw - marketCost : null;
      let annual: number;
      if (h.kind === "property") annual = Math.round(h.monthly_income * 12);
      else if (h.kind === "cash") annual = 0;
      else if (marketGain !== null) annual = Math.round(marketGain);
      else annual = Math.round((weighted * (h.expected_return || 0)) / 100);
      // Rentabilidad de acciones/ETF/cripto: precio de hoy vs precio del día de compra.
      const tickerKey = h.ticker?.toUpperCase() ?? null;
      const priceRate = tickerKey
        ? marketReturnPct(h, prices[tickerKey] ?? null, holdingSeries[tickerKey] ?? null, holdingDaily[tickerKey] ?? null)
        : null;
      const rate =
        priceRate !== null
          ? priceRate
          : marketGain !== null
            ? (marketGain / marketCost) * 100
            : weighted > 0
              ? (annual / weighted) * 100
              : 0;


      return {
        id: h.id,
        group: groupOf(h.kind),
        kind: h.kind,
        label: h.label || kindLabel(h.kind),
        sub: kindLabel(h.kind),
        ticker: h.ticker,
        cost,
        // Strike price: precio por unidad al que se compró el activo.
        strike: tickerKey
          ? purchaseUnitPrice(h, holdingSeries[tickerKey] ?? null, holdingDaily[tickerKey] ?? null)
          : null,
        livePrice: h.ticker ? (prices[h.ticker.toUpperCase()] ?? null) : null,
        quantity: h.quantity,
        value: weighted,
        annual,
        rate,
        isMarketGain: marketGain !== null,
        monthlyContribution: h.monthly_contribution,
        monthlyIncome: h.monthly_income,
        mortgage: h.kind === "property" ? h.linked_liability : 0,
        targetYear: h.kind === "future" ? h.target_year : null,
        probability: h.kind === "future" ? h.probability : null,
      };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => {
      // ETFs y cripto siempre al final (cripto de últimas).
      const rank = (k: string) => (k === "crypto" ? 2 : k === "etf" ? 1 : 0);
      const ra = rank(a.kind);
      const rb = rank(b.kind);
      if (ra !== rb) return ra - rb;
      return b.value - a.value;
    });

  const groups = ["invest", "retirement", "property", "future", "cash"]
    .map((key) => {
      const rows = detailRows.filter((r) => r.group.key === key);
      return { key, label: rows[0]?.group.label ?? "", rows, total: rows.reduce((s, r) => s + r.value, 0) };
    })
    .filter((g) => g.rows.length > 0)
    .sort((a, b) => b.total - a.total);
  const [activeTab, setTab] = useState("all");
  const visibleRows = activeTab === "all" ? detailRows : detailRows.filter((r) => r.group.key === activeTab);
  const visibleTotal = visibleRows.reduce((s, r) => s + r.value, 0);
  // Ganancia anual/mensual del Total: SOLO propiedad + bono + producto estructurado + trading.
  const totalGainRows = visibleRows.filter((r) =>
    ["property", "bond", "structured", "future"].includes(r.kind),
  );
  const visibleAnnual = Math.round(totalGainRows.reduce((s, r) => s + r.annual, 0));
  // Rentabilidad total ponderada por el peso (valor actual) de esos mismos rubros.
  const yieldingBase = totalGainRows.reduce((s, r) => s + r.value, 0);
  const visibleRate = yieldingBase ? (visibleAnnual / yieldingBase) * 100 : 0;

  // Rentabilidad global del patrimonio (KPI superior): mismos rubros generadores de renta,
  // calculada sobre TODO el portfolio para que coincida con la fila Total en "Todos".
  const overallGainRows = detailRows.filter((r) =>
    ["property", "bond", "structured", "future"].includes(r.kind),
  );
  const overallAnnual = Math.round(overallGainRows.reduce((s, r) => s + r.annual, 0));
  const overallYieldingBase = overallGainRows.reduce((s, r) => s + r.value, 0);
  const overallRate = overallYieldingBase ? (overallAnnual / overallYieldingBase) * 100 : 0;




  // Activos futuros (trading, venta de empresa…) ponderados: suman al patrimonio y al allocation.
  const futureTotal = detailRows.filter((r) => r.group.key === "future").reduce((s, r) => s + r.value, 0);

  // ETF, bonos y notas estructuradas son productos distintos: se separan en filas propias
  // (el perfil los agrega todos en "assets_etf").
  const sumKinds = (kinds: string[]) =>
    detailRows.filter((r) => kinds.includes(r.kind)).reduce((s, r) => s + r.value, 0);
  const bondsTotal = sumKinds(["bond", "tbill"]);
  const notesTotal = sumKinds(["note", "structured"]);
  const etfTotal = sumKinds(["etf", "other"]);
  const splitFunds = bondsTotal + notesTotal + etfTotal > 0;

  // Valor en tiempo real por rubro: si hay detalle de posiciones, cada rubro se
  // recalcula con los precios de mercado (cripto, acciones, ETF…) en vez del total estático del perfil.
  const LIVE_KINDS: Record<string, string[]> = {
    assets_cash: ["cash"],
    assets_bank: ["bank", "money_market"],
    assets_retirement: ["retirement"],
    assets_etf: ["etf", "other", "bond", "tbill", "note", "structured"],
    assets_stocks: ["stock"],
    assets_crypto: ["crypto"],
    assets_property: ["property"],
  };
  const hasDetail = holdings.length > 0;
  const LIVE_NAMES: Record<string, { name: string; color: string }> = {
    assets_stocks: { name: t("Acciones", "Stocks"), color: "var(--color-chart-4)" },
  };
  const liveAssetsBase = hasDetail
    ? assets.map((a) => (LIVE_KINDS[a.key] ? { ...a, value: sumKinds(LIVE_KINDS[a.key]!) } : a)).filter((a) => a.value > 0)
    : assets;
  // Rubros con valor real pero ausentes del perfil (p. ej. acciones añadidas directamente): se agregan.
  const liveAssets = hasDetail
    ? [
        ...liveAssetsBase,
        ...Object.entries(LIVE_KINDS)
          .filter(([key]) => !liveAssetsBase.some((a) => a.key === key))
          .map(([key, kinds]) => ({
            key,
            name: LIVE_NAMES[key]?.name ?? key,
            value: sumKinds(kinds),
            color: LIVE_NAMES[key]?.color ?? "var(--color-chart-1)",
          }))
          .filter((r) => r.value > 0),
      ]
    : liveAssetsBase;

  // Variación del día ponderada por rubro (solo posiciones con ticker y precio real).
  const dayChangeOf = (kinds: string[]): number | null => {
    const rows = detailRows.filter((r) => kinds.includes(r.kind) && r.ticker && r.livePrice);
    const base = rows.reduce((s, r) => s + r.value, 0);
    if (!base) return null;
    return rows.reduce((s, r) => s + r.value * (dayChange[r.ticker!.toUpperCase()] ?? 0), 0) / base;
  };
  const liveKeys = new Set(
    detailRows.filter((r) => r.ticker && r.livePrice).map((r) => Object.keys(LIVE_KINDS).find((k) => LIVE_KINDS[k]!.includes(r.kind)) ?? ""),
  );

  const baseAssets = splitFunds
    ? liveAssets.flatMap((a) =>
        a.key === "assets_etf"
          ? [
              { key: "assets_etf", name: t("ETFs / fondos", "ETFs / funds"), value: etfTotal, color: a.color },
              { key: "assets_bonds", name: t("Bonos", "Bonds"), value: bondsTotal, color: "var(--color-chart-2)" },
              { key: "assets_structured", name: t("Notas estructuradas", "Structured notes"), value: notesTotal, color: "var(--color-chart-5)" },
            ].filter((r) => r.value > 0)
          : [a],
      )
    : liveAssets;

  const assetRows = (futureTotal > 0
    ? [...baseAssets, { key: "assets_future", name: t("Activos futuros", "Future assets"), value: futureTotal, color: "var(--color-chart-3)" }]
    : baseAssets
  ).slice().sort((a, b) => b.value - a.value);

  const totalAssetsAll = hasDetail ? assetRows.reduce((s, a) => s + a.value, 0) : d.totalAssets + futureTotal;
  const netWorthAll = totalAssetsAll - d.totalLiabilities;

  // Aportes/compras de activos agrupados por el mes real en que se registraron.
  const holdingContributions = (() => {
    const map: Record<string, number> = {};
    for (const h of holdings) {
      if (h.kind === "debt") continue;
      const date = h.created_at;
      if (!date) continue;
      const key = String(date).slice(0, 7);
      const value = h.manual_value || h.cost_basis || 0;
      if (!value) continue;
      map[key] = (map[key] ?? 0) + value;
    }
    return map;
  })();
  // La serie mensual cierra exactamente en el patrimonio neto en vivo que se muestra arriba.
  const rawMonths = buildRealMonths(transactions, netWorthAll, { contributions: holdingContributions }) ?? d.months;
  // El pasado no puede bajar de cero ni superar lo realmente comprado hasta esa fecha:
  // cada mes se limita al valor actual de los activos sin fecha + lo acumulado en compras.
  const months = (() => {
    if (!hasDetail) return rawMonths;
    const holdingsNow = holdings
      .filter((h) => h.kind !== "debt")
      .reduce((s, h) => s + (h.manual_value || h.cost_basis || 0), 0);
    const staticBase = Math.max(0, totalAssetsAll - holdingsNow);
    let cum = 0;
    return rawMonths.map((m, i) => {
      const key = (m as { month?: string }).month ?? "";
      if (/^\d{4}-\d{2}$/.test(key)) cum += holdingContributions[key] ?? 0;
      // El último mes siempre es el patrimonio en vivo (incluye plusvalías sobre el costo).
      if (i === rawMonths.length - 1) return { ...m, netWorth: Math.round(netWorthAll) };
      const cap = staticBase + cum;
      const nw = Math.max(0, Math.min(m.netWorth, cap));
      return nw === m.netWorth ? m : { ...m, netWorth: Math.round(nw) };
    });
  })();

  // Calendario de evolución: elegir un mes recorta la gráfica y mueve las tarjetas a ese mes.
  const monthKeys = months.map((m, i) => (m as { month?: string }).month ?? `idx-${i}`);
  const realKeys = monthKeys.filter((k) => /^\d{4}-\d{2}$/.test(k));
  const evoIdx = evoMonth ? monthKeys.indexOf(evoMonth) : -1;
  const chartMonths = (evoIdx >= 0 ? months.slice(0, evoIdx + 1) : months).slice(-12);

  // Valores de las tarjetas: con mes elegido, muestran ese mes; sin elegir, el vivo.
  const selIdx = evoIdx >= 0 ? evoIdx : months.length - 1;
  const selNetWorth = months[selIdx]?.netWorth ?? netWorthAll;
  const selPrev = selIdx > 0 ? (months[selIdx - 1]?.netWorth ?? 0) : 0;
  const growthMonth = selPrev !== 0 ? ((selNetWorth - selPrev) / Math.abs(selPrev)) * 100 : 0;
  const selAssets = selNetWorth + d.totalLiabilities;

  // Comparación contra benchmarks: patrimonio e índice indexados a % desde el primer mes.
  const benchSymbol = benchmark === "nasdaq" ? "^IXIC" : benchmark === "world" ? "URTH" : "^GSPC";
  const benchName = benchmark === "nasdaq" ? "Nasdaq 100" : benchmark === "world" ? "MSCI World" : "S&P 500";
  const benchSeriesRaw = benchmark === "none" ? [] : (seriesQuery.data?.series?.[benchSymbol] ?? []);
  const compareLen = Math.min(chartMonths.length, benchSeriesRaw.length);
  const comparing = benchmark !== "none" && compareLen > 1;
  const compareData = (() => {
    if (!comparing) return [];
    const nwSlice = chartMonths.slice(chartMonths.length - compareLen);
    const bSlice = benchSeriesRaw.slice(benchSeriesRaw.length - compareLen);
    // Base: primer patrimonio positivo del tramo (evita bases 0/negativas que disparan los %).
    const base = nwSlice.find((m) => m.netWorth > 0)?.netWorth ?? nwSlice[nwSlice.length - 1]?.netWorth ?? 0;
    const b0 = bSlice[0]!.value;
    return nwSlice.map((m, i) => {
      // El índice se escala a dinero: mismo patrimonio base con el rendimiento real del índice.
      const benchPct = bSlice[i]!.value - b0;
      const netPct = base > 0 ? ((m.netWorth - base) / base) * 100 : 0;
      return {
        label: m.label,
        netWorth: m.netWorth,
        bench: base * (1 + benchPct / 100),
        netPct,
        benchPct,
      };
    });
  })();




  // Métricas de riesgo del patrimonio basadas en el allocation actual.
  const weights = assetRows.map((a) => ({ ...a, weight: totalAssetsAll > 0 ? a.value / totalAssetsAll : 0 }));
  const portfolioBeta =
    totalAssetsAll > 0
      ? weights.reduce((s, a) => s + a.weight * (BETA_BY_CLASS[a.key] ?? 0.8), 0)
      : 0;
  const portfolioVolatility =
    totalAssetsAll > 0
      ? Math.sqrt(weights.reduce((s, a) => s + Math.pow(a.weight * (VOL_BY_CLASS[a.key] ?? 0.10), 2), 0)) * 100
      : 0;
  const portfolioExpectedReturn =
    totalAssetsAll > 0
      ? weights.reduce((s, a) => s + a.weight * (RETURN_BY_CLASS[a.key] ?? 0.05), 0)
      : 0;
  const netWorthSeries = chartMonths.map((m) => m.netWorth);
  const historicalDrawdown = maxDrawdown(netWorthSeries) * 100;
  const estimatedDrawdown = -1.5 * portfolioVolatility;
  const drawdown = Math.min(historicalDrawdown, estimatedDrawdown);
  const riskFreeRate = 0.045;
  const sharpe = portfolioVolatility > 0 ? (portfolioExpectedReturn - riskFreeRate) / (portfolioVolatility / 100) : 0;

  const riskAllocation = {
    low: assetRows
      .filter((a) => ASSET_CLASS[a.key]?.risk === "low")
      .reduce((s, a) => s + a.value, 0),
    mid: assetRows
      .filter((a) => ASSET_CLASS[a.key]?.risk === "mid")
      .reduce((s, a) => s + a.value, 0),
    high: assetRows
      .filter((a) => ASSET_CLASS[a.key]?.risk === "high")
      .reduce((s, a) => s + a.value, 0),
  };

  const riskMetrics = [
    {
      key: "low",
      label: t("Riesgo bajo", "Low risk"),
      value: `${totalAssetsAll > 0 ? ((riskAllocation.low / totalAssetsAll) * 100).toFixed(0) : "0"}%`,
      badge: t("BAJA", "LOW"),
      tone: "positive" as const,
    },
    {
      key: "mid",
      label: t("Riesgo medio", "Medium risk"),
      value: `${totalAssetsAll > 0 ? ((riskAllocation.mid / totalAssetsAll) * 100).toFixed(0) : "0"}%`,
      badge: t("MEDIA", "MEDIUM"),
      tone: "mid" as const,
    },
    {
      key: "high",
      label: t("Riesgo alto", "High risk"),
      value: `${totalAssetsAll > 0 ? ((riskAllocation.high / totalAssetsAll) * 100).toFixed(0) : "0"}%`,
      badge: t("ALTA", "HIGH"),
      tone: "negative" as const,
    },
  ];

  const riskBadgeClass = (tone: string) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      tone === "positive" && "border-positive/25 bg-positive/10 text-positive",
      tone === "mid" && "border-chart-4/25 bg-chart-4/10 text-chart-4",
      tone === "negative" && "border-negative/25 bg-negative/10 text-negative",
    );

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Balance", "Balance")}
        title={t("Patrimonio", "Net worth")}
        subtitle={t("Todo lo que tienes y lo que debes, en una sola vista.", "Everything you own and owe, in one view.")}
        actions={<MonthEvolutionPicker availableKeys={realKeys} value={evoMonth} onChange={setEvoMonth} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("Patrimonio neto", "Net worth")}
          labelSm={t("Patrimonio", "Net worth")}
          value={fmt(selNetWorth)}
          delta={growthMonth}
          hint={evoIdx >= 0 ? t("vs el mes anterior", "vs previous month") : t("vs el mes pasado", "vs last month")}
          accent
          index={0}
        />
        <KpiCard label={t("Activos", "Assets")} value={fmt(selAssets)} index={1} />
        <KpiCard
          label={t("Pasivos", "Liabilities")}
          labelSm={t("Deudas", "Debts")}
          value={fmt(d.totalLiabilities)}
          inverse
          index={2}
        />
        <KpiCard
          label={t("Rentabilidad estimada", "Estimated return")}
          labelSm={t("Rent. estimada", "Est. return")}
          value={`${overallRate.toFixed(1)}%`}
          hint={t("anual sobre activos con renta", "annual on income assets")}
          index={3}
        />

      </div>


      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={comparing ? t("Rendimiento", "Performance") : t("Crecimiento del patrimonio", "Net worth growth")}
          {...(comparing ? { description: t(`vs ${benchName} · ${compareLen}m`, `vs ${benchName} · ${compareLen}m`) } : {})}
          className="flex flex-col p-3 md:p-5 lg:col-span-2"
          bleedMobile
          actions={
            <div className="flex flex-nowrap items-center rounded-full border border-border/60 p-0.5">
              {([
                { k: "sp500", l: "S&P 500" },
                { k: "nasdaq", l: "Nasdaq" },
                { k: "world", l: "MSCI World" },
              ] as const).map((b) => (
                <button
                  key={b.k}
                  type="button"
                  onClick={() => setBenchmark((cur) => (cur === b.k ? "none" : b.k))}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium transition sm:px-2.5 sm:text-[11px]",
                    benchmark === b.k
                      ? "border border-chart-2/50 bg-chart-2/15 text-chart-2 shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {b.l}
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-2 flex flex-wrap items-center justify-start gap-4 text-xs sm:gap-6">
            <div className="flex items-center gap-2 text-positive">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-positive" />
              <span>{t("Tu portafolio", "Your portfolio")}</span>
            </div>
            {comparing && (
              <div className="flex items-center gap-2 text-chart-2">
                <span className="relative h-0.5 w-4 shrink-0 bg-chart-2">
                  <span className="absolute inset-0 border-t border-dashed border-chart-2" />
                </span>
                <span>{benchName}</span>
              </div>
            )}
          </div>

          <div className="min-h-[340px] flex-1 md:min-h-[420px] lg:min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={comparing ? compareData : chartMonths}
                margin={{ left: isMobile ? 0 : -20, right: isMobile ? 4 : 0, top: 8 }}
              >
                <defs>
                  <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis
                  {...axisProps}
                  domain={[
                    (dataMin: number) => (dataMin >= 0 ? dataMin * 0.92 : dataMin * 1.08),
                    (dataMax: number) => (dataMax >= 0 ? dataMax * 1.08 : dataMax * 0.92),
                  ]}
                  tickFormatter={(v) => fmtCompact(Number(v))}
                  width={isMobile ? 42 : 48}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      {...(comparing
                        ? {
                            formatter: (v: number, item) => {
                              const row = item?.payload as { netPct?: number; benchPct?: number } | undefined;
                              const pct = item?.dataKey === "bench" ? row?.benchPct : row?.netPct;
                              const pctTxt = pct !== undefined ? ` · ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "";
                              return `${fmt(v)}${pctTxt}`;
                            },
                          }
                        : {})}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name={t("Tu patrimonio", "Your net worth")}
                  stroke="var(--color-positive)"
                  strokeWidth={2.5}
                  fill={comparing ? "none" : "url(#pw)"}
                />
                {comparing && (
                  <Line
                    type="monotone"
                    dataKey="bench"
                    name={benchName}
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="grid grid-cols-3 gap-4">
              {riskMetrics.map((m) => (
                <div key={m.key} className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="numeric text-xl font-semibold tracking-tight">{m.value}</span>
                    <span className={riskBadgeClass(m.tone)}>{m.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={t("Asset allocation", "Asset allocation")} className="flex flex-col" bleedMobile>
          {assetRows.length === 0 ? (
            <div className="space-y-3 px-5 py-8 text-center sm:px-0">
              <p className="text-sm text-muted-foreground">{t("Aún no registras activos.", "You haven't recorded any assets yet.")}</p>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/mi-perfil">{t("Añadir mis activos", "Add my assets")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="h-[230px] w-full shrink-0 sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetRows} dataKey="value" nameKey="name" innerRadius="42%" outerRadius="78%" paddingAngle={3} stroke="none">
                      {assetRows.map((a) => (
                        <Cell key={a.name} fill={a.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 shrink-0 space-y-1.5 px-5 sm:px-0">
                {assetRows.map((a) => (
                  <li key={a.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                    <span className="truncate text-muted-foreground">{a.name}</span>
                    <span className="numeric ml-auto font-medium">{((a.value / Math.max(1, totalAssetsAll)) * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("Activos", "Assets")} description={fmt(totalAssetsAll)}>
          <div className="space-y-2">
            {assetRows.map((a) => {
              const info = ASSET_CLASS[a.key];
              const risk = info ? RISK_LABEL[info.risk] : null;
              return (
                <div key={a.name} className="flex items-center gap-2.5 rounded-xl bg-elevated/60 p-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: a.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    {info && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[11px] text-muted-foreground">{t(info.es, info.en)}</span>
                        {risk && (
                          <span className={`shrink-0 whitespace-nowrap rounded-full border px-1.5 py-px text-[10px] font-medium ${risk.cls}`}>
                            {t(risk.es, risk.en)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="numeric ml-auto shrink-0 text-sm font-semibold">{fmt(a.value)}</span>
                </div>
              );
            })}

            {assetRows.length === 0 && <p className="text-sm text-muted-foreground">{t("Sin activos registrados.", "No assets recorded.")}</p>}
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-full">
            <Link to="/mi-perfil">{t("Editar activos", "Edit assets")}</Link>
          </Button>
        </Panel>

        <Panel title={t("Pasivos", "Liabilities")} description={fmt(d.totalLiabilities)}>
          <div className="space-y-2">
            {liabilityRows.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-xl bg-elevated/60 p-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-negative" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.label}</p>
                  {l.interest > 0 && (
                    <p className="text-[11px] text-muted-foreground">{t(`${l.interest}% anual`, `${l.interest}% annual`)}</p>
                  )}
                </div>
                <span className="numeric ml-auto shrink-0 text-sm font-semibold">{fmt(l.value)}</span>
              </div>
            ))}
            {liabilityRows.length === 0 && <p className="text-sm text-muted-foreground">{t("No registras deudas. 🎉", "You have no debts. 🎉")}</p>}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border p-4">
            <p className="text-xs text-muted-foreground">{t("Ratio deuda / activos", "Debt / asset ratio")}</p>
            <p className="numeric mt-1 text-2xl font-semibold">
              {totalAssetsAll > 0 ? ((d.totalLiabilities / totalAssetsAll) * 100).toFixed(1) : "0.0"}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("Bajo el 40% se considera saludable", "Below 40% is considered healthy")}</p>
          </div>
        </Panel>
      </div>

      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            {t("Detalle de tus activos", "Your assets in detail")}
            <Link
              to="/mi-perfil"
              hash="patrimonio"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="tabular-nums">({detailRows.length} {t("activos", "assets")})</span>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </span>
        }
      >
        {detailRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Aún no registras activos.", "You haven't recorded any assets yet.")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1 rounded-full bg-elevated/60 p-1">
              {[{ key: "all", label: t("Todos", "All") }, ...groups.map((g) => ({ key: g.key, label: g.label }))].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTab(tab.key)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors",
                    activeTab === tab.key ? "bg-background font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {visibleRows.map((r) => {
                const annual = r.annual;
                const isCash = r.group.key === "cash";
                const isRetirement = r.group.key === "retirement";
                const gainLabel =
                  r.kind === "property"
                    ? t("Renta anual", "Annual rent")
                    : r.isMarketGain
                      ? t("Plusvalía", "Market gain")
                      : t("Ganancia anual", "Annual gain");
                const gainTone = annual > 0 ? "text-positive" : annual < 0 ? "text-negative" : "text-muted-foreground";
                const isMarketRow = r.kind === "etf" || r.kind === "crypto";
                const qtyFmt = r.quantity > 0 ? Number(r.quantity.toPrecision(6)).toString() : null;
                const meta = isMarketRow
                  ? [r.sub, r.ticker && r.quantity > 0 ? `${qtyFmt} u.` : null].filter(Boolean)
                  : [
                      r.sub,
                      r.ticker && r.quantity > 0 ? `${qtyFmt} u.` : null,
                      r.cost > 0 ? t(`Compra ${fmt(r.cost)}`, `Cost ${fmt(r.cost)}`) : null,
                      r.monthlyContribution > 0 ? t(`+${fmt(r.monthlyContribution)}/mes`, `+${fmt(r.monthlyContribution)}/mo`) : null,
                      r.targetYear ? String(r.targetYear) : null,
                      r.probability != null && r.probability < 100 ? `${r.probability}%` : null,
                    ].filter(Boolean);
                const isEtf = r.kind === "etf" || r.kind === "crypto" || (r.kind === "stock" && r.livePrice);
                const tk = r.ticker?.toUpperCase();
                const today = tk && dayChange[tk] !== undefined ? dayChange[tk] : null;
                return (
                  <div key={r.id} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-elevated/60 p-3 md:grid-cols-6">
                    <div className="col-span-2 md:col-span-2 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.label}
                        {r.ticker ? <span className="ml-2 text-xs text-muted-foreground">{r.ticker}</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.kind === "crypto" ? t("Cripto", "Crypto") : r.kind === "etf" ? "" : meta.join(" · ")}
                      </p>

                    </div>
                    {isEtf ? (
                      <>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t("Valor actual", "Current value")}</p>
                          <p className="numeric text-sm font-medium">{fmt(r.value)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{r.kind === "crypto" ? t("Precio promedio", "Average price") : t("Strike price", "Strike price")}</p>
                          <p className="numeric text-sm text-muted-foreground">
                            {r.strike && r.strike > 0
                              ? r.strike.toLocaleString("en-US", { maximumFractionDigits: r.strike < 10 ? 4 : 2 })
                              : "—"}
                          </p>
                          {r.quantity && r.quantity > 0 && r.kind !== "property" ? (
                            <p className="numeric text-[11px] text-muted-foreground/80">
                              {r.quantity.toLocaleString(lang === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 4 })} {r.ticker?.replace("-USD", "")}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {t("Mercado hoy", "Market today")}
                            {r.livePrice ? (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive/70" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                              </span>
                            ) : null}
                          </p>
                          <p className="numeric text-sm font-semibold">
                            {r.livePrice ? r.livePrice.toLocaleString("en-US", { maximumFractionDigits: r.livePrice < 10 ? 4 : 2 }) : "—"}
                          </p>
                          <p className={cn("numeric text-[11px]", today === null ? "text-muted-foreground/50" : today < 0 ? "text-negative" : "text-positive")}>
                            {today === null ? "—" : `${today > 0 ? "+" : ""}${today.toFixed(2)}%`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
                          <p className="numeric text-sm">{fmt(r.value)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{gainLabel}</p>
                          <p className={cn("numeric text-sm", isCash || isRetirement || annual === 0 ? "text-muted-foreground/50" : gainTone)}>
                            {isCash || isRetirement || annual === 0 ? "—" : fmt(annual)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">{t("Ganancia mensual", "Monthly gain")}</p>
                          <p className={cn("numeric text-sm", isCash || isRetirement || annual === 0 ? "text-muted-foreground/50" : gainTone)}>
                            {isCash || isRetirement || annual === 0 ? "—" : fmt(Math.round(annual / 12))}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
                      <p className={cn("numeric text-sm font-semibold", isCash || r.rate === 0 ? "text-muted-foreground/50" : gainTone)}>
                        {isCash || r.rate === 0 ? "—" : `${r.rate > 0 ? "+" : ""}${r.rate.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 items-center gap-3 rounded-xl border-2 border-border bg-elevated px-4 py-3.5 md:grid-cols-6">
              <div className="col-span-2 md:col-span-2">
                <p className="text-sm font-bold uppercase tracking-wide text-foreground">{t("Total", "Total")}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
                <p className="numeric text-base font-bold">{fmt(visibleTotal)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Ganancia anual", "Annual gain")}</p>
                <p className="numeric text-base font-bold text-positive">{fmt(visibleAnnual)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Ganancia mensual", "Monthly gain")}</p>
                <p className="numeric text-base font-bold text-positive">{fmt(Math.round(visibleAnnual / 12))}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
                <p className={cn("numeric text-base font-bold", visibleRate === 0 ? "text-muted-foreground/50" : "text-positive")}>
                  {visibleRate === 0 ? "—" : `${visibleRate > 0 ? "+" : ""}${visibleRate.toFixed(1)}%`}
                </p>

              </div>
            </div>
          </div>
        )}
      </Panel>
    </PageShell>

  );
}

function Patrimonio() {
  return (
    <PlanGate required="pro">
      <PatrimonioContent />
    </PlanGate>
  );
}
