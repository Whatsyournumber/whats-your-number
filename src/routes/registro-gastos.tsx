import { createFileRoute } from "@tanstack/react-router";

import { ExpenseLog } from "@/components/expense-log";
import { PageShell } from "@/components/page";

export const Route = createFileRoute("/registro-gastos")({
  validateSearch: (search: Record<string, unknown>): { add?: boolean; action?: string; month?: string } => {
    const action = typeof search["action"] === "string" ? search["action"] : undefined;
    const valid = ["voice", "photo", "upload", "recurring", "statement"];
    const out: { add?: boolean; action?: string; month?: string } = {};
    if (search["add"] === true || search["add"] === "1") out.add = true;
    if (action && valid.includes(action)) out.action = action;
    const month = typeof search["month"] === "string" ? search["month"] : undefined;
    if (month && /^\d{4}-\d{2}$/.test(month)) out.month = month;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Expense Tracker — WhatsYourNumber" },
      {
        name: "description",
        content:
          "Registra cada gasto por voz, con la foto del recibo o a mano, y controla tu plan mensual en tiempo real.",
      },
      { property: "og:title", content: "Expense Tracker — WhatsYourNumber" },
      {
        property: "og:description",
        content: "Anota gastos por voz, foto del recibo o manualmente y mantente dentro de tu plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistroGastos,
});

function RegistroGastos() {
  return (
    <PageShell>
      <ExpenseLog />
    </PageShell>
  );
}
