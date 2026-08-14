import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useT } from "@/hooks/use-language";
import { clearPendingCheckoutPlan, type PendingCheckoutPlan } from "@/lib/pending-checkout";
import { getPaddleEnvironment } from "@/lib/paddle";
import { syncMySubscription } from "@/utils/subscriptions.functions";

type SuccessSearch = { plan: PendingCheckoutPlan };

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
    plan: search["plan"] === "familiar" ? "familiar" : "pro",
  }),
  head: () => ({
    meta: [
      { title: "Pago confirmado — WhatsYournumber" },
      { name: "description", content: "Confirmación y activación de tu plan de WhatsYournumber." },
      { property: "og:title", content: "Pago confirmado — WhatsYournumber" },
      { property: "og:description", content: "Tu plan está siendo activado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const { plan } = Route.useSearch();
  const { tier } = useSubscription();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const t = useT();
  const [checks, setChecks] = useState(0);

  const activated = plan === "familiar" ? tier === "patrimonio" : tier === "pro" || tier === "patrimonio";

  useEffect(() => {
    if (!activated) return;
    clearPendingCheckoutPlan();
    const timer = window.setTimeout(() => {
      navigate({ to: plan === "familiar" ? "/ninos" : "/dashboard", replace: true });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activated, navigate, plan]);

  useEffect(() => {
    if (activated || checks >= 20) return;
    const timer = window.setTimeout(async () => {
      setChecks((value) => value + 1);
      try {
        await syncMySubscription({ data: { environment: getPaddleEnvironment() } });
      } catch {
        // ignore: the webhook may still land on its own
      }
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [activated, checks, queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <main className="flex min-h-[calc(100vh-33px)] items-center justify-center px-5">
        <section className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-positive/30 bg-positive/10 text-positive">
            {activated ? <CheckCircle2 className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">
            {activated ? t("Plan activado", "Plan activated") : t("Confirmando tu pago", "Confirming your payment")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {activated
              ? t("Todo está listo. Te llevamos a tu cuenta.", "Everything is ready. Taking you to your account.")
              : t("Paddle confirmó el pago. Estamos activando tus funciones; puede tardar unos segundos.", "Paddle confirmed the payment. We are activating your features; this may take a few seconds.")}
          </p>
          {!activated && checks >= 20 ? (
            <Button className="mt-6" onClick={() => window.location.reload()}>
              {t("Volver a comprobar", "Check again")}
            </Button>
          ) : null}
        </section>
      </main>
    </div>
  );
}