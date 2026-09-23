import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, ChevronRight, CreditCard, Crown, ExternalLink, Loader2, Mail, Plus, Receipt, ShieldCheck, Sparkles, Trash2, User, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/page";
import { PlanChangeDialog, PlanDetailsDialog } from "@/components/plan-details-dialog";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const benefits = tier === "free"
    ? [t("Registro de gastos", "Expense tracking"), t("Presupuesto mensual", "Monthly budget"), t("Asistente IA", "AI assistant")]
    : tier === "pro"
      ? [t("Análisis de gastos con IA", "AI spending analysis"), t("Simulador de hipoteca", "Mortgage simulator"), t("Portafolio e inversiones", "Portfolio and investments"), "Life Planner"]
      : [t("Todo lo incluido en Pro", "Everything in Pro"), t("Perfiles familiares", "Family profiles"), t("Planificación en pareja", "Couples planning"), t("Soporte prioritario", "Priority support")];

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
    <Panel title={t("Tu suscripción", "Your subscription")} description={t("Gestiona tu plan, método de pago y facturas.", "Manage your plan, payment method and invoices.")}>
      <div className="grid gap-3 rounded-xl border border-border bg-elevated/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            {tier === "free" ? <Sparkles className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold">{t("Plan", "Plan")} {planLabel}</h3>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {t("Activo", "Active")}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier === "free" ? t("Empieza a ordenar tus finanzas.", "Start organizing your finances.") : t("Todo lo que necesitas para alcanzar tu Número.", "Everything you need to reach your Number.")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {tier === "free" && (
            <Button asChild size="sm"><Link to="/precios">{t("Ver planes", "See plans")} <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          )}
          {tier === "pro" && <PlanChangeDialog from="pro" to="patrimonio" loading={spin("patrimonio_monthly")} disabled={busy !== null} onConfirm={() => void switchPlan("patrimonio_monthly")} />}
          {tier === "patrimonio" && <PlanChangeDialog from="patrimonio" to="pro" loading={spin("pro_monthly")} disabled={busy !== null} onConfirm={() => void switchPlan("pro_monthly")} />}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-4">
        {benefits.map((benefit) => (
          <span key={benefit} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />{benefit}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground">
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


      <div className="mt-4 grid gap-2 sm:grid-cols-3">
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
          <PaymentMethodDialog
            card={card}
            loading={spin("portal:payment_method")}
            disabled={busy !== null || loading || tier === "free"}
            onManage={() => void portal("payment_method")}
          />
          <PortalAction
            icon={Receipt}
            label={t("Facturas", "Invoices")}
            hint={t("Descarga tu historial", "Download your history")}
            loading={spin("portal:overview")}
            disabled={busy !== null || loading || tier === "free"}
            onClick={() => void portal("overview")}
          />
          <CancelPlanDialog
            planLabel={planLabel}
            periodEnd={subscription?.current_period_end ? fmtDate(subscription.current_period_end) : null}
            loading={spin("portal:cancel")}
            disabled={busy !== null || loading || tier === "free"}
            onConfirm={() => void portal("cancel")}
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

function PaymentMethodDialog({
  card,
  loading,
  disabled,
  onManage,
}: {
  card: { brand: string | null; last4: string | null; expiry: string | null; type: string | null } | null;
  loading: boolean;
  disabled: boolean;
  onManage: () => void;
}) {
  const t = useT();
  const cardLabel = card?.last4
    ? `${card.brand ? `${card.brand.toUpperCase()} ` : ""}•••• ${card.last4}`
    : t("No hay una tarjeta disponible", "No card is available");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <PortalAction
          icon={CreditCard}
          label={t("Método de pago", "Payment method")}
          hint={t("Añade, cambia o elimina tu tarjeta", "Add, replace or remove your card")}
          loading={loading}
          disabled={disabled}
          onClick={() => undefined}
        />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Método de pago", "Payment method")}</DialogTitle>
          <DialogDescription>
            {t("Gestiona de forma segura la tarjeta vinculada a tu suscripción.", "Securely manage the card linked to your subscription.")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-elevated/40 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t("Tarjeta actual", "Current card")}</p>
              <p className="mt-0.5 font-medium">{cardLabel}</p>
              {card?.expiry ? <p className="text-xs text-muted-foreground">{t("Vence", "Expires")} {card.expiry}</p> : null}
            </div>
            <ShieldCheck className="h-5 w-5 text-positive" />
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full justify-start" onClick={onManage} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {t("Añadir o reemplazar tarjeta", "Add or replace card")}
            <ExternalLink className="ml-auto h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onManage} disabled={loading || !card}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("Eliminar o administrar tarjeta", "Remove or manage card")}
            <ExternalLink className="ml-auto h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("La gestión se completa en el portal seguro de pagos. Una suscripción activa puede requerir una tarjeta válida antes de eliminar la actual.", "Management is completed in the secure payments portal. An active subscription may require a valid card before removing the current one.")}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function CancelPlanDialog({
  planLabel,
  periodEnd,
  loading,
  disabled,
  onConfirm,
}: {
  planLabel: string;
  periodEnd: string | null;
  loading: boolean;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <PortalAction
          icon={XCircle}
          label={t("Cancelar plan", "Cancel plan")}
          hint={t("Sigues con acceso hasta el final", "Access until period ends")}
          loading={loading}
          disabled={disabled}
          onClick={() => undefined}
        />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-y-auto rounded-3xl border-border bg-background p-5 text-center shadow-2xl sm:p-7">
        <DialogHeader className="items-center text-center">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20"><AlertTriangle className="h-6 w-6" /></div>
          <DialogTitle className="whitespace-nowrap text-sm font-bold leading-tight sm:text-base">
            {t("¿Seguro que quieres ", "Are you sure you want to ")}
            <span className="text-destructive">{t("cancelar", "cancel")}</span>
            {t(` tu plan ${planLabel}?`, ` your ${planLabel} plan?`)}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-3 space-y-1 text-center text-xs leading-relaxed sm:text-sm">
              <p>
                {periodEnd
                  ? <>{t("Tu plan seguirá activo hasta el ", "Your plan will remain active until ")}<span className="font-medium text-foreground">{periodEnd}</span>.</>
                  : t("Tu plan seguirá activo hasta que termine el periodo que ya pagaste.", "Your plan will remain active until the end of your paid period.")}
              </p>
              <p className="text-[11px] text-muted-foreground">{t("Después pasarás automáticamente al plan Free y no habrá más cobros.", "After that, you'll automatically switch to the Free plan and there will be no more charges.")}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 space-y-4 rounded-2xl border border-border bg-elevated/20 p-4 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-positive/15 text-positive"><Check className="h-3 w-3" /></span>
            <div>
              <p className="text-[13px] font-medium text-foreground">{t(`Disfrutarás todas las funciones ${planLabel}`, `You'll enjoy every ${planLabel} feature`)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{periodEnd ? t(`hasta el ${periodEnd}.`, `until ${periodEnd}.`) : t("hasta el final de tu periodo actual.", "until the end of your current period.")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-positive/15 text-positive"><Check className="h-3 w-3" /></span>
            <div>
              <p className="text-[13px] font-medium text-foreground">{t("Puedes volver a suscribirte más adelante", "You can subscribe again later")}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t("cuando lo necesites.", "whenever you need to.")}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="outline" className="h-auto min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-border bg-elevated/40 px-3 text-center hover:bg-elevated">
              <ShieldCheck className="h-4 w-4 text-positive" />
              <span>
                <span className="block text-xs font-bold">{t("No, mantener", "No, keep it")}</span>
                <span className="mt-1 block text-[10px] font-normal text-muted-foreground">{t(`Seguir con ${planLabel}`, `Stay on ${planLabel}`)}</span>
              </span>
            </Button>
          </DialogClose>
          <Button variant="outline" className="h-auto min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-destructive/30 bg-destructive/5 px-3 text-center text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span>
              <span className="block text-xs font-bold">{t("Sí, cancelar", "Yes, cancel")}</span>
              <span className="mt-1 block text-[10px] font-normal text-destructive/70">{t("Pasar a Free", "Switch to Free")}</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className="group h-auto min-h-20 justify-start gap-3 rounded-xl border border-border bg-elevated/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-elevated disabled:opacity-60"
    >
      <span className="mt-0.5 rounded-lg border border-border bg-background p-1.5 text-muted-foreground group-hover:text-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-medium">
          {label}
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
    </Button>
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
