import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CreditCard, ExternalLink, Loader2, Mail, Receipt, User, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { PlanChangeDialog, PlanDetailsDialog } from "@/components/plan-details-dialog";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";
import { getBillingDetails } from "@/lib/billing.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { changePlan, openCustomerPortal, type PortalTarget } from "@/utils/subscriptions.functions";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export function SubscriptionManager() {
  const t = useT();
  const { subscription, tier, isTrial, isPromo, loading } = useSubscription();
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const billing = useQuery({
    queryKey: ["billing-details", user?.id, getPaddleEnvironment(), subscription?.id ?? null],
    enabled: Boolean(user),
    queryFn: () => getBillingDetails({ data: { environment: getPaddleEnvironment() } }),
    staleTime: 60_000,
  });

  const displayName =
    billing.data?.name ??
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    null;
  const displayEmail = billing.data?.email ?? billing.data?.accountEmail ?? user?.email ?? null;
  const card = billing.data?.card ?? null;

  const planLabel = tier === "patrimonio" ? "Familiar" : tier === "pro" ? "Pro" : "Free";

  const portal = async (target: PortalTarget) => {
    setBusy(`portal:${target}`);
    try {
      const res = await openCustomerPortal({ data: { environment: getPaddleEnvironment(), target } });
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
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
      const res = await changePlan({ data: { priceId, environment: getPaddleEnvironment() } });
      if (!res.ok) {
        toast.error(t("Necesitas una suscripción activa para cambiar de plan.", "You need an active subscription to switch plans."));
        return;
      }
      toast.success(
        res.instant
          ? t("Plan cambiado. Ya está activo en tu cuenta.", "Plan switched. It's active on your account now.")
          : res.upgraded
            ? t("Plan mejorado. Ya tienes acceso completo.", "Plan upgraded. You have full access now.")
            : t("Cambio programado: mantienes tu plan actual hasta el final del periodo pagado.", "Change scheduled: you keep your current plan until the paid period ends."),
      );
    } catch {
      toast.error(t("No pudimos cambiar el plan.", "We couldn't change the plan."));
    } finally {
      setBusy(null);
    }
  };

  const spin = (key: string) => busy === key;

  return (
    <Panel
      title={t("Suscripción", "Subscription")}
      description={t("Gestiona tu plan, tu método de pago y tus facturas.", "Manage your plan, payment method and invoices.")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {planLabel}
          {isPromo
            ? ` · ${t("código de invitación", "invite code")}`
            : isTrial
              ? ` · ${t("prueba", "trial")}`
              : ""}

        </span>
        {subscription?.current_period_end &&
          (isPromo ? (
            new Date(subscription.current_period_end).getTime() - Date.now() < 5 * 365 * 86_400_000 ? (
              <span className="text-xs text-muted-foreground">
                {t("Acceso hasta", "Access until")} {fmtDate(subscription.current_period_end)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("Acceso sin caducidad", "No expiry")}
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">
              {subscription.status === "canceled" || subscription.cancel_at_period_end
                ? t("Acceso hasta", "Access until")
                : t("Renueva el", "Renews on")}{" "}
              {fmtDate(subscription.current_period_end)}
            </span>
          ))}

        <PlanDetailsDialog
          tier={tier}
          isTrial={isTrial}
          renewsOn={subscription?.current_period_end ? fmtDate(subscription.current_period_end) : null}
        />
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
          <PlanChangeDialog
            from="pro"
            to="patrimonio"
            loading={spin("patrimonio_monthly")}
            disabled={busy !== null}
            onConfirm={() => void switchPlan("patrimonio_monthly")}
          />
        )}
        {tier === "patrimonio" && (
          <PlanChangeDialog
            from="patrimonio"
            to="pro"
            loading={spin("pro_monthly")}
            disabled={busy !== null}
            onConfirm={() => void switchPlan("pro_monthly")}
          />
        )}

      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <InfoTile
          icon={User}
          label={t("Titular", "Account holder")}
          value={displayName ?? t("Sin nombre", "No name")}
          loading={billing.isLoading}
        />
        <InfoTile
          icon={Mail}
          label={t("Correo", "Email")}
          value={displayEmail ?? "—"}
          loading={billing.isLoading}
        />
        <InfoTile
          icon={CreditCard}
          label={t("Tarjeta", "Card")}
          value={
            card?.last4
              ? `${card.brand ? `${card.brand.toUpperCase()} ` : ""}•••• ${card.last4}${card.expiry ? ` · ${card.expiry}` : ""}`
              : card?.type
                ? card.type.replace(/_/g, " ")
                : tier === "free"
                  ? t("Sin método de pago", "No payment method")
                  : t("No disponible", "Not available")
          }
          loading={billing.isLoading}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <PortalAction
            icon={CreditCard}
            label={t("Método de pago", "Payment method")}
            hint={t("Actualiza tu tarjeta", "Update your card")}
            loading={spin("portal:payment_method")}
            disabled={busy !== null || loading || tier === "free"}
            onClick={() => void portal("payment_method")}
          />
          <PortalAction
            icon={Receipt}
            label={t("Facturas", "Invoices")}
            hint={t("Descarga tu historial", "Download your history")}
            loading={spin("portal:overview")}
            disabled={busy !== null || loading || tier === "free"}
            onClick={() => void portal("overview")}
          />
          <PortalAction
            icon={XCircle}
            label={t("Cancelar plan", "Cancel plan")}
            hint={t("Sigues con acceso hasta el final", "Access until period ends")}
            loading={spin("portal:cancel")}
            disabled={busy !== null || loading || tier === "free"}
            onClick={() => void portal("cancel")}
          />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t(
          "El portal seguro se abre en una pestaña nueva. Si cancelas, conservas todas las funciones hasta el final del periodo que ya pagaste.",
          "The secure portal opens in a new tab. If you cancel, you keep every feature until the end of the period you already paid for.",
        )}
      </p>
    </Panel>
  );
}

function PortalAction({
  icon: Icon,
  label,
  hint,
  loading,
  disabled,
  onClick,
}: {
  icon: typeof CreditCard;
  label: string;
  hint: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-start gap-3 rounded-xl border border-border bg-elevated/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-elevated disabled:opacity-60"
    >
      <span className="mt-0.5 rounded-lg border border-border bg-background p-1.5 text-muted-foreground group-hover:text-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-medium">
          {label}
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-elevated/40 p-3">
      <span className="mt-0.5 rounded-lg border border-border bg-background p-1.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-medium">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : value}
        </span>
      </span>
    </div>
  );
}
