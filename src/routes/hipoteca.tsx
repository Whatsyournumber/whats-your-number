import { createFileRoute } from "@tanstack/react-router";

import { MortgageModule } from "@/components/mortgage-module";
import { PageShell } from "@/components/page";

export const Route = createFileRoute("/hipoteca")({
  head: () => ({
    meta: [
      { title: "Tu hipoteca — WhatsYournumber" },
      {
        name: "description",
        content: "¿Abonar, renegociar o invertir? Compara cada estrategia y su impacto en Your Number.",
      },
      { property: "og:title", content: "Tu hipoteca — WhatsYournumber" },
      { property: "og:description", content: "Simula abono, renegociación o inversión y mide cuánto te acerca a tu número." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hipoteca,
});

function Hipoteca() {
  return (
    <PageShell>
      <MortgageModule />
    </PageShell>
  );
}

