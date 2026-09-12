import type { ReactNode } from "react";

import { fmt } from "@/lib/data";
import { currencySymbol, getWynMoneyLocale } from "@/lib/onboarding";

export const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

/** Genera ticks y un formateador consistente para ejes Y de dinero.
 *  Usa la misma unidad (K/M/B) para todos los ticks según el valor máximo,
 *  evitando saltos entre M y K y etiquetas que se ocultan por solapamiento. */
export function axisMoneyTicks(values: number[], currency = "USD") {
  const nums = values.filter((v) => Number.isFinite(v));
  const dataMin = nums.length ? Math.min(...nums) : 0;
  const dataMax = nums.length ? Math.max(...nums) : 0;
  const span = Math.max(dataMax - dataMin, Math.abs(dataMax) * 0.02, 1);

  const useB = Math.abs(dataMax) >= 1_000_000_000;
  const useM = !useB && Math.abs(dataMax) >= 1_000_000;
  const useK = !useB && !useM && Math.abs(dataMax) >= 1_000;
  const divisor = useB ? 1_000_000_000 : useM ? 1_000_000 : useK ? 1_000 : 1;
  const unit = useB ? "B" : useM ? "M" : useK ? "K" : "";

  // Paso base ~5 ticks, redondeado a un paso "bonito" (1/2/2.5/5/10 × 10^n).
  const rawStep = (span * 1.1) / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let step = magnitude;
  if (residual <= 1.5) step = magnitude;
  else if (residual <= 2.25) step = 2 * magnitude;
  else if (residual <= 3.5) step = 2.5 * magnitude;
  else if (residual <= 7) step = 5 * magnitude;
  else step = 10 * magnitude;

  // Ticks que cubren el rango real con un pequeño padding, sin forzar el 0 ni
  // recortar valores negativos.
  const lo = Math.floor((dataMin - span * 0.05) / step) * step;
  const hi = Math.ceil((dataMax + span * 0.05) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) {
    ticks.push(Math.round(v));
  }

  const sym = currencySymbol(currency);
  const locale = getWynMoneyLocale();
  const formatter = (v: number) => {
    const scaled = v / divisor;
    const formatted =
      scaled === 0 || Math.abs(scaled) >= 100
        ? String(Math.round(scaled))
        : scaled.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${sym}${formatted}${unit}`;
  };

  return { ticks, formatter, unit, divisor };
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string; payload?: unknown }[];
  label?: ReactNode;
  formatter?: (v: number, item?: { dataKey?: string; payload?: unknown }) => string;
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
              {typeof p.value === "number" ? f(p.value, p) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
