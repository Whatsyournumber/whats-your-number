import type { Tx } from "@/hooks/use-transactions";
import type { DerivedMonth } from "@/lib/profile-data";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * Construye la serie mensual real a partir de las transacciones importadas (EEFF).
 * El patrimonio se reconstruye hacia atrás desde el patrimonio actual restando el ahorro real de cada mes.
 */
export function buildRealMonths(
  transactions: Tx[],
  currentNetWorth: number,
  opts?: {
    /** Aportes/compras de activos por mes (clave YYYY-MM) que suman al patrimonio de ese mes. */
    contributions?: Record<string, number>;
    fallbackInvestRatio?: number;
    maxMonths?: number;
  },
): DerivedMonth[] | null {
  const fallbackInvestRatio = opts?.fallbackInvestRatio ?? 0.6;
  const maxMonths = opts?.maxMonths ?? 12;
  const contributions = opts?.contributions ?? {};
  if (!transactions.length && Object.keys(contributions).length === 0) return null;

  const agg = new Map<string, { income: number; expenses: number }>();
  for (const tx of transactions) {
    if (!tx.tx_date) continue;
    const key = tx.tx_date.slice(0, 7);
    const row = agg.get(key) ?? { income: 0, expenses: 0 };
    if (tx.amount >= 0) row.income += tx.amount;
    else row.expenses += Math.abs(tx.amount);
    agg.set(key, row);
  }
  for (const key of Object.keys(contributions)) {
    if (!agg.has(key)) agg.set(key, { income: 0, expenses: 0 });
  }
  if (agg.size === 0) return null;

  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const keys = [...agg.keys()].sort();
  const first = keys[0]!;
  // La serie siempre llega hasta el mes actual para reflejar aportes recientes.
  const last = [keys[keys.length - 1]!, nowKey].sort().pop()!;

  // Rellena los meses intermedios sin movimientos para que la línea sea continua.
  const ordered: string[] = [];
  const cursor = new Date(Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1, 1);
  const end = new Date(Number(last.slice(0, 4)), Number(last.slice(5, 7)) - 1, 1);
  while (cursor <= end) {
    ordered.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const window = ordered.slice(-maxMonths);


  const rows = window.map((key) => {
    const { income, expenses } = agg.get(key) ?? { income: 0, expenses: 0 };
    const contributed = Math.round(contributions[key] ?? 0);
    return {
      month: key,
      label: MONTH_LABELS[Number(key.slice(5, 7)) - 1]!,
      income: Math.round(income),
      expenses: Math.round(expenses),
      // El ahorro del mes incluye los aportes/compras de activos hechos en esa fecha.
      savings: Math.round(income - expenses) + contributed,
      netWorth: 0,
      investments: Math.round(Math.max(0, income - expenses) * fallbackInvestRatio) + Math.max(0, contributed),
    } satisfies DerivedMonth;
  });

  // Patrimonio: el último mes es el patrimonio actual; hacia atrás se resta el ahorro del mes siguiente.
  let value = currentNetWorth;
  for (let i = rows.length - 1; i >= 0; i--) {
    rows[i]!.netWorth = Math.round(value);
    value -= rows[i]!.savings;
  }


  return rows;
}
