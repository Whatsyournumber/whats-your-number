import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip, axisProps } from "@/components/chart-kit";
import { Panel } from "@/components/page";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage, useT } from "@/hooks/use-language";
import { getAssetStats } from "@/lib/market.functions";
import { cn } from "@/lib/utils";

export type SimRow = { id: string; symbol: string; label: string; initial: number; monthly: number };

const MODEL: Omit<SimRow, "id">[] = [
  { symbol: "VOO", label: "S&P 500", initial: 300000, monthly: 1000 },
  { symbol: "QQQ", label: "Nasdaq 100", initial: 150000, monthly: 500 },
  { symbol: "BND", label: "Bonos", initial: 200000, monthly: 500 },
  { symbol: "GLD", label: "Oro", initial: 100000, monthly: 300 },
  { symbol: "BTC-USD", label: "Cripto", initial: 100000, monthly: 300 },
];

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

const uid = () => Math.random().toString(36).slice(2, 9);

/** Valor futuro de un aporte inicial + aportes mensuales a una tasa anual r (decimal). */
function fv(initial: number, monthly: number, r: number, years: number) {
  const growth = Math.pow(1 + r, years);
  if (Math.abs(r) < 1e-6) return initial + monthly * 12 * years;
  return initial * growth + monthly * 12 * ((growth - 1) / r);
}

export function PortfolioSimulator({
  fmt,
  realTotal = 0,
  realReturn = 0,
  seedRows,
}: {
  fmt: (n: number) => string;
  realTotal?: number;
  realReturn?: number;
  seedRows?: Omit<SimRow, "id">[];
}) {
  const t = useT();
  const { lang } = useLanguage();
  const isMobile = useIsMobile();

  const [rows, setRows] = useState<SimRow[]>(() => {
    const seed = (seedRows?.length ? seedRows : MODEL).slice(0, 5);
    const filled = [...seed];
    for (const m of MODEL) {
      if (filled.length >= 5) break;
      if (!filled.some((r) => r.symbol.toUpperCase() === m.symbol)) filled.push(m);
    }
    return filled.slice(0, 5).map((r) => ({ ...r, id: uid() }));
  });
  const [years, setYears] = useState(20);
  const [includeReal, setIncludeReal] = useState(realTotal > 0);

  const symbols = rows.map((r) => r.symbol.trim().toUpperCase()).filter(Boolean);
  const statsQuery = useQuery({
    queryKey: ["asset-stats", symbols.join(",")],
    queryFn: () => getAssetStats({ data: { symbols } }),
    enabled: symbols.length > 0,
    staleTime: 30 * 60_000,
  });
  const stats = statsQuery.data?.stats ?? {};

  const enriched = rows.map((r, i) => {
    const s = stats[r.symbol.trim().toUpperCase()] ?? null;
    return {
      ...r,
      color: COLORS[i % COLORS.length]!,
      cagr: s?.cagr ?? 7,
      vol: s?.vol ?? 12,
      live: Boolean(s),
    };
  });

  const totalInitial = enriched.reduce((s, r) => s + r.initial, 0) + (includeReal ? realTotal : 0);
  const totalMonthly = enriched.reduce((s, r) => s + r.monthly, 0);

  const weighted = (key: "cagr" | "vol") =>
    totalInitial > 0
      ? (enriched.reduce((s, r) => s + r[key] * r.initial, 0) +
          (includeReal ? (key === "cagr" ? realReturn : 12) * realTotal : 0)) /
        totalInitial
      : 0;

  const expected = weighted("cagr");
  const volatility = weighted("vol");

  const data = useMemo(() => {
    const startYear = new Date().getFullYear();
    const out: { label: string; base: number; opt: number; pes: number }[] = [];
    for (let y = 0; y <= years; y += 1) {
      let base = 0;
      let opt = 0;
      let pes = 0;
      for (const r of enriched) {
        const rr = r.cagr / 100;
        const sd = r.vol / 100;
        base += fv(r.initial, r.monthly, rr, y);
        opt += fv(r.initial, r.monthly, rr + sd * 0.5, y);
        pes += fv(r.initial, r.monthly, Math.max(-0.15, rr - sd * 0.5), y);
      }
      if (includeReal && realTotal > 0) {
        const rr = realReturn / 100;
        base += fv(realTotal, 0, rr, y);
        opt += fv(realTotal, 0, rr + 0.06, y);
        pes += fv(realTotal, 0, Math.max(-0.1, rr - 0.06), y);
      }
      out.push({ label: String(startYear + y), base: Math.round(base), opt: Math.round(opt), pes: Math.round(pes) });
    }
    return out;
  }, [enriched, years, includeReal, realTotal, realReturn]);

  const last = data[data.length - 1]!;
  const contributed = totalMonthly * 12 * years;
  const gain = last.base - totalInitial - contributed;
  const growthPct = totalInitial > 0 ? ((last.base - totalInitial) / totalInitial) * 100 : 0;

  const compact = (n: number) =>
    new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  const patch = (id: string, p: Partial<SimRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const metrics = [
    { label: t("Rendimiento esperado (CAGR)", "Expected return (CAGR)"), value: `${expected.toFixed(1)}%` },
    { label: t("Volatilidad estimada", "Estimated volatility"), value: `${volatility.toFixed(1)}%` },
    { label: t("Aporte total", "Total contributions"), value: fmt(contributed) },
    { label: t("Ganancia estimada", "Estimated gain"), value: fmt(Math.max(0, gain)) },
  ];

  return (
    <Panel
      title={t("Simulador de rentabilidad", "Return simulator")}
      description={t("Ajusta los montos y mira el impacto en tu futuro", "Adjust the amounts and see the impact on your future")}
      bleedMobile
    >
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Gráfica */}
        <div className="px-3 sm:px-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {t("Proyección base", "Base projection")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-full bg-primary/25" />
                {t("Optimista / pesimista", "Optimistic / pessimistic")}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border/60 p-0.5">
              {[1, 5, 10, 20].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                    years === y ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {y}A
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 rounded-2xl border border-border/50 bg-elevated/50 p-3">
            <p className="text-[11px] text-muted-foreground">
              {t(`Valor estimado en ${years} años`, `Estimated value in ${years} years`)}
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="numeric text-2xl font-bold text-primary">{fmt(last.base)}</p>
              <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-semibold text-positive">
                +{growthPct.toFixed(0)}% {t("vs. hoy", "vs. today")}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("Rango", "Range")}: {fmt(last.pes)} — {fmt(last.opt)}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <ComposedChart data={data} margin={{ left: isMobile ? 0 : -14, right: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="simBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} tick={{ ...axisProps, fontSize: isMobile ? 9 : 11 }} minTickGap={18} />
              <YAxis {...axisProps} tickFormatter={compact} width={isMobile ? 40 : 52} />
              <Tooltip content={<ChartTooltip formatter={(v) => fmt(v)} />} />
              <Area
                type="monotone"
                dataKey="opt"
                name={t("Optimista", "Optimistic")}
                stroke="none"
                fill="url(#simBand)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="pes"
                name={t("Pesimista", "Pessimistic")}
                stroke="none"
                fill="var(--color-card)"
                fillOpacity={1}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="base"
                name={t("Proyección", "Projection")}
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/40 pt-3 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="truncate text-[10px] font-medium text-muted-foreground">{m.label}</p>
                <p className="numeric mt-0.5 text-base font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Campos */}
        <div className="rounded-2xl border border-border/50 bg-elevated/40 p-3 sm:p-4">
          <div className="grid grid-cols-[1fr_84px_78px_auto] items-center gap-2 pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>{t("Activo", "Asset")}</span>
            <span>{t("Inicial", "Initial")}</span>
            <span>{t("Mensual", "Monthly")}</span>
            <span />
          </div>
          <div className="space-y-2">
            {enriched.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_84px_78px_auto] items-center gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <div className="min-w-0">
                    <Input
                      value={r.symbol}
                      onChange={(e) => patch(r.id, { symbol: e.target.value.toUpperCase() })}
                      className="h-7 border-none bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0"
                    />
                    <p className="truncate text-[10px] text-muted-foreground">
                      {r.live ? `${r.cagr.toFixed(1)}% · vol ${r.vol.toFixed(0)}%` : t("sin datos", "no data")}
                    </p>
                  </div>
                </div>
                <Input
                  inputMode="numeric"
                  value={r.initial ? String(r.initial) : ""}
                  onChange={(e) => patch(r.id, { initial: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                  className="numeric h-8 text-xs"
                />
                <Input
                  inputMode="numeric"
                  value={r.monthly ? String(r.monthly) : ""}
                  onChange={(e) => patch(r.id, { monthly: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                  className="numeric h-8 text-xs"
                />
                <button
                  type="button"
                  aria-label={t("Quitar activo", "Remove asset")}
                  onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                  className="rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {rows.length < 6 && (
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, { id: uid(), symbol: "", label: "", initial: 10000, monthly: 100 }])}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("Agregar activo", "Add asset")}
            </button>
          )}

          {realTotal > 0 && (
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl bg-card/60 p-3 text-xs">
              <input
                type="checkbox"
                checked={includeReal}
                onChange={(e) => setIncludeReal(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-chart-1)]"
              />
              <span className="text-muted-foreground">
                {t("Incluir mi portafolio actual", "Include my current portfolio")}{" "}
                <span className="numeric font-semibold text-foreground">{fmt(realTotal)}</span>
              </span>
            </label>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            {t(
              "Rendimiento y volatilidad calculados con el histórico real de cada activo. Proyección informativa, no es asesoría financiera.",
              "Return and volatility computed from each asset's real history. Informational projection, not financial advice.",
            )}
          </p>
        </div>
      </div>
    </Panel>
  );
}
