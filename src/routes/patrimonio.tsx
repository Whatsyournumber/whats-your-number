import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { buildDataset } from "@/lib/profile-data";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimonio — Your north" },
      { name: "description", content: "Activos, pasivos, asset allocation y crecimiento de tu patrimonio neto." },
      { property: "og:title", content: "Patrimonio — Your north" },
      { property: "og:description", content: "Efectivo, bancos, fondos, ETFs, cripto, propiedades y deudas consolidados." },
    ],
  }),
  component: Patrimonio,
});

function Patrimonio() {
  const { profile } = useProfile();
  const d = buildDataset(profile);
  const { fmt, fmtCompact, months, assets, liabilities } = d;
  const growth =
    months[0]!.netWorth > 0 ? ((d.netWorth - months[0]!.netWorth) / Math.abs(months[0]!.netWorth)) * 100 : 0;

  return (
    <PageShell>
      <PageHeader eyebrow="Balance" title="Patrimonio" subtitle="Todo lo que tienes y lo que debes, en una sola vista." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Patrimonio neto" value={fmt(d.netWorth)} delta={growth} hint="últimos 12 meses" accent index={0} />
        <KpiCard label="Activos" value={fmt(d.totalAssets)} index={1} />
        <KpiCard label="Pasivos" value={fmt(d.totalLiabilities)} inverse index={2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Crecimiento del patrimonio" className="lg:col-span-2">
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
              <Area type="monotone" dataKey="netWorth" name="Patrimonio" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#pw)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Asset allocation">
          {assets.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">Aún no registras activos.</p>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/mi-perfil">Añadir mis activos</Link>
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
        <Panel title="Activos" description={fmt(d.totalAssets)}>
          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.name} className="flex items-center gap-2 rounded-xl bg-elevated/60 p-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                <p className="text-sm font-medium">{a.name}</p>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(a.value)}</span>
              </div>
            ))}
            {assets.length === 0 && <p className="text-sm text-muted-foreground">Sin activos registrados.</p>}
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-full">
            <Link to="/mi-perfil">Editar activos</Link>
          </Button>
        </Panel>

        <Panel title="Pasivos" description={fmt(d.totalLiabilities)}>
          <div className="space-y-2">
            {liabilities.map((l) => (
              <div key={l.name} className="flex items-center gap-2 rounded-xl bg-elevated/60 p-3">
                <span className="h-2.5 w-2.5 rounded-full bg-negative" />
                <p className="text-sm font-medium">{l.name}</p>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(l.value)}</span>
              </div>
            ))}
            {liabilities.length === 0 && <p className="text-sm text-muted-foreground">No registras deudas. 🎉</p>}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border p-4">
            <p className="text-xs text-muted-foreground">Ratio deuda / activos</p>
            <p className="numeric mt-1 text-2xl font-semibold">
              {d.totalAssets > 0 ? ((d.totalLiabilities / d.totalAssets) * 100).toFixed(1) : "0.0"}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Bajo el 40% se considera saludable</p>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
