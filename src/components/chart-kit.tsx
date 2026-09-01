import type { ReactNode } from "react";

import { fmt } from "@/lib/data";

export const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: ReactNode;
  formatter?: (v: number) => string;
  labelFormatter?: (label: any, payload: any) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const f = formatter ?? ((v: number) => fmt(v));
  const shownLabel = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div
      className="rounded-2xl border px-4 py-3 text-xs backdrop-blur-sm"
      style={{
        backgroundColor: "var(--chart-tooltip-bg)",
        borderColor: "var(--chart-tooltip-border)",
        color: "var(--chart-tooltip-fg)",
        boxShadow: "var(--chart-tooltip-shadow)",
      }}
    >
      {shownLabel !== undefined && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--chart-tooltip-muted)" }}>
          {shownLabel}
        </p>
      )}

      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="text-[13px]" style={{ color: "var(--chart-tooltip-muted)" }}>
              {p.name}
            </span>
            <span className="numeric ml-auto text-[13px] font-bold" style={{ color: "var(--chart-tooltip-fg)" }}>
              {typeof p.value === "number" ? f(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
