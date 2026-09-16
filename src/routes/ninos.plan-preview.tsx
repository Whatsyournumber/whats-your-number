// TEMPORAL: vista de revisión del popup del plan de gastos. Se elimina tras verificar.
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { BudgetDialog } from "@/components/budget-dialog";
import { DEFAULT_BUDGET_IDS } from "@/lib/budget-categories";
import type { BudgetLine } from "@/hooks/use-spend-budgets";

export const Route = createFileRoute("/ninos/plan-preview")({
  component: Preview,
  head: () => ({
    meta: [{ title: "Revisión plan de gastos" }, { name: "robots", content: "noindex" }],
    links: [],
  }),
});

const AMOUNTS: Record<string, number> = {
  housing: 1300,
  utilities: 100,
  groceries: 500,
  transport: 300,
  insurance: 150,
  restaurants: 1000,
  delivery: 500,
  travel: 500,
  nightlife: 1500,
  shopping: 200,
  apps: 300,
  gym: 40,
};

const LINES: BudgetLine[] = DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: AMOUNTS[id] ?? 0 }));

function Preview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-background p-6">
      <BudgetDialog
        open={open}
        onOpenChange={setOpen}
        lines={LINES}
        onSave={() => setOpen(false)}
        fmt={(n) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(n) + " €"}
      />
    </div>
  );
}
