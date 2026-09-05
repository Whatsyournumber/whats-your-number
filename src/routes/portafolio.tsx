import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarIcon, Pencil, Plus, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage, useT } from "@/hooks/use-language";
import { useMarketSeries, useQuotes, useSymbolSearch, useWatchlist } from "@/hooks/use-market";
import { getPortfolioInsight } from "@/lib/portfolio-ai.functions";
import { holdingValue, useHoldings } from "@/hooks/use-holdings";
import { useProfile } from "@/hooks/use-profile";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/portafolio")({
  head: () => ({
    meta: [
      { title: "Portafolio — Finance OS" },
      { name: "description", content: "ETFs, acciones, cripto y cash con costo promedio, rentabilidad, dividendos y benchmark." },
      { property: "og:title", content: "Portafolio — Finance OS" },
      { property: "og:description", content: "Rentabilidad de tu portafolio comparada contra el S&P 500." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Portafolio,
});

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

function PortafolioContent() {
  const isMobile = useIsMobile();
  const t = useT();
  const { lang } = useLanguage();

  const typeLabels: Record<(typeof types)[number], string> = {
    ETF: t("ETF", "ETF"),
    "Acción": t("Acción", "Stock"),
    "Renta fija": t("Renta fija", "Fixed income"),
    Estructurado: t("Producto estructurado", "Structured product"),
    Retiro: t("Fondo de retiro", "Retirement fund"),
    Cripto: t("Cripto", "Crypto"),
    Inmueble: t("Inmueble", "Real estate"),
    Cash: t("Cash", "Cash"),
  };
  const kindSubtitle = (kind: string) =>
    kind === "bond"
      ? t("Bono", "Bond")
      : kind === "tbill"
        ? t("Letra del tesoro", "T-Bill")
        : kind === "note"
          ? t("Nota", "Note")
          : kind === "structured"
            ? t("Producto estructurado", "Structured product")
            : kind === "etf"
              ? t("ETF", "ETF")
              : kind === "stock"
                ? t("Acción", "Stock")
                : kind === "crypto"
                  ? t("Cripto", "Crypto")
                  : t("Activo", "Asset");
  const { profile } = useProfile();
  const { holdings } = useHoldings();
  const d = buildDataset(profile);
  const fmt = (n: number, _dec?: number) => d.fmt(n);
  const r = Math.max(0, profile.expected_return || 7) / 100;

  const watchlist = useWatchlist();
  const quotesQuery = useQuotes(watchlist.symbols);
  const seriesQuery = useMarketSeries(["^GSPC", "^IXIC", "URTH", "SPY", "BTC-USD"]);
  const [benchmark, setBenchmark] = useState<"sp500" | "nasdaq" | "world">("sp500");
  const [newSymbol, setNewSymbol] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [evoIdx, setEvoIdx] = useState<number | null>(null);
  const [evoOpen, setEvoOpen] = useState(false);
  const searchQuery = useSymbolSearch(newSymbol);

  // Precios reales para las posiciones con ticker + unidades.
  const holdingSymbols = holdings.filter((h) => h.ticker && h.quantity > 0).map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries((holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]));
  // Cambio diario por ticker (para derivar retorno del mercado en ETFs/acciones/cripto).
  const dayChange: Record<string, number> = Object.fromEntries(
    (holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.changePct ?? 0]),
  );

  const typeOf = (kind: string) =>
    kind === "stock"
      ? ("Acción" as const)
      : kind === "retirement"
        ? ("Retiro" as const)
        : kind === "crypto"
        ? ("Cripto" as const)
        : kind === "structured"
        ? ("Estructurado" as const)
        : ["bond", "tbill", "note"].includes(kind)
          ? ("Renta fija" as const)
          : kind === "property"
            ? ("Inmueble" as const)
            : ("ETF" as const);

  const detailed = holdings
    .filter((h) => ["etf", "stock", "crypto", "other", "bond", "tbill", "note", "structured"].includes(h.kind))
    .map((h) => {
      const value = holdingValue(h, prices);
      // Retorno derivado del mercado: plusvalía real (valor hoy − costo) cuando hay ticker + costo;
      // si no hay costo pero hay ticker, usa el cambio diario del mercado. Resto: retorno esperado.
      const tk = h.ticker?.toUpperCase();
      // cost_basis guarda el MONTO TOTAL de compra (no el precio por unidad).
      const marketCost = h.cost_basis > 0 ? h.cost_basis : 0;
      const marketGrowth =
        tk && marketCost > 0 && value > 0
          ? (value - marketCost) / marketCost
          : tk && dayChange[tk] !== undefined
            ? dayChange[tk] / 100
            : null;
      const growth = marketGrowth !== null ? Math.max(0, marketGrowth) : Math.max(0, h.expected_return || 7) / 100;
      const tickerLabel = h.ticker || h.label || t("Activo", "Asset");
      return {
        ticker: tickerLabel,
        name: h.label && h.label !== tickerLabel ? h.label : kindSubtitle(h.kind),

        type: typeOf(h.kind),
        value,
        growth,
        income: Math.round((h.monthly_income || 0) * 12),
        cost:
          h.kind === "property"
            ? h.cost_basis > 0
              ? Math.round(h.cost_basis + (h.quantity || 0))
              : Math.round(value / (1 + growth))
            : h.cost_basis > 0
              ? Math.round(h.cost_basis)
              : Math.round(value / (1 + growth)),
        improvements: h.kind === "property" ? Math.round(h.quantity || 0) : 0,
        years:
          h.kind === "property" && h.target_year && h.target_year > 1900
            ? Math.max(0, new Date().getFullYear() - h.target_year)
            : 0,
      };
    })
    .filter((h) => h.value > 0);

  const cashDetailed = holdings.filter((h) => ["cash", "bank", "money_market"].includes(h.kind));
  if (cashDetailed.length) {
    const cash = cashDetailed.reduce((s, h) => s + holdingValue(h, prices), 0);
    if (cash > 0)
      detailed.push({
        ticker: t("Efectivo", "Cash"),
        name: t("Efectivo y cuentas bancarias", "Cash and bank accounts"),
        type: "Cash" as never,
        value: cash,
        growth: 0,
        income: 0,
        cost: cash,
        improvements: 0,
        years: 0,
      });
  }

  const fallback = [
    { ticker: t("ETFs / fondos", "ETFs / funds"), name: t("Fondos indexados y ETFs", "Index funds and ETFs"), type: "ETF" as const, value: profile.assets_etf, growth: r, income: 0, cost: Math.round(profile.assets_etf / (1 + r)), improvements: 0, years: 0 },
    { ticker: t("Acciones", "Stocks"), name: t("Posiciones individuales", "Individual positions"), type: "Acción" as const, value: profile.assets_stocks, growth: r * 1.3, income: 0, cost: Math.round(profile.assets_stocks / (1 + r * 1.3)), improvements: 0, years: 0 },
    { ticker: t("Cripto", "Crypto"), name: t("Activos digitales", "Digital assets"), type: "Cripto" as const, value: profile.assets_crypto, growth: r * 2, income: 0, cost: Math.round(profile.assets_crypto / (1 + r * 2)), improvements: 0, years: 0 },
    { ticker: t("Efectivo", "Cash"), name: t("Efectivo y cuentas bancarias", "Cash and bank accounts"), type: "Cash" as const, value: profile.assets_cash + profile.assets_bank, growth: 0, income: 0, cost: profile.assets_cash + profile.assets_bank, improvements: 0, years: 0 },
  ].filter((h) => h.value > 0);

  const positions = detailed.length ? detailed : fallback;

  const enriched = positions.map((h) => ({
    ...h,
    avgCost: h.cost,
    dividends:
      h.income > 0
        ? h.income
        : Math.round(
            h.type === "ETF"
              ? h.value * 0.018
              : h.type === "Retiro"
                ? 0
              : h.type === "Acción"
                ? h.value * 0.012
                : h.type === "Renta fija" || h.type === "Estructurado"
                  ? h.value * h.growth
                  : 0,
          ),
    gain: h.value - h.cost,
    ret: h.cost ? ((h.value - h.cost) / h.cost) * 100 : 0,
    cagr:
      h.cost > 0 && h.years > 0 ? (Math.pow(h.value / h.cost, 1 / h.years) - 1) * 100 : null,
  }));


  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalCost = enriched.reduce((s, h) => s + h.cost, 0);
  // Ganancia total: excluye cripto y ETF por requerimiento de negocio.
  const gainExcludedTypes = new Set(["Cripto", "ETF"]);
  const gainPositions = enriched.filter((h) => !gainExcludedTypes.has(h.type));
  const totalGain = gainPositions.reduce((s, h) => s + (h.value - h.cost), 0);
  const totalCostForGain = gainPositions.reduce((s, h) => s + h.cost, 0);
  // Rentabilidad real: promedio ponderado por capital invertido, solo de rubros que rinden
  // (excluye efectivo, posiciones sin ganancia, cripto y ETF).
  const yieldingHoldings = gainPositions.filter((h) => h.cost > 0 && h.value !== h.cost);
  const yieldingCost = yieldingHoldings.reduce((s, h) => s + h.cost, 0);
  const yieldingGain = yieldingHoldings.reduce((s, h) => s + (h.value - h.cost), 0);
  const totalRet = yieldingCost ? (yieldingGain / yieldingCost) * 100 : 0;

  const dividends = enriched.reduce((s, h) => s + h.dividends, 0);

  // ---- Análisis basado en tu data real ----
  const weightedReturn = totalValue
    ? enriched.reduce((s, h) => s + h.growth * 100 * h.value, 0) / totalValue
    : 0;
  // Valor futuro: proyección al edad de retiro con el retorno ponderado del portafolio.
  const yearsToRetire = Math.max(1, (profile.retire_age || 60) - (profile.age ?? 30));
  const futureValue = Math.round(totalValue * Math.pow(1 + weightedReturn / 100, yearsToRetire));
  const riskWeight = totalValue
    ? enriched
        .filter((h) => h.type === "Cripto" || h.type === "Acción")
        .reduce((s, h) => s + h.value, 0) / totalValue
    : 0;
  const safeWeight = totalValue
    ? enriched
        .filter((h) => h.type === "Cash" || h.type === "Renta fija" || h.type === "Estructurado")
        .reduce((s, h) => s + h.value, 0) / totalValue
    : 0;
  const cashWeight = totalValue
    ? enriched.filter((h) => h.type === "Cash").reduce((s, h) => s + h.value, 0) / totalValue
    : 0;
  const annualGain = gainPositions.reduce((s, h) => s + h.value * h.growth, 0);
  const top = [...enriched].sort((a, b) => b.value - a.value)[0];
  const concentration = top && totalValue ? (top.value / totalValue) * 100 : 0;
  const netAnnual = (totalValue * weightedReturn) / 100;
  const passiveMonthly = dividends / 12;
  // Nivel de riesgo del portafolio: volatilidad + concentración (solo posiciones de inversión).
  const riskScore = riskWeight * 100 * 0.6 + Math.max(0, concentration - 30) * 0.6;
  const riskLevel: "Alto" | "Medio" | "Bajo" = riskScore > 40 ? "Alto" : riskScore > 20 ? "Medio" : "Bajo";
  const riskLabel = t(riskLevel, riskLevel === "Alto" ? "High" : riskLevel === "Medio" ? "Medium" : "Low");

  const insights = [
    concentration > 40 && top
      ? {
          tone: "warn" as const,
          text: t(
            `Concentración alta: ${top.ticker} pesa ${concentration.toFixed(0)}% del portafolio. Diversificar reduce el riesgo.`,
            `High concentration: ${top.ticker} is ${concentration.toFixed(0)}% of the portfolio. Diversifying lowers risk.`,
          ),
        }
      : null,
    riskWeight > 0.7
      ? {
          tone: "warn" as const,
          text: t(
            `${(riskWeight * 100).toFixed(0)}% está en activos volátiles (acciones/cripto). Considera renta fija o cash para amortiguar caídas.`,
            `${(riskWeight * 100).toFixed(0)}% sits in volatile assets (stocks/crypto). Consider fixed income or cash as a buffer.`,
          ),
        }
      : null,
    safeWeight > 0.6
      ? {
          tone: "warn" as const,
          text: t(
            `${(safeWeight * 100).toFixed(0)}% está en cash y renta fija: seguro, pero rinde poco frente a la inflación.`,
            `${(safeWeight * 100).toFixed(0)}% is in cash and fixed income: safe, but it barely beats inflation.`,
          ),
        }
      : null,
    passiveMonthly > 0
      ? {
          tone: "good" as const,
          text: t(
            `Tu portafolio ya genera ~${fmt(Math.round(passiveMonthly))} al mes en ingresos pasivos (dividendos, cupones y rentas).`,
            `Your portfolio already generates ~${fmt(Math.round(passiveMonthly))} per month in passive income (dividends, coupons and rent).`,
          ),
        }
      : null,
  ].filter(Boolean) as { tone: "warn" | "good"; text: string }[];

  // Real market series: benchmarks vs a blend that mirrors your allocation (equities → SPY, crypto → BTC, cash → 0%).
  const series = seriesQuery.data?.series ?? {};
  const benchSymbol = benchmark === "nasdaq" ? "^IXIC" : benchmark === "world" ? "URTH" : "^GSPC";
  const benchName = benchmark === "nasdaq" ? "Nasdaq 100" : benchmark === "world" ? "MSCI World" : "S&P 500";
  const benchSeries = series[benchSymbol] ?? [];
  const spy = series["SPY"] ?? [];
  const btc = series["BTC-USD"] ?? [];
  const equityValue = profile.assets_etf + profile.assets_retirement + profile.assets_stocks;
  const cryptoValue = profile.assets_crypto;
  const cashValue = profile.assets_cash + profile.assets_bank;
  const base = equityValue + cryptoValue + cashValue;
  const wEq = base ? equityValue / base : 1;
  const wCr = base ? cryptoValue / base : 0;
  const benchmarkData = benchSeries.map((p, i) => ({
    label: p.label,
    bench: p.value,
    portfolio: (spy[i]?.value ?? p.value) * wEq + (btc[i]?.value ?? 0) * wCr,
  }));

  // ---- Estadística real: volatilidad, drawdown, beta, correlación, Sharpe ----
  const toReturns = (vals: number[]) =>
    vals.slice(1).map((v, i) => (1 + v / 100) / (1 + (vals[i] ?? 0) / 100) - 1);
  const pRet = toReturns(benchmarkData.map((p) => p.portfolio));
  const bRet = toReturns(benchmarkData.map((p) => p.bench));
  const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const std = (a: number[]) => {
    if (a.length < 2) return 0;
    const m = mean(a);
    return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
  };
  const ann = Math.sqrt(12);
  const volPort = std(pRet) * ann * 100;
  const volBench = std(bRet) * ann * 100;
  const covPB = pRet.length > 1 ? mean(pRet.map((x, i) => (x - mean(pRet)) * ((bRet[i] ?? 0) - mean(bRet)))) : 0;
  const beta = std(bRet) > 0 ? covPB / std(bRet) ** 2 : 0;
  const correlation = std(pRet) > 0 && std(bRet) > 0 ? covPB / (std(pRet) * std(bRet)) : 0;
  const port12 = benchmarkData.length ? benchmarkData[benchmarkData.length - 1]!.portfolio : 0;
  const bench12 = benchmarkData.length ? benchmarkData[benchmarkData.length - 1]!.bench : 0;
  const alpha12 = port12 - bench12;
  const riskFree = 4.2;
  const sharpe = volPort > 0 ? (port12 - riskFree) / volPort : 0;
  let peak = -Infinity;
  let maxDD = 0;
  for (const p of benchmarkData) {
    const v = 1 + p.portfolio / 100;
    peak = Math.max(peak, v);
    maxDD = Math.min(maxDD, v / peak - 1);
  }
  const maxDrawdown = maxDD * 100;
  const hasStats = benchmarkData.length > 3;

  // ---- Proyección compuesta a 12 meses: tu portafolio al rendimiento real ponderado, el índice a su ritmo de 12m ----
  const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const FUTURE_MONTHS = 12;
  const portMonthly = Math.pow(1 + weightedReturn / 100, 1 / 12) - 1;
  const benchAnnual = benchmarkData.length ? bench12 : 0;
  const benchMonthly = Math.pow(1 + Math.max(-0.95, benchAnnual / 100), 1 / 12) - 1;
  const now = new Date();
  const projectedData = benchmarkData.length
    ? Array.from({ length: FUTURE_MONTHS }, (_, k) => {
        const d = new Date(now.getFullYear(), now.getMonth() + k + 1, 1);
        const n = k + 1;
        const yy = String(d.getFullYear()).slice(-2);
        return {
          label: `${MONTHS_SHORT[d.getMonth()]} '${yy}`,
          portfolio: ((1 + port12 / 100) * Math.pow(1 + portMonthly, n) - 1) * 100,
          bench: ((1 + bench12 / 100) * Math.pow(1 + benchMonthly, n) - 1) * 100,
          projected: true,
        };
      })
    : [];
  const allPoints = [...benchmarkData.map((p) => ({ ...p, projected: false })), ...projectedData];

  // KPI "Rendimiento del portafolio": promedio ponderado real; con el calendario se ve el punto de cada mes
  // (pasado real o futuro proyectado en compound).
  const evoPoint = evoIdx !== null ? allPoints[evoIdx] ?? null : null;
  const shownRet = evoPoint ? evoPoint.portfolio : weightedReturn;
  const shownBench: number | null = evoPoint ? evoPoint.bench : benchmarkData.length ? bench12 : null;

  // Gráfica: histórico real + tramo proyectado (punteado) hasta el mes futuro elegido.
  const futureCount = evoPoint?.projected ? evoIdx! - benchmarkData.length + 1 : 0;
  const lastHist = benchmarkData[benchmarkData.length - 1];
  const chartData = [
    ...benchmarkData.map((p) => ({
      label: p.label,
      portfolio: p.portfolio,
      bench: p.bench,
      portfolioProj: p === lastHist && futureCount > 0 ? p.portfolio : undefined,
      benchProj: p === lastHist && futureCount > 0 ? p.bench : undefined,
    })),
    ...projectedData.slice(0, futureCount).map((p) => ({
      label: p.label,
      portfolio: undefined,
      bench: undefined,
      portfolioProj: p.portfolio,
      benchProj: p.bench,
    })),
  ];

  // ---- Distribución objetivo universal (glidepath por horizonte) ----
  const horizon = yearsToRetire;
  const targetEquity = Math.min(80, Math.max(30, 100 - (profile.age ?? 35) * 0.8));
  const targetAlloc = {
    equity: Math.round(targetEquity),
    fixed: Math.round(Math.max(10, 90 - targetEquity - (horizon > 15 ? 5 : 0))),
    crypto: horizon > 10 ? 5 : 2,
    cash: 0,
  };
  targetAlloc.cash = Math.max(0, 100 - targetAlloc.equity - targetAlloc.fixed - targetAlloc.crypto);
  const bucketOf = (ty: string) =>
    ty === "Cripto" ? "crypto" : ty === "Cash" ? "cash" : ty === "Renta fija" || ty === "Estructurado" ? "fixed" : "equity";
  const currentAlloc = { equity: 0, fixed: 0, crypto: 0, cash: 0 } as Record<string, number>;
  for (const h of enriched) currentAlloc[bucketOf(h.type)]! += h.value;
  const buckets = (["equity", "fixed", "crypto", "cash"] as const).map((k) => {
    const cur = totalValue ? (currentAlloc[k]! / totalValue) * 100 : 0;
    const tgt = targetAlloc[k];
    return { key: k, cur, tgt, deltaPct: tgt - cur, deltaAmount: Math.round(((tgt - cur) / 100) * totalValue) };
  });
  const bucketLabel: Record<string, string> = {
    equity: t("Renta variable", "Equities"),
    fixed: t("Renta fija", "Fixed income"),
    crypto: t("Cripto / alternativos", "Crypto / alternatives"),
    cash: t("Cash", "Cash"),
  };

  // ---- Análisis de riesgo y rebalanceo (2 líneas, basado en data real) ----
  const volPct = hasStats ? volPort : riskWeight * 100 * 1.2;
  // Métricas explicadas en lenguaje simple con valor cualitativo + frase clara.
  type Tone = "good" | "warn" | "neutral";

  // Diversificación efectiva (número efectivo de posiciones por HHI).
  const weights = totalValue > 0 ? enriched.map((h) => h.value / totalValue) : [];
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  const effectiveN = hhi > 0 ? 1 / hhi : enriched.length;

  // ---- Market risk analysis (debajo de la gráfica) ----
  const marketRiskMetrics: { label: string; value: string; qual: string; tone: Tone; sentence: string }[] = hasStats
    ? [
        {
          label: `${t("Volatilidad", "Volatility")}`,
          value: `${volPct.toFixed(1)}%`,
          qual:
            volPct > 22
              ? t("Alta", "High")
              : volPct > 14
                ? t("Moderada", "Moderate")
                : t("Baja", "Low"),
          tone: volPct > 22 ? ("warn" as Tone) : volPct > 14 ? ("neutral" as Tone) : ("good" as Tone),
          sentence:
            volPct > 22
              ? t("Tu cartera tiene movimientos fuertes.", "Your portfolio swings hard.")
              : volPct > 14
                ? t("Tu cartera tiene movimientos normales.", "Your portfolio has normal swings.")
                : t("Tu cartera se mueve poco, es estable.", "Your portfolio barely moves, it's stable."),
        },
        {
          label: `${t("Beta", "Beta")}`,
          value: beta.toFixed(2),
          qual:
            beta > 1.2
              ? t("Agresiva", "Aggressive")
              : beta < 0.85
                ? t("Defensiva", "Defensive")
                : t("Equilibrada", "Balanced"),
          tone: beta > 1.2 ? ("warn" as Tone) : beta < 0.85 ? ("good" as Tone) : ("neutral" as Tone),
          sentence:
            beta > 1.2
              ? t("Se mueve más que el mercado.", "It moves more than the market.")
              : beta < 0.85
                ? t("Se mueve menos que el mercado.", "It moves less than the market.")
                : t("Se mueve parecido al mercado.", "It moves about like the market."),
        },
        {
          label: `${t("Caída máxima", "Max drawdown")}`,
          value: `${maxDrawdown.toFixed(1)}%`,
          qual:
            maxDrawdown < -25
              ? t("Severa", "Severe")
              : maxDrawdown < -15
                ? t("Notable", "Notable")
                : t("Controlada", "Controlled"),
          tone: maxDrawdown < -25 ? ("warn" as Tone) : maxDrawdown < -15 ? ("neutral" as Tone) : ("good" as Tone),
          sentence:
            maxDrawdown < -25
              ? t("La peor pérdida histórica fue grande.", "The worst historical loss was large.")
              : maxDrawdown < -15
                ? t("La peor pérdida histórica fue notable.", "The worst historical loss was notable.")
                : t("La peor pérdida histórica fue limitada.", "The worst historical loss was limited."),
        },
        {
          label: `${t("Sharpe", "Sharpe")}`,
          value: sharpe.toFixed(2),
          qual:
            sharpe > 1
              ? t("Muy bueno", "Very good")
              : sharpe > 0.5
                ? t("Aceptable", "Acceptable")
                : t("Bajo", "Low"),
          tone: sharpe > 1 ? ("good" as Tone) : sharpe > 0.5 ? ("neutral" as Tone) : ("warn" as Tone),
          sentence:
            sharpe > 1
              ? t("Obtienes buen retorno para el riesgo asumido.", "You get good return for the risk taken.")
              : sharpe > 0.5
                ? t("El retorno es justo para el riesgo.", "The return is fair for the risk.")
                : t("El retorno no compensa el riesgo.", "The return doesn't justify the risk."),
        },
      ]
    : [
        {
          label: `${t("Volatilidad estimada", "Estimated volatility")}`,
          value: `${volPct.toFixed(0)}%`,
          qual:
            volPct > 22
              ? t("Alta", "High")
              : volPct > 14
                ? t("Moderada", "Moderate")
                : t("Baja", "Low"),
          tone: volPct > 22 ? ("warn" as Tone) : volPct > 14 ? ("neutral" as Tone) : ("good" as Tone),
          sentence:
            volPct > 22
              ? t("Tu cartera tiene movimientos fuertes.", "Your portfolio swings hard.")
              : volPct > 14
                ? t("Tu cartera tiene movimientos normales.", "Your portfolio has normal swings.")
                : t("Tu cartera se mueve poco, es estable.", "Your portfolio barely moves, it's stable."),
        },
      ];

  // ---- Portfolio metrics (debajo de posiciones) ----
  const portfolioMetrics: { label: string; value: string; qual: string; tone: Tone; sentence: string }[] = [
    {
      label: `${t("Diversificación", "Diversification")}`,
      value: effectiveN.toFixed(1),
      qual:
        effectiveN >= 5
          ? t("Alta", "High")
          : effectiveN >= 2.5
            ? t("Media", "Medium")
            : t("Baja", "Low"),
      tone: effectiveN >= 5 ? ("good" as Tone) : effectiveN >= 2.5 ? ("neutral" as Tone) : ("warn" as Tone),
      sentence:
        effectiveN >= 5
          ? t("Estás bien repartido entre varios activos.", "You're well spread across several assets.")
          : effectiveN >= 2.5
            ? t("Repito moderado, conviene ampliar posiciones.", "Moderate spread, worth adding positions.")
            : t("Dependes de pocos activos.", "You depend on few assets."),
    },
    {
      label: `${t("Concentración", "Concentration")}`,
      value: `${concentration.toFixed(0)}%`,
      qual:
        concentration > 40
          ? t("Alta", "High")
          : concentration > 25
            ? t("Media", "Medium")
            : t("Baja", "Low"),
      tone: concentration > 40 ? ("warn" as Tone) : concentration > 25 ? ("neutral" as Tone) : ("good" as Tone),
      sentence: top
        ? concentration > 40
          ? t(`Dependes mucho de ${top.ticker}.`, `You rely a lot on ${top.ticker}.`)
          : t(`Tu activo mayor es ${top.ticker}.`, `Your top asset is ${top.ticker}.`)
        : concentration > 40
          ? t("Dependes mucho de un solo activo.", "You rely a lot on one asset.")
          : t("Estás bien diversificado.", "You're well diversified."),
    },
    {
      label: `${t("Activos volátiles", "Volatile assets")}`,
      value: `${(riskWeight * 100).toFixed(0)}%`,
      qual:
        riskWeight > 0.7
          ? t("Alta", "High")
          : riskWeight > 0.4
            ? t("Media", "Medium")
            : t("Baja", "Low"),
      tone: riskWeight > 0.7 ? ("warn" as Tone) : riskWeight > 0.4 ? ("neutral" as Tone) : ("good" as Tone),
      sentence:
        riskWeight > 0.7
          ? t("Mucho en acciones y cripto.", "A lot in stocks and crypto.")
          : riskWeight > 0.4
            ? t("Parte en acciones y cripto.", "Some in stocks and crypto.")
            : t("Poco en activos volátiles.", "Little in volatile assets."),
    },
    {
      label: `${t("Liquidez", "Liquidity")}`,
      value: `${(cashWeight * 100).toFixed(0)}%`,
      qual:
        cashWeight > 0.4
          ? t("Alta", "High")
          : cashWeight > 0.1
            ? t("Media", "Medium")
            : t("Baja", "Low"),
      tone: cashWeight > 0.4 ? ("warn" as Tone) : cashWeight > 0.1 ? ("good" as Tone) : ("neutral" as Tone),
      sentence:
        cashWeight > 0.4
          ? t("Mucho cash sin rendir.", "Too much idle cash.")
          : cashWeight > 0.1
            ? t("Colchón de cash sano.", "Healthy cash buffer.")
            : t("Poco cash disponible.", "Little cash available."),
    },
  ];

  // Referencia combinada para el análisis de IA.
  const riskMetrics = [...marketRiskMetrics, ...portfolioMetrics];
  // Línea 2 — recomendación universal de distribución y balanceo según el drift.
  const drift = buckets.find((b) => Math.abs(b.deltaPct) === Math.max(...buckets.map((x) => Math.abs(x.deltaPct))));
  const biggestDrift = drift && Math.abs(drift.deltaPct) >= 5 ? drift : null;
  const riskAdvice = biggestDrift
    ? biggestDrift.deltaPct > 0
      ? t(
          `Considera subir ${bucketLabel[biggestDrift.key]} hacia el ${biggestDrift.tgt}% (hoy ${biggestDrift.cur.toFixed(0)}%). Podrías usar aportes nuevos antes de vender; revisa cada 6 meses.`,
          `Consider raising ${bucketLabel[biggestDrift.key]} toward ${biggestDrift.tgt}% (now ${biggestDrift.cur.toFixed(0)}%). You could use new contributions before selling; review every 6 months.`,
        )
      : t(
          `Podrías revisar ${bucketLabel[biggestDrift.key]}, del ${biggestDrift.cur.toFixed(0)}% al objetivo ${biggestDrift.tgt}%. Vale la pena mirar el exceso y redistribuir gradualmente.`,
          `You could review ${bucketLabel[biggestDrift.key]}, from ${biggestDrift.cur.toFixed(0)}% to the ${biggestDrift.tgt}% target. Worth looking at the excess and gradually redistributing.`,
        )
    : riskLevel === "Alto"
      ? t(
          "Distribución alineada, aunque el riesgo es algo alto. Vale la pena bajar la exposición volátil y diversificar la mayor posición de forma gradual.",
          "Allocation aligned, though risk is somewhat high. It's worth gradually lowering volatile exposure and diversifying the largest position.",
        )
      : riskLevel === "Medio"
        ? t(
            "Distribución alineada con tu horizonte. Conviene mantener 6 meses de gastos en cash y revisar el balance cada 6 meses.",
            "Allocation aligned with your horizon. It's wise to keep 6 months of expenses in cash and review the balance every 6 months.",
          )
        : t(
            "Distribución alineada y portafolio defensivo. Podrías considerar algo más de renta variable para acompañar la inflación.",
            "Allocation aligned and defensive portfolio. You could consider a bit more equity to keep pace with inflation.",
          );

  // ---- Explicación con IA (con fallback a los textos locales) ----
  const insightKey = JSON.stringify({
    lang,
    r: riskLevel,
    m: riskMetrics.map((m) => `${m.label}:${m.value}`),
    b: buckets.map((b) => `${b.key}:${b.cur.toFixed(0)}/${b.tgt}`),
  });
  const insight = useQuery({
    queryKey: ["portfolio-insight", insightKey],
    enabled: totalValue > 0,
    staleTime: 30 * 60_000,
    retry: false,
    queryFn: () =>
      getPortfolioInsight({
        data: {
          lang: lang === "en" ? "en" : "es",
          currency: "USD",
          riskLevel,
          metrics: riskMetrics.map((m) => ({ label: m.label, value: m.value })),
          buckets: buckets.map((b) => ({ label: bucketLabel[b.key]!, current: b.cur, target: b.tgt })),
          totalValue,
          annualGain,
          topPosition: top ? { name: top.ticker, pct: concentration } : null,
        },
      }),
  });
  const aiHints = insight.data?.hints ?? [];
  const aiAdvice = insight.data?.advice?.trim() || riskAdvice;

  // Resumen interpretativo: nuevo análisis, no repite los números de arriba.
  const volDesc = volPct > 22 ? t("alta volatilidad", "high volatility") : volPct > 14 ? t("volatilidad moderada", "moderate volatility") : t("baja volatilidad", "low volatility");
  const betaDesc = beta > 1.2 ? t("se mueve más que el mercado", "moves more than the market") : beta < 0.85 ? t("se mueve menos que el mercado", "moves less than the market") : t("sigue al mercado", "tracks the market");
  const ddDesc = maxDrawdown < -25 ? t("caídas severas en el pasado", "severe past drawdowns") : maxDrawdown < -15 ? t("caídas notables pero asumibles", "notable but manageable drawdowns") : t("caídas controladas", "controlled drawdowns");
  const sharpeDesc = sharpe > 1 ? t("buen retorno por unidad de riesgo", "good return per unit of risk") : sharpe > 0.5 ? t("retorno justo para el riesgo asumido", "fair return for the risk taken") : t("el retorno no compensa el riesgo", "return doesn't justify the risk");
  const concDesc = concentration > 40 ? top ? t(`excesiva dependencia de ${top.ticker}`, `over-reliance on ${top.ticker}`) : t("excesiva concentración", "over-concentration") : concentration > 25 ? t("concentración media", "medium concentration") : t("bien diversificado", "well diversified");
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const metricSummary = cap(t(
    `Tu portafolio presenta ${volDesc} y ${betaDesc}. Históricamente ha tenido ${ddDesc}, lo que indica cuánto podría bajar en un mal momento. ${sharpeDesc} y está ${concDesc}.`,
    `Your portfolio shows ${volDesc} and ${betaDesc}. Historically it has had ${ddDesc}, which indicates how much it could fall in a bad moment. ${sharpeDesc} and it is ${concDesc}.`,
  ));

  const types = ["ETF", "Acción", "Renta fija", "Estructurado", "Retiro", "Cripto", "Inmueble", "Cash"] as const;
  const allocation = types
    .map((ty, i) => ({
      name: ty,
      value: enriched.filter((h) => h.type === ty).reduce((s, h) => s + h.value, 0),
      color: chartColors[i]!,
    }))
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value);
  const activeTypes = types.filter((ty) => enriched.some((h) => h.type === ty && h.value > 0));

  const rows = (list: typeof enriched) => (
    <div className="space-y-2">
      {[...list].sort((a, b) => {
        const aC = a.type === "Cripto" ? 1 : 0;
        const bC = b.type === "Cripto" ? 1 : 0;
        if (aC !== bC) return aC - bC;
        return b.value - a.value;
      }).map((h) => {
        const isEtf = h.type === "ETF" || h.type === "Cripto";
        const tk = h.ticker?.toUpperCase();
        const today = tk && dayChange[tk] !== undefined ? dayChange[tk] : null;
        return (
        <div key={h.ticker} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-elevated/60 p-3 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <p className="text-sm font-medium">{h.ticker}</p>
            <p className="truncate text-xs text-muted-foreground">{h.type === "Cripto" ? t("Cripto", "Crypto") : h.name}</p>
          </div>
          {isEtf ? (
            <>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Valor actual", "Current value")}</p>
                <p className="numeric text-sm font-medium">{fmt(h.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Valor compra", "Purchase value")}</p>
                <p className="numeric text-sm text-muted-foreground">{fmt(h.cost)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {t("Mercado hoy", "Market today")}
                  {tk && prices[tk] ? (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                    </span>
                  ) : null}
                </p>
                <p className="numeric text-sm font-semibold">{tk && prices[tk] ? prices[tk].toLocaleString("en-US", { maximumFractionDigits: prices[tk] < 10 ? 4 : 2 }) : "—"}</p>
                <p className={cn("numeric text-[11px]", today === null ? "text-muted-foreground/50" : today < 0 ? "text-negative" : "text-positive")}>
                  {today === null ? "—" : `${today > 0 ? "+" : ""}${today.toFixed(2)}%`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
                <p className="numeric text-sm">{fmt(h.value)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Ganancia anual", "Annual gain")}</p>
                <p className={cn("numeric text-sm", Math.round(h.value * h.growth) === 0 ? "text-muted-foreground/50" : "text-positive")}>
                  {Math.round(h.value * h.growth) === 0 ? "—" : fmt(Math.round(h.value * h.growth))}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Ganancia mensual", "Monthly gain")}</p>
                <p className={cn("numeric text-sm", Math.round((h.value * h.growth) / 12) === 0 ? "text-muted-foreground/50" : "text-positive")}>
                  {Math.round((h.value * h.growth) / 12) === 0 ? "—" : fmt(Math.round((h.value * h.growth) / 12))}
                </p>
              </div>
            </>
          )}

          <div>
            <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
            <p className={cn("numeric text-sm font-semibold", h.ret === 0 ? "text-muted-foreground/50" : h.ret >= 0 ? "text-positive" : "text-negative")}>
              {h.ret === 0 ? "—" : `${h.ret > 0 ? "+" : ""}${h.ret.toFixed(1)}%`}
            </p>
            {h.cagr !== null && !isEtf && h.cagr !== 0 && (
              <p className="text-[10px] text-muted-foreground">
                {h.cagr > 0 ? "+" : ""}
                {h.cagr.toFixed(1)}% {t("anual", "annual")} · {h.years} {t("años", "yrs")}
              </p>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );

  const calendarLabel = evoPoint ? evoPoint.label : t("Actual", "Current");

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Inversiones", "Investments")}
        title={t("Portfolio", "Portfolio")}
        subtitle={t("Todos tus activos en tiempo real", "All your assets in real time")}
        actions={
          <Popover open={evoOpen} onOpenChange={setEvoOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-full">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs md:text-sm">{calendarLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" collisionPadding={12} className="w-[min(92vw,20rem)] p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("Evolución · últimos 12 meses", "Evolution · last 12 months")}
              </p>
              {benchmarkData.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("Mercado no disponible", "Market unavailable")}</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {benchmarkData.map((p, i) => {
                    const active = evoIdx === i;
                    return (
                      <button
                        key={`${p.label}-${i}`}
                        type="button"
                        onClick={() => {
                          setEvoIdx(active ? null : i);
                          setEvoOpen(false);
                        }}
                        className={cn(
                          "rounded-lg border px-1.5 py-1.5 text-center transition",
                          active
                            ? "border-primary/50 bg-primary/15 text-foreground"
                            : "border-border/50 bg-elevated/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className="block text-[11px] font-medium">{p.label}</span>
                        <span className={cn("numeric block text-[10px]", p.portfolio >= 0 ? "text-positive" : "text-negative")}>
                          {p.portfolio > 0 ? "+" : ""}
                          {p.portfolio.toFixed(1)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {evoPoint && (
                <button
                  type="button"
                  onClick={() => {
                    setEvoIdx(null);
                    setEvoOpen(false);
                  }}
                  className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {t("Volver al rendimiento actual", "Back to current return")}
                </button>
              )}
            </PopoverContent>
          </Popover>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("Valor actual", "Current value")} value={fmt(totalValue)} accent index={0} />
        <KpiCard label={t("Ganancia total", "Total gain")} value={fmt(totalGain)} delta={totalCostForGain > 0 ? (totalGain / totalCostForGain) * 100 : 0} index={1} />
        <KpiCard label={t("Ganancia mensual", "Monthly gain")} value={fmt(Math.round(totalGain / 12))} index={2} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
          className="surface relative flex h-full flex-col overflow-hidden p-5"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("Rendimiento del portafolio", "Portfolio return")}
          </p>
          <p
            className={cn(
              "numeric relative mt-3 truncate text-2xl font-semibold leading-tight md:text-3xl",
              shownRet > 0 ? "text-positive" : shownRet < 0 ? "text-negative" : "text-foreground",
            )}
          >
            {shownRet > 0 ? "+" : ""}
            {shownRet.toFixed(1)}%
          </p>
          <div className="relative mt-auto flex items-center gap-2 pt-2">
            {shownBench !== null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  shownRet - shownBench >= 0 ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
                )}
              >
                {shownRet - shownBench > 0 ? "+" : ""}
                {(shownRet - shownBench).toFixed(1)}%
              </span>
            )}
            <span className="truncate text-xs text-muted-foreground">
              {evoPoint
                ? t(`${evoPoint.label} · vs ${benchName}`, `${evoPoint.label} · vs ${benchName}`)
                : shownBench !== null
                  ? t(`vs ${benchName} 12m`, `vs ${benchName} 12m`)
                  : t("Promedio ponderado real", "Real weighted average")}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={t(`Portafolio vs ${benchName}`, `Portfolio vs ${benchName}`)}
          description={t("Datos reales de mercado · últimos 12 meses", "Real market data · last 12 months")}
          className="lg:col-span-2"
          actions={
            <div className="flex rounded-full border border-border/60 p-0.5">
              {([
                { k: "sp500", l: "S&P 500" },
                { k: "nasdaq", l: "Nasdaq" },
                { k: "world", l: "MSCI World" },
              ] as const).map((b) => (
                <button
                  key={b.k}
                  type="button"
                  onClick={() => setBenchmark(b.k)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] transition",
                    benchmark === b.k ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {b.l}
                </button>
              ))}
            </div>
          }
        bleedMobile
        >
          {benchmarkData.length === 0 ? (
            <div className="flex h-[290px] items-center justify-center text-sm text-muted-foreground">
              {seriesQuery.isLoading ? t("Cargando mercado…", "Loading market…") : t("Mercado no disponible", "Market unavailable")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={benchmarkData} margin={{ left: isMobile ? 0 : -18, right: isMobile ? 4 : 8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={isMobile ? 38 : 46} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
                <Line type="monotone" dataKey="portfolio" name={t("Portafolio", "Portfolio")} stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="bench" name={benchName} stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/40 px-5 pt-3 sm:px-0 lg:grid-cols-4">
            {marketRiskMetrics.map((m) => (
              <div key={m.label}>
                <p className="truncate text-[10px] font-medium text-muted-foreground">{m.label}</p>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <p className="numeric text-base font-bold text-foreground">{m.value}</p>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide",
                      m.tone === "good"
                        ? "bg-positive/12 text-positive"
                        : m.tone === "warn"
                          ? "bg-negative/12 text-negative"
                          : "bg-amber-400/12 text-amber-200",
                    )}
                  >
                    {m.qual}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>


        <Panel title={t("Composición", "Composition")} bleedMobile>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3} stroke="none">
                {allocation.map((a) => (
                  <Cell key={a.name} fill={a.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-3 space-y-1.5 px-5 sm:px-0">
            {allocation.map((a) => (
              <li key={a.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                <span className="text-muted-foreground">{typeLabels[a.name]}</span>
                <span className="numeric ml-auto font-medium">{totalValue > 0 ? ((a.value / totalValue) * 100).toFixed(0) : 0}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title={t("Posiciones", "Positions")}
        description={`${enriched.length} ${t("posiciones", "positions")}`}
        actions={
          <Link
            to="/mi-perfil"
            hash="patrimonio"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            aria-label={t("Editar en mis datos", "Edit in my data")}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("Editar", "Edit")}
          </Link>
        }
      >
        <Tabs defaultValue="Todos">
          <TabsList className="mb-4">
            <TabsTrigger value="Todos">{t("Todos", "All")}</TabsTrigger>
            {activeTypes.map((ty) => (
              <TabsTrigger key={ty} value={ty}>
                {typeLabels[ty]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Todos">{rows(enriched)}</TabsContent>
          {activeTypes.map((ty) => (
            <TabsContent key={ty} value={ty}>
              {rows(enriched.filter((h) => h.type === ty))}
            </TabsContent>
          ))}
        </Tabs>

        <div className="relative mt-2 overflow-hidden rounded-2xl border border-border/50 bg-elevated/50 px-4 py-3.5">
          <div className="grid grid-cols-2 items-center gap-3 md:grid-cols-6">
            <div className="col-span-2 flex items-center gap-2 md:col-span-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
              </span>
              <p className="text-sm font-bold tracking-wide text-foreground">{t("Total", "Total")}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
              <p className="numeric text-base font-bold text-foreground">{fmt(totalValue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{t("Ganancia anual", "Annual gain")}</p>
              <p className="numeric text-base font-bold text-positive">{fmt(Math.round(annualGain))}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{t("Ganancia mensual", "Monthly gain")}</p>
              <p className="numeric text-base font-bold text-positive">{fmt(Math.round(annualGain / 12))}</p>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
              <p className={cn("numeric text-base font-bold", totalRet >= 0 ? "text-positive" : "text-negative")}>
                {totalRet > 0 ? "+" : ""}
                {totalRet.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("Nivel de riesgo", "Risk level")}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                riskLevel === "Alto"
                  ? "bg-negative/12 text-negative"
                  : riskLevel === "Medio"
                    ? "bg-amber-400/12 text-amber-200"
                    : "bg-positive/12 text-positive",
              )}
            >
              {riskLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {portfolioMetrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border/50 bg-elevated/30 px-3 py-2.5">
                <p className="truncate text-[11px] font-medium text-foreground">{m.label}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <p className="numeric text-lg font-bold text-foreground">{m.value}</p>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      m.tone === "good"
                        ? "bg-positive/12 text-positive"
                        : m.tone === "warn"
                          ? "bg-negative/12 text-negative"
                          : "bg-amber-400/12 text-amber-200",
                    )}
                  >
                    {m.qual}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{m.sentence}</p>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "flex flex-col gap-2 rounded-xl border px-4 py-3.5",
              riskLevel === "Alto"
                ? "border-negative/25 bg-negative/[0.06]"
                : riskLevel === "Medio"
                  ? "border-amber-400/25 bg-amber-400/[0.06]"
                  : "border-positive/25 bg-positive/[0.06]",
            )}
          >
            <div className="flex items-center gap-2 text-sm">
              <Sparkles
                className={cn(
                  "h-4 w-4 shrink-0",
                  riskLevel === "Alto" ? "text-negative" : riskLevel === "Medio" ? "text-amber-200" : "text-positive",
                )}
              />
              <span className="font-semibold text-foreground">
                {t("Qué hacer ahora", "What to do now")}
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {metricSummary} {insight.isLoading ? t("Analizando…", "Analyzing…") : aiAdvice}
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-positive shadow-[0_0_10px_var(--positive)]" />
            </span>
            {t("Mercado en vivo", "Live market")}
          </span>
        }
        description={t("ETFs, acciones y cripto · precios reales, actualizados cada minuto", "ETFs, stocks and crypto · real prices, refreshed every minute")}
        actions={
          <button
            type="button"
            onClick={() => quotesQuery.refetch()}
            className="rounded-lg border border-border/60 p-1.5 text-muted-foreground transition hover:text-foreground"
            aria-label={t("Actualizar", "Refresh")}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", quotesQuery.isFetching && "animate-spin")} />
          </button>
        }
      >
        <form
          className="relative mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const pick = searchQuery.data?.hits?.[0]?.symbol ?? newSymbol;
            if (watchlist.add(pick)) {
              setNewSymbol("");
              setSearchOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={newSymbol}
              onChange={(e) => {
                setNewSymbol(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              placeholder={t("Busca por nombre o ticker…", "Search by name or ticker…")}
              className="h-10 rounded-full border-border/60 bg-elevated/70 pl-9 pr-9 text-sm transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25"
            />
            {newSymbol && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setNewSymbol("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={t("Limpiar", "Clear")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {searchOpen && newSymbol.trim().length >= 1 && (
              <div className="absolute left-0 top-12 z-30 w-[min(26rem,90vw)] overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
                {searchQuery.isFetching && !searchQuery.data && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">{t("Buscando…", "Searching…")}</p>
                )}
                {(searchQuery.data?.hits ?? []).slice(0, 8).map((h) => (
                  <button
                    key={h.symbol}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (watchlist.add(h.symbol)) {
                        setNewSymbol("");
                        setSearchOpen(false);
                      }
                    }}
                    className="group flex w-full items-center gap-3 border-b border-border/40 px-3 py-2.5 text-left transition last:border-0 hover:bg-primary/10"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                      {h.symbol.slice(0, 2)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight">{h.symbol}</span>
                      <span className="block truncate text-xs text-muted-foreground">{h.name}</span>
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{h.type}</span>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-primary" />
                    </span>
                  </button>
                ))}
                {!searchQuery.isFetching && (searchQuery.data?.hits?.length ?? 0) === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">{t("Sin resultados", "No results")}</p>
                )}
              </div>
            )}
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-10 shrink-0 rounded-full px-4">
            {t("Agregar", "Add")}
          </Button>
        </form>


        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(quotesQuery.data?.quotes ?? []).map((q) => (
            <div key={q.symbol} className="group flex items-center gap-3 rounded-xl bg-elevated/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{q.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{q.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="numeric text-sm">
                  {q.price.toLocaleString("en-US", { style: "currency", currency: q.currency || "USD", maximumFractionDigits: q.price < 10 ? 4 : 2 })}
                </p>
                <p className={cn("numeric text-xs font-medium", q.changePct >= 0 ? "text-positive" : "text-negative")}>
                  {q.changePct > 0 ? "+" : ""}
                  {q.changePct.toFixed(2)}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => watchlist.remove(q.symbol)}
                className="text-muted-foreground opacity-0 transition group-hover:opacity-100"
                aria-label={t("Quitar", "Remove")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {quotesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">{t("Cargando precios…", "Loading prices…")}</p>
          )}
        </div>
        {quotesQuery.data?.updatedAt && (() => {
          const d = new Date(quotesQuery.data.updatedAt);
          const ny = d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          const local = d.toLocaleTimeString();
          const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(d);
          const get = (tp: string) => parts.find((p) => p.type === tp)?.value ?? "";
          const wd = get("weekday");
          const mins = Number(get("hour")) * 60 + Number(get("minute"));
          const open = !["Sat", "Sun"].includes(wd) && mins >= 9 * 60 + 30 && mins < 16 * 60;
          return (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className={cn("inline-flex items-center gap-1.5 font-medium", open ? "text-positive" : "text-muted-foreground")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", open ? "bg-positive" : "bg-muted-foreground/60")} />
                {open ? t("Bolsa de Nueva York abierta", "New York Stock Exchange open") : t("Bolsa de Nueva York cerrada", "New York Stock Exchange closed")}
              </span>
              <span className="opacity-40">·</span>
              <span>{t("Hora Nueva York (NYSE)", "New York time (NYSE)")} {ny} ET</span>
              <span className="opacity-40">·</span>
              <span>{t("Actualizado", "Updated")} {local} {t("hora local", "local time")}</span>
            </p>
          );
        })()}

      </Panel>



    </PageShell>
  );
}

function Portafolio() {
  return (
    <PlanGate required="pro">
      <PortafolioContent />
    </PlanGate>
  );
}
