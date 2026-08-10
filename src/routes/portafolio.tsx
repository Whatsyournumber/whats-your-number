import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useT } from "@/hooks/use-language";
import { useMarketSeries, useQuotes, useWatchlist } from "@/hooks/use-market";
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
];

function Portafolio() {
  const t = useT();
  const typeLabels: Record<(typeof types)[number], string> = {
    ETF: t("ETF", "ETF"),
    "Acción": t("Acción", "Stock"),
    Cripto: t("Cripto", "Crypto"),
    Cash: t("Cash", "Cash"),
  };
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const fmt = (n: number, _dec?: number) => d.fmt(n);
  const r = Math.max(0, profile.expected_return || 7) / 100;

  const watchlist = useWatchlist();
  const quotesQuery = useQuotes(watchlist.symbols);
  const seriesQuery = useMarketSeries(["^GSPC", "SPY", "BTC-USD"]);
  const [newSymbol, setNewSymbol] = useState("");

  const positions = [
    { ticker: t("ETFs / fondos", "ETFs / funds"), name: t("Fondos indexados y ETFs", "Index funds and ETFs"), type: "ETF" as const, value: profile.assets_etf, growth: r },
    { ticker: t("Fondo de retiro", "Retirement fund"), name: t("Plan de pensiones / retiro", "Pension / retirement plan"), type: "ETF" as const, value: profile.assets_retirement, growth: r * 0.8 },
    { ticker: t("Acciones", "Stocks"), name: t("Posiciones individuales", "Individual positions"), type: "Acción" as const, value: profile.assets_stocks, growth: r * 1.3 },
    { ticker: t("Cripto", "Crypto"), name: t("Activos digitales", "Digital assets"), type: "Cripto" as const, value: profile.assets_crypto, growth: r * 2 },
    { ticker: t("Efectivo", "Cash"), name: t("Efectivo y cuentas bancarias", "Cash and bank accounts"), type: "Cash" as const, value: profile.assets_cash + profile.assets_bank, growth: 0 },
  ].filter((h) => h.value > 0);

  const enriched = positions.map((h) => {
    const cost = Math.round(h.value / (1 + h.growth));
    return {
      ...h,
      avgCost: cost,
      dividends: Math.round(h.type === "ETF" ? h.value * 0.018 : h.type === "Acción" ? h.value * 0.012 : 0),
      cost,
      gain: h.value - cost,
      ret: cost ? ((h.value - cost) / cost) * 100 : 0,
    };
  });

  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalCost = enriched.reduce((s, h) => s + h.cost, 0);
  const totalGain = totalValue - totalCost;
  const dividends = enriched.reduce((s, h) => s + h.dividends, 0);

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



  const types = ["ETF", "Acción", "Cripto", "Cash"] as const;
  const allocation = types.map((ty, i) => ({
    name: ty,
    value: enriched.filter((h) => h.type === ty).reduce((s, h) => s + h.value, 0),
    color: chartColors[i]!,
  }));

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



      <Panel title={t("Posiciones", "Positions")}>
        <Tabs defaultValue="Todos">
          <TabsList className="mb-4">
            <TabsTrigger value="Todos">{t("Todos", "All")}</TabsTrigger>
            {types.map((ty) => (
              <TabsTrigger key={ty} value={ty}>
                {typeLabels[ty]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Todos">{rows(enriched)}</TabsContent>
          {types.map((ty) => (
            <TabsContent key={ty} value={ty}>
              {rows(enriched.filter((h) => h.type === ty))}
            </TabsContent>
          ))}
        </Tabs>
      </Panel>
    </PageShell>
  );
}
