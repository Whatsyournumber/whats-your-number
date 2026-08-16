import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { money } from "@/lib/mfn";

export function Card({
  children,
  className,
  title,
  action,
  hint,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("card-soft animate-rise p-5 sm:p-6", className)}>
      {title || action ? (
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
            ) : null}
            {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Tile({
  emoji,
  label,
  value,
  currency = "EUR",
  hint,
  className,
}: {
  emoji: string;
  label: string;
  value: number;
  currency?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("card-soft tap animate-rise p-4 hover:tap-active", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-base leading-none">{emoji}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {money(value, currency)}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Buddy({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <div
      className={cn(
        "card-soft animate-rise flex items-start gap-3 p-4",
        compact ? "" : "sm:p-5",
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-lg">
        🤖
      </span>
      <div className="min-w-0 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Buddy</p>
        <p className="mt-1 leading-relaxed text-foreground">{children}</p>
      </div>
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(2, value))}%` }}
      />
    </div>
  );
}

export function Coins({ className }: { className?: string }) {
  return (
    <span className={cn("pointer-events-none relative inline-flex", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-coin absolute text-sm"
          style={{ left: i * 12, animationDelay: `${i * 0.35}s` }}
        >
          🪙
        </span>
      ))}
    </span>
  );
}

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function tooltipStyle() {
  return {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: 14,
    fontSize: 12,
    color: "var(--color-popover-foreground)",
    boxShadow: "0 18px 40px -24px oklch(0 0 0 / 35%)",
  };
}

export function GrowthChart({
  data,
  currency = "EUR",
  height = 300,
  xKey = "label",
  areas = [{ key: "total", color: "var(--color-chart-1)" }],
  lines = [],
  yMax,
  seriesNames,
  tooltipLabel,
}: {
  data: Record<string, number | string>[];
  currency?: string;
  height?: number;
  xKey?: string;
  areas?: { key: string; color: string }[];
  lines?: { key: string; color: string }[];
  yMax?: number | undefined;
  seriesNames?: Record<string, string>;
  tooltipLabel?: (label: string | number) => string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
          <defs>
            {areas.map((a) => (
              <linearGradient key={a.key} id={`g-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={a.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={a.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} width={72} domain={[0, yMax ?? "dataMax"]} tickFormatter={(v) => money(Number(v), currency, true)} />
          <Tooltip
            trigger="hover"
            isAnimationActive={false}
            wrapperStyle={{ outline: "none", pointerEvents: "none" }}
            cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.25, strokeWidth: 2 }}

            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-2xl border border-border/60 bg-surface-2 px-4 py-3 shadow-xl">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {tooltipLabel ? tooltipLabel(label as string | number) : String(label)}
                  </div>
                  <div className="space-y-1.5">
                    {payload.map((p) => (
                      <div key={String(p.dataKey)} className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: String(p.color) }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {seriesNames?.[String(p.dataKey)] ?? String(p.name)}
                        </span>
                        <span className="ml-auto text-sm font-bold text-foreground">
                          {money(Number(p.value), currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />

          {areas.map((a) => (
            <Area
              key={a.key}
              type="monotone"
              dataKey={a.key}
              stroke={a.color}
              strokeWidth={2.5}
              fill={`url(#g-${a.key})`}
            />
          ))}
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              strokeDasharray="6 6"
              fillOpacity={0}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({
  data,
  currency = "EUR",
  height = 220,
}: {
  data: { name: string; value: number; color?: string }[];
  currency?: string;
  height?: number;
}) {
  const palette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
  ];
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={3}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? palette[i % palette.length]} stroke="var(--color-card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(v: number | string) => money(Number(v), currency)}
          />

        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Tree({ level = 1 }: { level?: number }) {
  const size = 44 + Math.min(3, level) * 10;
  return (
    <span className="animate-tree inline-block" style={{ fontSize: size }} aria-hidden>
      🌳
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "soft";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    primary: "glow-primary bg-primary text-primary-foreground hover:-translate-y-0.5",
    soft: "bg-secondary text-secondary-foreground hover:bg-muted",
    ghost: "border border-border bg-card text-foreground hover:bg-muted",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";
