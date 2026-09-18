import { createFileRoute } from "@tanstack/react-router";

import { ExpenseLog } from "@/components/expense-log";
import { PageShell } from "@/components/page";

export const Route = createFileRoute("/registro-gastos")({
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
