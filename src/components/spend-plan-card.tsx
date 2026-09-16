import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Panel } from "@/components/page";
import { useT } from "@/hooks/use-language";
import { useSpendTarget, type FixedExpense } from "@/hooks/use-fixed-expenses";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import type { Tx } from "@/hooks/use-transactions";
import { BUDGET_CATEGORIES, findBudgetCategory } from "@/lib/budget-categories";
import { cn } from "@/lib/utils";

/** Tarjeta del dashboard: tu plan de gastos y cómo vas contra él en el mes
 *  seleccionado. Si no hay plan creado, no se muestra nada. */
export function SpendPlanCard({
  monthKey,
  monthLabel,
  monthSpend,
  fixedItems,
  transactions,
  fmt,
}: {
  /** Mes activo del dashboard ("yyyy-MM"); si no es un mes real, no hay detalle por categoría. */
  monthKey: string;
  monthLabel: string;
  /** Gasto total del mes (fijos + variables), ya calculado por el dashboard. */
  monthSpend: number;
  fixedItems: FixedExpense[];
  transactions: Tx[];
  fmt: (n: number) => string;
}) {
  const t = useT();
  const { target, hasTarget } = useSpendTarget();
  const budgets = useSpendBudgets();

  const planLines = useMemo(() => budgets.lines.filter((l) => l.amount > 0), [budgets.lines]);
  const planTotal = planLines.reduce((s, l) => s + l.amount, 0);
  const goal = target > 0 ? target : planTotal;
  const hasPlan = hasTarget || planLines.length > 0;

  const isRealMonth = /^\d{4}-\d{2}$/.test(monthKey);

  const customLines = useMemo(
    () =>
      budgets.lines
        .filter((l) => l.id.startsWith("custom:"))
        .map((l) => ({
          id: l.id,
          aliases: [(l.label ?? l.id.slice(7)), ...(l.keywords ?? [])]
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k.length > 2),
        }))
        .filter((l) => l.aliases.length > 0),
    [budgets.lines],
  );

  // Gasto real del mes por categoría del plan (mismo criterio que en /gastos).
  const actualByBudget = useMemo(() => {
    const map = new Map<string, number>();
    const match = (name: string) => {
      const n = name.trim().toLowerCase();
      if (!n) return null;
      const custom = customLines.find((c) => c.aliases.some((a) => n === a || n.includes(a) || a.includes(n)));
      if (custom) return custom.id;
      return BUDGET_CATEGORIES.find((c) => c.aliases.some((a) => n === a || n.includes(a)))?.id ?? null;
    };
    if (isRealMonth) {
      for (const tx of transactions) {
        if (tx.amount >= 0) continue;
        const id = match(tx.category ?? "") ?? match(tx.merchant || tx.description || "");
        if (id) map.set(id, (map.get(id) ?? 0) + Math.abs(tx.amount));
      }
    }
    for (const item of fixedItems) {
      const amount = Number(item.amount) || 0;
      if (amount <= 0) continue;
      const id = match(item.name);
      if (id) map.set(id, (map.get(id) ?? 0) + amount);
    }
    return map;
  }, [transactions, fixedItems, customLines, isRealMonth]);

  const rows = useMemo(
    () =>
      planLines
        .map((l) => {
          const cat = findBudgetCategory(l.id);
          return {
            id: l.id,
            name: cat ? t(cat.es, cat.en) : (l.label ?? l.id),
            emoji: cat?.emoji ?? l.emoji ?? "📦",
            planned: l.amount,
            actual: actualByBudget.get(l.id) ?? 0,
          };
        })
        .sort((a, b) => b.actual - b.planned - (a.actual - a.planned))
        .slice(0, 4),
    [planLines, actualByBudget, t],
  );

  if (!hasPlan || goal <= 0) return null;

  const pct = (monthSpend / goal) * 100;
  const over = monthSpend > goal;
  const boundaryPct = monthSpend > 0 ? Math.min(100, (goal / monthSpend) * 100) : 0;
  const diff = Math.abs(goal - monthSpend);

  return (
    <Link to="/gastos" className="block transition-transform hover:-translate-y-0.5">
      <Panel variant="minimal" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="whitespace-nowrap text-sm font-semibold lg:text-base">{t("Tu plan de gastos", "Your spending plan")}</h2>
            <p className="mt-1 truncate text-[0.6875rem] leading-4 text-muted-foreground sm:text-xs">
              {t("Cómo vas vs tu plan", "How you're doing vs your plan")} · {monthLabel}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2 md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span className="numeric text-xl font-semibold md:text-2xl">{fmt(monthSpend)}</span>
              <span
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium",
                  over ? "bg-negative/12 text-negative" : "bg-positive/12 text-positive",
                )}
              >
                {over ? `${fmt(diff)} ${t("de más", "over")}` : `${fmt(diff)} ${t("disponibles", "left")}`}
              </span>
            </div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
              {over ? (
                <>
                  <div className="h-full bg-positive" style={{ width: `${boundaryPct}%` }} />
                  <div className="h-full flex-1 bg-negative" />
                </>
              ) : (
                <div className="h-full rounded-full bg-positive" style={{ width: `${Math.min(100, pct)}%` }} />
              )}
            </div>
            <p className="mt-2 whitespace-nowrap text-[0.6875rem] leading-4 text-muted-foreground sm:text-xs">
              {pct.toFixed(0)}% {t("del objetivo", "of target")} · {t("meta", "goal")} {fmt(goal)}
            </p>
          </div>

          {rows.length > 0 && (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {rows.map((row) => {
                const rowPct = row.planned > 0 ? (row.actual / row.planned) * 100 : 0;
                const rowOver = row.actual > row.planned;
                return (
                  <div key={row.id} className="rounded-xl border border-border/50 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-[0.6875rem] leading-4">
                        {row.emoji} {row.name}
                      </span>
                      <span className={cn("numeric shrink-0 text-[0.6875rem] leading-4", rowOver ? "text-negative" : "text-positive")}>
                        {fmt(row.actual)} / {fmt(row.planned)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", rowOver ? "bg-negative" : "bg-positive")}
                        style={{ width: `${Math.min(100, rowPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    </Link>
  );
}
