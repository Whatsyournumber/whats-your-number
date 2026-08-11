import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

import { MortgageModule } from "@/components/mortgage-module";
import { PageHeader, PageShell } from "@/components/page";
import { useT } from "@/hooks/use-language";

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
  const t = useT();
  return (
    <PageShell>
      <PageHeader
        title={t("Tu hipoteca", "Your mortgage")}
        subtitle={t(
          "¿Abonar, renegociar o invertir? Compara cada estrategia y su impacto en Your Number.",
          "Pay down, renegotiate or invest? Compare each strategy and its impact on Your Number.",
        )}
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("Simulador de estrategias", "Strategy simulator")}</span>
          </div>
        }
      />

      <MortgageModule />
    </PageShell>
  );
}
