import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";
import { changePlan, openCustomerPortal } from "@/utils/subscriptions.functions";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export function SubscriptionManager() {
  const t = useT();
  const { subscription, tier, isTrial, loading } = useSubscription();
  const [busy, setBusy] = useState<string | null>(null);

  const planLabel = tier === "patrimonio" ? "Patrimonio" : tier === "pro" ? "Pro" : "Free";

  const portal = async () => {
    setBusy("portal");
    try {
      const res = await openCustomerPortal();
      if (res.url) window.open(res.url, "_blank");
      else toast.error(t("Aún no tienes una suscripción activa.", "You don't have an active subscription yet."));
    } catch {
      toast.error(t("No pudimos abrir el portal.", "We couldn't open the portal."));
    } finally {
      setBusy(null);
    }
  };

  const switchPlan = async (priceId: string) => {
    setBusy(priceId);
    try {
      const res = await changePlan({ data: { priceId } });
      if (!res.ok) {
        toast.error(t("Necesitas una suscripción activa para cambiar de plan.", "You need an active subscription to switch plans."));
        return;
      }
      toast.success(
        res.upgraded
          ? t("Plan mejorado. Ya tienes acceso completo.", "Plan upgraded. You have full access now.")
          : t("Cambio programado: mantienes tu plan actual hasta el final del periodo pagado.", "Change scheduled: you keep your current plan until the paid period ends."),
      );
    } catch {
      toast.error(t("No pudimos cambiar el plan.", "We couldn't change the plan."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title={t("Suscripción", "Subscription")}
      description={t("Gestiona tu plan, tu método de pago y tus facturas.", "Manage your plan, payment method and invoices.")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {planLabel}
          {isTrial ? ` · ${t("prueba", "trial")}` : ""}
        </span>
        {subscription?.current_period_end && (
          <span className="text-xs text-muted-foreground">
            {subscription.status === "canceled" || subscription.cancel_at_period_end
              ? t("Acceso hasta", "Access until")
              : t("Renueva el", "Renews on")}{" "}
            {fmtDate(subscription.current_period_end)}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tier === "free" && (
          <Button asChild size="sm">
            <Link to="/precios">
              {t("Ver planes", "See plans")} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        {tier === "pro" && (
          <Button size="sm" disabled={busy !== null} onClick={() => void switchPlan("patrimonio_monthly")}>
            {busy === "patrimonio_monthly" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {t("Mejorar a Patrimonio", "Upgrade to Patrimonio")}
          </Button>
        )}
        {tier === "patrimonio" && (
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void switchPlan("pro_monthly")}>
            {busy === "pro_monthly" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {t("Bajar a Pro", "Downgrade to Pro")}
          </Button>
        )}
        {tier !== "free" && (
          <Button size="sm" variant="ghost" disabled={busy !== null || loading} onClick={() => void portal()}>
            {busy === "portal" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="mr-1 h-3.5 w-3.5" />}
            {t("Facturas y cancelar", "Invoices and cancel")}
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t(
          "Si cancelas, conservas todas las funciones hasta el final del periodo que ya pagaste.",
          "If you cancel, you keep every feature until the end of the period you already paid for.",
        )}
      </p>
    </Panel>
  );
}
