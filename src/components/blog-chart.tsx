import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { axisProps, ChartTooltip } from "@/components/chart-kit";
import type { BlogChart } from "@/lib/blog-posts";
import { useLanguage } from "@/hooks/use-language";

const PALETTE = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

export function BlogChartBlock({ chart }: { chart: BlogChart }) {
  const { lang } = useLanguage();
  const data = chart.data.map((d) => ({ ...d, label: d.label[lang] }));
  const fmt = (v: number) =>
    chart.unit === "years"
      ? `${v} ${lang === "es" ? "años" : "yrs"}`
      : chart.unit === "percent"
        ? `${v}%`
        : `${new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 0 }).format(v)} €`;

  return (
    <figure className="surface overflow-hidden">
      <figcaption className="border-b border-border/50 px-5 py-4">
        <span className="font-display text-sm font-semibold">{chart.title[lang]}</span>
        {chart.note && <p className="mt-1 text-xs text-muted-foreground">{chart.note[lang]}</p>}
      </figcaption>
      <div className="h-[300px] w-full px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          {chart.kind === "area" ? (
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                {chart.series.map((s, i) => (
                  <linearGradient key={s.key} id={`bg-${chart.id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.04} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} width={62} tickFormatter={(v) => fmt(Number(v))} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {chart.series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label[lang]}
                  stackId={chart.stacked ? "a" : undefined}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={`url(#bg-${chart.id}-${s.key})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} width={62} tickFormatter={(v) => fmt(Number(v))} />
              <Tooltip cursor={{ fill: "var(--color-muted)", opacity: 0.25 }} content={<ChartTooltip formatter={fmt} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {chart.series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label[lang]}
                  fill={PALETTE[i % PALETTE.length]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={54}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
