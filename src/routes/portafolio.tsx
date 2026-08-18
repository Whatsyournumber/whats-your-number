import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useT } from "@/hooks/use-language";
import { useMarketSeries, useQuotes, useWatchlist } from "@/hooks/use-market";
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
  "var(--color-chart-1)",
];

function PortafolioContent() {
  const t = useT();
  const typeLabels: Record<(typeof types)[number], string> = {
    ETF: t("ETF", "ETF"),
    "Acción": t("Acción", "Stock"),
    "Renta fija": t("Renta fija", "Fixed income"),
    Estructurado: t("Structured product", "Structured product"),
    Retiro: t("Fondo de retiro", "Retirement fund"),
    Cripto: t("Cripto", "Crypto"),
    Inmueble: t("Inmueble", "Real estate"),
    Cash: t("Cash", "Cash"),
  };
  const { profile } = useProfile();
  const { holdings } = useHoldings();
  const d = buildDataset(profile);
  const fmt = (n: number, _dec?: number) => d.fmt(n);
  const r = Math.max(0, profile.expected_return || 7) / 100;

  const watchlist = useWatchlist();
  const quotesQuery = useQuotes(watchlist.symbols);
  const seriesQuery = useMarketSeries(["^GSPC", "SPY", "BTC-USD"]);
  const [newSymbol, setNewSymbol] = useState("");

  // Precios reales para las posiciones con ticker + unidades.
  const holdingSymbols = holdings.filter((h) => h.ticker && h.quantity > 0).map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries((holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]));

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
    .filter((h) => ["etf", "stock", "crypto", "other", "retirement", "bond", "tbill", "note", "structured", "property"].includes(h.kind))
    .map((h) => {
      const value = holdingValue(h, prices);
      const growth = Math.max(0, h.expected_return || 7) / 100;
      return {
        ticker: h.ticker || h.label || t("Activo", "Asset"),
        name: h.label || h.ticker || "",
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
    { ticker: t("Fondo de retiro", "Retirement fund"), name: t("Plan de pensiones / retiro", "Pension / retirement plan"), type: "Retiro" as const, value: profile.assets_retirement, growth: r * 0.8, income: 0, cost: Math.round(profile.assets_retirement / (1 + r * 0.8)), improvements: 0, years: 0 },
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
  const totalGain = totalValue - totalCost;
  const dividends = enriched.reduce((s, h) => s + h.dividends, 0);

  // ---- Análisis basado en tu data real ----
  const weightedReturn = totalValue
    ? enriched.reduce((s, h) => s + h.growth * 100 * h.value, 0) / totalValue
    : 0;
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
  const top = [...enriched].sort((a, b) => b.value - a.value)[0];
  const concentration = top && totalValue ? (top.value / totalValue) * 100 : 0;
  const debts = holdings.filter((h) => h.kind === "debt");
  const debtTotal =
    debts.reduce((s, h) => s + h.manual_value, 0) +
    holdings.filter((h) => h.kind === "property").reduce((s, h) => s + h.linked_liability, 0);
  const debtCost = debts.reduce((s, h) => s + h.manual_value * (Math.max(0, h.expected_return || 0) / 100), 0);
  const netAnnual = (totalValue * weightedReturn) / 100 - debtCost;
  const passiveMonthly = dividends / 12;
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
    debtCost > 0 && debtCost > (totalValue * weightedReturn) / 100 * 0.5
      ? {
          tone: "warn" as const,
          text: t(
            `Tus deudas cuestan ${fmt(Math.round(debtCost))} al año y se comen buena parte de tu rentabilidad. Amortizar puede rendir más que invertir.`,
            `Your debts cost ${fmt(Math.round(debtCost))} a year and eat much of your return. Paying them down may beat investing.`,
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

  // Real market series: S&P 500 vs a blend that mirrors your allocation (equities → SPY, crypto → BTC, cash → 0%).
  const series = seriesQuery.data?.series ?? {};
  const spx = series["^GSPC"] ?? [];
  const spy = series["SPY"] ?? [];
  const btc = series["BTC-USD"] ?? [];
  const equityValue = profile.assets_etf + profile.assets_retirement + profile.assets_stocks;
  const cryptoValue = profile.assets_crypto;
  const cashValue = profile.assets_cash + profile.assets_bank;
  const base = equityValue + cryptoValue + cashValue;
  const wEq = base ? equityValue / base : 1;
  const wCr = base ? cryptoValue / base : 0;
  const benchmarkData = spx.map((p, i) => ({
    label: p.label,
    sp500: p.value,
    portfolio: (spy[i]?.value ?? p.value) * wEq + (btc[i]?.value ?? 0) * wCr,
  }));



  const types = ["ETF", "Acción", "Renta fija", "Estructurado", "Retiro", "Cripto", "Inmueble", "Cash"] as const;
  const allocation = types
    .map((ty, i) => ({
      name: ty,
      value: enriched.filter((h) => h.type === ty).reduce((s, h) => s + h.value, 0),
      color: chartColors[i]!,
    }))
    .filter((a) => a.value > 0);
  const activeTypes = types.filter((ty) => enriched.some((h) => h.type === ty && h.value > 0));

  const rows = (list: typeof enriched) => (
    <div className="space-y-2">
      {list.map((h) => (
        <div key={h.ticker} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-elevated/60 p-3 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <p className="text-sm font-medium">{h.ticker}</p>
            <p className="truncate text-xs text-muted-foreground">{h.name}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
            <p className="numeric text-sm">{fmt(h.value)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Costo prom.", "Avg. cost")}</p>
            <p className="numeric text-sm">{fmt(h.avgCost)}</p>
            {h.improvements > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {t("incl. mejoras", "incl. improvements")} {fmt(h.improvements)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Ganancia", "Gain")}</p>
            <p className={cn("numeric text-sm", h.gain >= 0 ? "text-positive" : "text-negative")}>{fmt(h.gain)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
            <p className={cn("numeric text-sm font-semibold", h.ret >= 0 ? "text-positive" : "text-negative")}>
              {h.ret > 0 ? "+" : ""}
              {h.ret.toFixed(1)}%
            </p>
            {h.cagr !== null && (
              <p className="text-[10px] text-muted-foreground">
                {h.cagr > 0 ? "+" : ""}
                {h.cagr.toFixed(1)}% {t("anual", "annual")} · {h.years} {t("años", "yrs")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <PageShell>
      <PageHeader eyebrow={t("Inversiones", "Investments")} title={t("Portafolio", "Portfolio")} subtitle={t("Rendimiento consolidado de tus posiciones frente al mercado.", "Consolidated performance of your positions against the market.")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("Valor actual", "Current value")} value={fmt(totalValue)} accent index={0} />
        <KpiCard label={t("Costo invertido", "Invested cost")} value={fmt(totalCost)} index={1} />
        <KpiCard label={t("Ganancia total", "Total gain")} value={fmt(totalGain)} delta={totalCost > 0 ? (totalGain / totalCost) * 100 : 0} index={2} />
        <KpiCard label={t("Dividendos 12m", "Dividends 12m")} value={fmt(dividends)} index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={t("Portafolio vs S&P 500", "Portfolio vs S&P 500")}
          description={t("Datos reales de mercado · últimos 12 meses", "Real market data · last 12 months")}
          className="lg:col-span-2"
        >
          {benchmarkData.length === 0 ? (
            <div className="flex h-[290px] items-center justify-center text-sm text-muted-foreground">
              {seriesQuery.isLoading ? t("Cargando mercado…", "Loading market…") : t("Mercado no disponible", "Market unavailable")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={benchmarkData} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={46} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
                <Line type="monotone" dataKey="portfolio" name={t("Portafolio", "Portfolio")} stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="var(--color-chart-8)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>


        <Panel title={t("Composición", "Composition")}>
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
          <ul className="mt-3 space-y-1.5">
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
        title={t("Análisis de tu portafolio", "Your portfolio analysis")}
        description={t("Calculado con tus posiciones, rentabilidades e intereses de deuda reales.", "Computed from your real positions, expected returns and debt interest.")}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t("Retorno esperado ponderado", "Weighted expected return"), value: `${weightedReturn.toFixed(1)}%` },
            { label: t("Ingreso pasivo / mes", "Passive income / mo"), value: fmt(Math.round(passiveMonthly)) },
            { label: t("Costo anual de deuda", "Annual debt cost"), value: debtTotal > 0 ? fmt(Math.round(debtCost)) : fmt(0) },
            { label: t("Rendimiento neto anual", "Net annual return"), value: fmt(Math.round(netAnnual)) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-elevated/60 p-3">
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <p className="numeric mt-1 text-lg font-semibold">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-elevated/60 px-2.5 py-1 text-muted-foreground">
              {t("Volátil", "Volatile")}: <span className="numeric font-medium text-foreground">{(riskWeight * 100).toFixed(0)}%</span>
            </span>
            <span className="rounded-full bg-elevated/60 px-2.5 py-1 text-muted-foreground">
              {t("Defensivo", "Defensive")}: <span className="numeric font-medium text-foreground">{(safeWeight * 100).toFixed(0)}%</span>
            </span>
            <span className="rounded-full bg-elevated/60 px-2.5 py-1 text-muted-foreground">
              {t("Mayor posición", "Largest position")}: <span className="numeric font-medium text-foreground">{concentration.toFixed(0)}%</span>
            </span>
          </div>
          {insights.map((i) => (
            <p
              key={i.text}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs leading-relaxed",
                i.tone === "warn"
                  ? "border-amber-500/20 bg-amber-500/5 text-amber-200/90"
                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-200/90",
              )}
            >
              {i.text}
            </p>
          ))}
        </div>
      </Panel>

      <Panel
        title={t("Mercado en vivo", "Live market")}
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
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (watchlist.add(newSymbol)) setNewSymbol("");
          }}
        >
          <Input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder={t("Agregar ticker (VOO, TSLA, SOL-USD…)", "Add ticker (VOO, TSLA, SOL-USD…)")}
            className="h-9 max-w-xs"
          />
          <Button type="submit" size="sm" variant="secondary">
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
        {quotesQuery.data?.updatedAt && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("Actualizado", "Updated")} {new Date(quotesQuery.data.updatedAt).toLocaleTimeString()}
          </p>
        )}
      </Panel>



      <Panel
        title={t("Posiciones", "Positions")}
        actions={
          <Link
            to="/mi-perfil"
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
