import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell } from "@/components/page";
import { SubscriptionManager } from "@/components/subscription-manager";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/suscripcion")({
  head: () => ({
    meta: [
      { title: "Suscripción y facturación — WhatsYournumber" },
      { name: "description", content: "Gestiona tu plan, método de pago, facturas y cancelación desde el portal del cliente." },
      { property: "og:title", content: "Suscripción y facturación — WhatsYournumber" },
      { property: "og:description", content: "Portal del cliente: plan, pagos, facturas y cancelación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuscripcionPage,
});

function SuscripcionPage() {
  const t = useT();
  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Facturación", "Billing")}
        title={t("Portal del cliente", "Customer portal")}
        subtitle={t(
          "Cambia de plan, actualiza tu tarjeta, descarga facturas o cancela cuando quieras.",
          "Switch plan, update your card, download invoices or cancel anytime.",
        )}
      />
      <SubscriptionManager />
    </PageShell>
  );
}
