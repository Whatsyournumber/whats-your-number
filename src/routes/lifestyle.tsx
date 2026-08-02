import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, PageShell, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { fmt, fmtCompact, lifestyle, topMerchants } from "@/lib/data";

export const Route = createFileRoute("/lifestyle")({
  head: () => ({
    meta: [
      { title: "Lifestyle — Finance OS" },
      { name: "description", content: "Cuánto cuesta tu estilo de vida: viajes, restaurantes, compras, entretenimiento y suscripciones." },
      { property: "og:title", content: "Lifestyle — Finance OS" },
      { property: "og:description", content: "Costo por viaje, por ciudad y por restaurante con top comercios." },
    ],
  }),
  component: Lifestyle,
});

function Lifestyle() {
  const total = lifestyle.breakdown.reduce((s, b) => s + b.amount, 0);
  const subsTotal = lifestyle.subscriptions.reduce((s, x) => s + x.amount, 0);

  return (
    <PageShell>
      <PageHeader eyebrow="Estilo de vida" title="Lifestyle" subtitle="El costo real de disfrutar: viajes, mesa, compras y ocio." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gasto lifestyle" value={fmt(total)} delta={-8.2} inverse accent index={0} />
        <KpiCard label="Viajes del año" value={fmt(lifestyle.trips.reduce((s, t) => s + t.total, 0))} hint={`${lifestyle.trips.length} viajes`} index={1} />
        <KpiCard label="Suscripciones" value={`${fmt(subsTotal)}/mes`} delta={11.4} inverse index={2} />
        <KpiCard label="Restaurantes" value={fmt(lifestyle.restaurants.reduce((s, r) => s + r.total, 0))} delta={37.2} inverse index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Composición del lifestyle" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={lifestyle.breakdown} layout="vertical" margin={{ left: 20, right: 16 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={(v) => fmtCompact(Number(v))} />
              <YAxis type="category" dataKey="name" {...axisProps} width={110} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
              <Bar dataKey="amount" name="Gasto" fill="var(--color-chart-7)" radius={[0, 8, 8, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Suscripciones activas" description={`${fmt(subsTotal * 12)} al año`}>
          <ul className="space-y-2">
            {lifestyle.subscriptions.map((s) => (
              <li key={s.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">desde {s.since}</p>
                </div>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(s.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Costo por viaje" description="Etiquetas de proyecto">
          <div className="space-y-3">
            {lifestyle.trips.map((t) => (
              <div key={t.name} className="rounded-2xl bg-elevated/60 p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    {t.tag}
                  </Badge>
                  <span className="numeric ml-auto text-sm font-semibold">{fmt(t.total)}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{t.nights} noches</span>
                  <span className="numeric">{fmt(t.total / t.nights)} / noche</span>
                  <span>{t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Restaurantes favoritos">
          <div className="space-y-2">
            {lifestyle.restaurants.map((r) => (
              <div key={r.name} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.visits} visitas · <span className="numeric">{fmt(r.total / r.visits)}</span> promedio
                  </p>
                </div>
                <span className="numeric ml-auto text-sm font-semibold">{fmt(r.total)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Top comercios lifestyle">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {topMerchants.slice(0, 8).map((m) => (
            <div key={m.name} className="rounded-xl bg-elevated/60 p-3">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="numeric mt-1 text-lg font-semibold">{fmt(m.amount)}</p>
              <p className="text-xs text-muted-foreground">{m.transactions} transacciones</p>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
