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
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: ReactNode;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const f = formatter ?? ((v: number) => fmt(v));
  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="numeric ml-auto font-medium text-popover-foreground">
              {typeof p.value === "number" ? f(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
