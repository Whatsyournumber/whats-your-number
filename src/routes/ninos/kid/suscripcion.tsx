import { createFileRoute } from "@tanstack/react-router";

import { Card } from "@/components/mfn-ui";
import { KidPage, PageTitle } from "@/components/kid-page";
import { PromoCodeRedeem } from "@/components/promo-code-redeem";
import { SubscriptionManager } from "@/components/subscription-manager";
import { useI18n } from "@/lib/mfn-i18n";

export const Route = createFileRoute("/ninos/kid/suscripcion")({
  head: () => ({
    meta: [
      { title: "Suscripción | My First Number" },
      {
        name: "description",
        content: "Gestiona el plan familiar, el método de pago y los códigos promo desde la zona de niños.",
      },
      { property: "og:title", content: "Suscripción | My First Number" },
      { property: "og:description", content: "Plan, pagos y códigos promo del plan familiar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <KidPage area="parent">{() => <KidSubscription />}</KidPage>,
});

function KidSubscription() {
  const { t } = useI18n();
  return (
    <>
      <Link
        to="/ninos"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("Volver a perfiles", "Back to profiles")}
      </Link>
      <PageTitle
        emoji="💳"
        title={t("Suscripción", "Subscription")}
        subtitle={t(
          "Tu plan familiar, tus pagos y tus códigos promo.",
          "Your family plan, payments and promo codes.",
        )}
      />
      <div className="grid gap-4">
        <Card>
          <SubscriptionManager />
        </Card>
        <Card>
          <PromoCodeRedeem />
        </Card>
      </div>
    </>
  );
}
