import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

import { PlanGate } from "@/components/plan-gate";
import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions } from "@/hooks/use-transactions";
import { holdingValue, useHoldings } from "@/hooks/use-holdings";
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

  // Deudas individuales desde holdings (TDC, préstamos, etc.) + hipotecas de propiedades.
  const debtRows = holdings
    .filter((h) => h.kind === "debt" && holdingValue(h) > 0)
    .map((h) => ({ id: h.id, label: h.label || t("Deuda", "Debt"), value: holdingValue(h), interest: h.expected_return }));
  const mortgageRows = holdings
    .filter((h) => h.kind === "property" && h.linked_liability > 0)
    .map((h) => ({ id: h.id, label: t(`Hipoteca · ${h.label || "Propiedad"}`, `Mortgage · ${h.label || "Property"}`), value: h.linked_liability, interest: h.expected_return }));
  const liabilityRows = [...debtRows, ...mortgageRows].sort((a, b) => b.value - a.value);

  return (
    <PageShell>
      <PageHeader eyebrow={t("Balance", "Balance")} title={t("Patrimonio", "Net worth")} subtitle={t("Todo lo que tienes y lo que debes, en una sola vista.", "Everything you own and owe, in one view.")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("Patrimonio neto", "Net worth")} value={fmt(d.netWorth)} delta={growth} hint={t("últimos 12 meses", "last 12 months")} accent index={0} />
        <KpiCard label={t("Activos", "Assets")} value={fmt(d.totalAssets)} index={1} />
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
          {assets.length === 0 ? (
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
                  <Pie data={assets} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                    {assets.map((a) => (
                      <Cell key={a.name} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
                {assets.map((a) => (
                  <li key={a.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                    <span className="truncate text-muted-foreground">{a.name}</span>
                    <span className="numeric ml-auto font-medium">{((a.value / d.totalAssets) * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("Activos", "Assets")} description={fmt(d.totalAssets)}>
          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.name} className="flex items-center gap-2 rounded-xl bg-elevated/60 p-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                <p className="text-sm font-medium">{a.name}</p>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(a.value)}</span>
              </div>
            ))}
            {assets.length === 0 && <p className="text-sm text-muted-foreground">{t("Sin activos registrados.", "No assets recorded.")}</p>}
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
              {d.totalAssets > 0 ? ((d.totalLiabilities / d.totalAssets) * 100).toFixed(1) : "0.0"}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("Bajo el 40% se considera saludable", "Below 40% is considered healthy")}</p>
          </div>
        </Panel>
      </div>
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
