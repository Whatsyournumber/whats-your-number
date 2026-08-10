export type SimGoal = {
  kind: "purchase" | "boost" | "invest";
  cost: number;
  monthly: number;
  saved: number;
  /** Entrada de capital puntual (p.ej. venta del proyecto). */
  payout?: number;
  /** Años desde hoy hasta ese cobro puntual. */
  payoutYears?: number;
};

const MAX_MONTHS = 12 * 60;

/**
 * Meses hasta alcanzar el capital objetivo teniendo en cuenta las metas de vida.
 * - purchase / invest: desvían `monthly` del ahorro hasta financiar el coste.
 * - boost: pagan el coste una vez y luego suman `monthly` al ahorro (acelera el retiro).
 */
export function monthsToTarget(opts: {
  start: number;
  target: number;
  annualReturn: number;
  savings: number;
  goals: SimGoal[];
}): number | null {
  const r = opts.annualReturn / 100 / 12;
  let capital = Math.max(0, opts.start);
  const funds = opts.goals.map((g) => Math.max(0, g.saved));
  const paid = opts.goals.map(() => false);

  if (capital >= opts.target) return 0;

  for (let m = 0; m < MAX_MONTHS; m++) {
    let flow = opts.savings;
    opts.goals.forEach((g, i) => {
      if (g.payout && Math.round((g.payoutYears ?? 0) * 12) === m) flow += g.payout;
      if (g.kind === "boost") {
        if (!paid[i]) {
          capital -= Math.max(0, g.cost - g.saved);
          paid[i] = true;
        }
        flow += g.monthly;
      } else if (funds[i]! < g.cost) {
        flow -= g.monthly;
        funds[i] = funds[i]! + g.monthly;
      }
    });
    capital = capital * (1 + r) + flow;
    if (capital >= opts.target) return m + 1;
    if (capital < -opts.target) return null;
  }
  return null;
}

export function yearsDiff(baseMonths: number | null, withMonths: number | null) {
  if (baseMonths === null || withMonths === null) return null;
  return (withMonths - baseMonths) / 12;
}

/** "+2.4 años", "-3.2 años" o "+9 meses" según magnitud. */
export function formatImpact(years: number | null) {
  if (years === null) return "Variable";
  const abs = Math.abs(years);
  if (abs < 0.08) return "Sin impacto";
  const sign = years > 0 ? "+" : "-";
  if (abs < 1) return `${sign}${Math.round(abs * 12)} meses`;
  return `${sign}${abs.toFixed(1)} años`;
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
