import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/page";
import { PromoCodeRedeem } from "@/components/promo-code-redeem";
import { SubscriptionManager } from "@/components/subscription-manager";
import { SubscriptionSupport } from "@/components/subscription-support";
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
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SuscripcionPage,
});

function SuscripcionPage() {
  const t = useT();
  return (
    <PageShell>
      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card/50 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{t("Facturación", "Billing")}</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">{t("Portal del cliente", "Customer portal")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("Tu plan, pagos y facturas en un solo lugar.", "Your plan, payments and invoices in one place.")}
          </p>
        </div>
      </header>
      <PromoCodeRedeem />
      <SubscriptionManager />
      <SubscriptionSupport />
    </PageShell>
  );
}
