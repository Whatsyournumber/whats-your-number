import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, Copy, MousePointerClick, TrendingUp, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import type { CommissionRow, ReferralRow } from "@/hooks/use-affiliate";

const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} US$`;

const PLAN_COLORS = ["var(--chart-1)", "var(--chart-4)", "var(--chart-2)", "var(--chart-3)"];

const planLabel = (id: string | null) =>
  (id ?? "free").replace("_plan", "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AffiliateDashboard({
  link,
  code,
  clicks,
  referrals,
  commissions,
  pending,
  paid,
}: {
  link: string;
  code: string;
  clicks: number;
  referrals: ReferralRow[];
  commissions: CommissionRow[];
  pending: number;
  paid: number;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const shortLink = link.replace(/^https?:\/\//, "").replace(/\/\?ref=/, "/?ref=");

  const series = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: monthKey(d),
        label: d.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""),
      });
    }
    return months.map((m) => ({
      label: m.label,
      registros: referrals.filter((r) => monthKey(new Date(r.created_at)) === m.key).length,
      comision: commissions
        .filter((c) => monthKey(new Date(c.created_at)) === m.key)
        .reduce((a, c) => a + Number(c.commission_amount), 0),
    }));
  }, [referrals, commissions]);

  const byPlan = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of referrals) {
      const k = planLabel(r.product_id);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [referrals]);

  const totalPlans = byPlan.reduce((a, p) => a + p.value, 0);
  const converted = referrals.filter((r) => r.status === "subscribed").length;
  const conversion = clicks > 0 ? Math.round((referrals.length / clicks) * 100) : 0;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("Enlace copiado", "Link copied"));
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Enlace destacado */}
      <section className="surface glow relative overflow-hidden p-5">
        <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.10]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("Tu enlace de afiliado", "Your affiliate link")}
            </p>
            <p className="mt-2 truncate font-mono text-sm text-foreground md:text-base">{shortLink}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Código", "Code")}: <span className="font-mono text-primary">{code}</span>
            </p>
          </div>
          <Button onClick={() => void copy()} className="shrink-0 rounded-full">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {t("Copiar enlace", "Copy link")}
          </Button>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("Clics", "Clicks")}
          value={String(clicks)}
          hint={t("Visitas con tu enlace", "Visits from your link")}
          icon={MousePointerClick}
          accent
          index={0}
        />
        <KpiCard
          label={t("Conversiones", "Conversions")}
          value={String(referrals.length)}
          hint={`${conversion}% ${t("de tus clics", "of your clicks")}`}
          icon={Users}
          index={1}
        />
        <KpiCard
          label={t("Comisiones pendientes", "Pending commissions")}
          value={money(pending)}
          hint={`${converted} ${t("clientes de pago", "paying customers")}`}
          icon={Wallet}
          index={2}
        />
        <KpiCard
          label={t("Comisiones pagadas", "Paid commissions")}
          value={money(paid)}
          hint={t("Total acumulado", "All-time total")}
          icon={TrendingUp}
          index={3}
        />
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={t("Rendimiento", "Performance")}
          description={t("Registros y comisión de los últimos 6 meses.", "Sign-ups and commission over the last 6 months.")}
        >
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="affArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number, n: string) =>
                    n === "comision" ? [money(Number(v)), t("Comisión", "Commission")] : [String(v), t("Registros", "Sign-ups")]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="registros"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#affArea)"
                  dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="comision"
                  stroke="var(--chart-4)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("Referidos por plan", "Referrals by plan")}>
          {totalPlans === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
              {t("Aún sin referidos. Comparte tu enlace para empezar.", "No referrals yet. Share your link to start.")}
            </div>
          ) : (
            <div className="flex h-[240px] items-center gap-4">
              <div className="h-full w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byPlan} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="88%" paddingAngle={3} stroke="none">
                      {byPlan.map((_, i) => (
                        <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {byPlan.map((p, i) => (
                  <li key={p.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }}
                      />
                      {p.name}
                    </span>
                    <span className="numeric font-medium">{Math.round((p.value / totalPlans) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      {/* Referidos recientes */}
      <Panel
        title={t("Referidos recientes", "Recent referrals")}
        description={t("Últimos registros llegados con tu enlace.", "Latest sign-ups from your link.")}
      >
        {referrals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("Todavía sin referidos", "No referrals yet")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {referrals.slice(0, 6).map((r) => {
              const comm = commissions
                .filter((c) => c.user_id === r.user_id)
                .reduce((a, c) => a + Number(c.commission_amount), 0);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{planLabel(r.product_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={r.status === "subscribed" ? "default" : "secondary"}>
                      {r.status === "subscribed" ? t("Activo", "Active") : t("Registrado", "Signed up")}
                    </Badge>
                    <span className="numeric text-sm font-semibold">{money(comm)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
