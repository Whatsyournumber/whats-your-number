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
    ],
  }),
  component: Patrimonio,
});

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

  // Deudas individuales desde holdings (TDC, préstamos, etc.).
  const debtRows = holdings
    .filter((h) => h.kind === "debt" && holdingValue(h) > 0)
    .map((h) => ({ id: h.id, label: h.label || t("Deuda", "Debt"), value: holdingValue(h), interest: h.expected_return }));
  const liabilityRows = [...debtRows].sort((a, b) => b.value - a.value);

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
      return {
        id: h.id,
        group: groupOf(h.kind),
        kind: h.kind,
        label: h.label || kindLabel(h.kind),
        sub: kindLabel(h.kind),
        ticker: h.ticker,
        quantity: h.quantity,
        value: weighted,
        rate: h.expected_return,
        monthlyContribution: h.monthly_contribution,
        monthlyIncome: h.monthly_income,
        mortgage: h.kind === "property" ? h.linked_liability : 0,
        targetYear: h.kind === "future" ? h.target_year : null,
        probability: h.kind === "future" ? h.probability : null,
      };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

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
  const visibleAnnual = Math.round(visibleRows.reduce((s, r) => s + (r.value * (r.rate || 0)) / 100, 0));

  // Activos futuros (trading, venta de empresa…) ponderados: suman al patrimonio y al allocation.
  const futureTotal = detailRows.filter((r) => r.group.key === "future").reduce((s, r) => s + r.value, 0);
  const assetRows = futureTotal > 0
    ? [...assets, { key: "assets_future", name: t("Activos futuros", "Future assets"), value: futureTotal, color: "var(--color-chart-3)" }]
    : assets;
  const totalAssetsAll = d.totalAssets + futureTotal;
  const netWorthAll = d.netWorth + futureTotal;

  return (
    <PageShell>
      <PageHeader eyebrow={t("Balance", "Balance")} title={t("Patrimonio", "Net worth")} subtitle={t("Todo lo que tienes y lo que debes, en una sola vista.", "Everything you own and owe, in one view.")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("Patrimonio neto", "Net worth")} value={fmt(netWorthAll)} delta={growth} hint={t("últimos 12 meses", "last 12 months")} accent index={0} />
        <KpiCard label={t("Activos", "Assets")} value={fmt(totalAssetsAll)} index={1} />
        <KpiCard label={t("Pasivos", "Liabilities")} value={fmt(d.totalLiabilities)} inverse index={2} />
      </div>


      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("Crecimiento del patrimonio", "Net worth growth")} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={months} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} width={56} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="netWorth" name={t("Patrimonio", "Net worth")} stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#pw)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={t("Asset allocation", "Asset allocation")}>
          {assetRows.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("Aún no registras activos.", "You haven't recorded any assets yet.")}</p>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/mi-perfil">{t("Añadir mis activos", "Add my assets")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={assetRows} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                    {assetRows.map((a) => (
                      <Cell key={a.name} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
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
            {assetRows.map((a) => (
              <div key={a.name} className="flex items-center gap-2 rounded-xl bg-elevated/60 p-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                <p className="text-sm font-medium">{a.name}</p>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(a.value)}</span>
              </div>
            ))}
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
                const annual = Math.round((r.value * (r.rate || 0)) / 100);
                const meta = [
                  r.sub,
                  r.ticker && r.quantity > 0 ? `${r.quantity} u.` : null,
                  r.monthlyContribution > 0 ? t(`+${fmt(r.monthlyContribution)}/mes`, `+${fmt(r.monthlyContribution)}/mo`) : null,
                  r.monthlyIncome > 0 ? t(`renta ${fmt(r.monthlyIncome)}/mes`, `income ${fmt(r.monthlyIncome)}/mo`) : null,
                  r.mortgage > 0 ? t(`hipoteca ${fmt(r.mortgage)}`, `mortgage ${fmt(r.mortgage)}`) : null,
                  r.targetYear ? String(r.targetYear) : null,
                  r.probability != null && r.probability < 100 ? `${r.probability}%` : null,
                ].filter(Boolean);
                return (
                  <div key={r.id} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-elevated/60 p-3 md:grid-cols-6">
                    <div className="col-span-2 md:col-span-2 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.label}
                        {r.ticker ? <span className="ml-2 text-xs text-muted-foreground">{r.ticker}</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{meta.join(" · ")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
                      <p className="numeric text-sm">{fmt(r.value)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t("Ganancia anual", "Annual gain")}</p>
                      <p className="numeric text-sm text-positive">{fmt(annual)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t("Ganancia mensual", "Monthly gain")}</p>
                      <p className="numeric text-sm text-positive">{fmt(Math.round(annual / 12))}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
                      <p className="numeric text-sm font-semibold text-positive">
                        {(r.rate || 0) > 0 ? "+" : ""}
                        {(r.rate || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 items-center gap-3 rounded-xl border border-border/60 bg-elevated/40 px-3 py-2.5 md:grid-cols-6">
              <div className="col-span-2 md:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground">{t("Total", "Total")}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Valor", "Value")}</p>
                <p className="numeric text-sm font-semibold">{fmt(visibleTotal)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Ganancia anual", "Annual gain")}</p>
                <p className="numeric text-sm font-semibold text-positive">{fmt(visibleAnnual)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Ganancia mensual", "Monthly gain")}</p>
                <p className="numeric text-sm font-semibold text-positive">{fmt(Math.round(visibleAnnual / 12))}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{t("Rentabilidad", "Return")}</p>
                <p className="numeric text-sm font-semibold text-positive">
                  {visibleTotal > 0 ? `+${((visibleAnnual / visibleTotal) * 100).toFixed(1)}` : "0.0"}%
                </p>
              </div>
            </div>
          </div>
        )}


        <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-full">
          <Link to="/mi-perfil" hash="patrimonio">{t("Editar mi patrimonio", "Edit my net worth")}</Link>
        </Button>
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
