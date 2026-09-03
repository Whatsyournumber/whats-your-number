import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Pencil } from "lucide-react";

import { cn } from "@/lib/utils";


import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions } from "@/hooks/use-transactions";
import { holdingValue, useHoldings } from "@/hooks/use-holdings";
import { useQuotes } from "@/hooks/use-market";
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

function PatrimonioContent() {
  const t = useT();
  const { profile } = useProfile();
  const { transactions } = useTransactions();
  const { holdings } = useHoldings();
  const d = buildDataset(profile);
  const { fmt, fmtCompact, assets } = d;
  const months = buildRealMonths(transactions, d.netWorth) ?? d.months;
  const growth =
    months[0]!.netWorth > 0 ? ((d.netWorth - months[0]!.netWorth) / Math.abs(months[0]!.netWorth)) * 100 : 0;

  // Precios reales para posiciones con ticker.
  const holdingSymbols = holdings.filter((h) => h.ticker && h.quantity > 0).map((h) => h.ticker!);
  const holdingQuotes = useQuotes(holdingSymbols);
  const prices = Object.fromEntries((holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.price]));
  const dayChange: Record<string, number> = Object.fromEntries(
    (holdingQuotes.data?.quotes ?? []).map((q) => [q.symbol.toUpperCase(), q.changePct ?? 0]),
  );

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
      const rate = marketGain !== null ? (marketGain / marketCost) * 100 : weighted > 0 ? (annual / weighted) * 100 : 0;


      return {
        id: h.id,
        group: groupOf(h.kind),
        kind: h.kind,
        label: h.label || kindLabel(h.kind),
        sub: kindLabel(h.kind),
        ticker: h.ticker,
        cost,
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
  const liveAssets = hasDetail
    ? assets.map((a) => (LIVE_KINDS[a.key] ? { ...a, value: sumKinds(LIVE_KINDS[a.key]!) } : a)).filter((a) => a.value > 0)
    : assets;

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

  return (
    <PageShell>
      <PageHeader eyebrow={t("Balance", "Balance")} title={t("Patrimonio", "Net worth")} subtitle={t("Todo lo que tienes y lo que debes, en una sola vista.", "Everything you own and owe, in one view.")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("Patrimonio neto", "Net worth")} value={fmt(netWorthAll)} delta={growth} hint={t("últimos 12 meses", "last 12 months")} accent index={0} />
        <KpiCard label={t("Activos", "Assets")} value={fmt(totalAssetsAll)} index={1} />
        <KpiCard label={t("Pasivos", "Liabilities")} value={fmt(d.totalLiabilities)} inverse index={2} />
      </div>


      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("Crecimiento del patrimonio", "Net worth growth")} className="flex flex-col p-3 md:p-5 lg:col-span-2">
          <div className="min-h-[340px] flex-1 md:min-h-[420px] lg:min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ left: -20, right: 0, top: 8 }}>
                <defs>
                  <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={48} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="netWorth" name={t("Patrimonio", "Net worth")} stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#pw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("Asset allocation", "Asset allocation")} className="flex flex-col">
          {assetRows.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("Aún no registras activos.", "You haven't recorded any assets yet.")}</p>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/mi-perfil">{t("Añadir mis activos", "Add my assets")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="min-h-[230px] flex-1 lg:min-h-0">
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
              <ul className="mt-2 shrink-0 space-y-1.5">
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
                const isEtf = r.kind === "etf" || r.kind === "crypto";
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
                          <p className="text-[11px] text-muted-foreground">{t("Valor compra", "Purchase value")}</p>
                          <p className="numeric text-sm text-muted-foreground">{r.cost > 0 ? fmt(r.cost) : "—"}</p>
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
