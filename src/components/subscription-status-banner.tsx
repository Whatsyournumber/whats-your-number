import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";

import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";

const daysLeft = (iso: string | null) =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)) : null;

/** Trial countdown and dunning notice. Renders nothing when everything is fine. */
export function SubscriptionStatusBanner({ className }: { className?: string | undefined }) {
  const t = useT();
  const { subscription, isTrial, isPromo, loading } = useSubscription();

  if (loading || !subscription) return null;
  // Accesos por código de invitación no son cancelaciones ni pruebas: sin aviso.
  if (isPromo) return null;

  const days = daysLeft(subscription.current_period_end);


  if (subscription.status === "past_due") {
    return (
      <Banner
        className={className}
        tone="danger"
        icon={AlertTriangle}
        title={t("Pago rechazado", "Payment failed")}
        text={t(
          "No pudimos cobrar tu último pago. Actualiza tu tarjeta para no perder el acceso.",
          "We couldn't take your last payment. Update your card to keep your access.",
        )}
        actionLabel={t("Actualizar tarjeta", "Update card")}
      />
    );
  }

  if (isTrial && days !== null && days <= 14) {
    return (
      <Banner
        className={className}
        tone="info"
        icon={Clock}
        title={
          days <= 0
            ? t("Tu prueba terminó", "Your trial ended")
            : t(`Te quedan ${days} días de Pro gratis`, `${days} days of free Pro left`)
        }
        text={t(
          "Activa un plan para conservar la IA ilimitada, retiro, portafolio y Life Planner.",
          "Pick a plan to keep unlimited AI, retirement, portfolio and Life Planner.",
        )}
        actionLabel={t("Ver planes", "See plans")}
      />
    );
  }

  if (subscription.cancel_at_period_end && days !== null) {
    return (
      <Banner
        className={className}
        tone="info"
        icon={Clock}
        title={t("Suscripción cancelada", "Subscription canceled")}
        text={t(
          `Conservas todas las funciones ${days} días más, hasta el final del periodo pagado.`,
          `You keep every feature for ${days} more days, until the paid period ends.`,
        )}
        actionLabel={t("Ver planes", "See plans")}
      />
    );
  }

  return null;
}

function Banner({
  className,
  tone,
  icon: Icon,
  title,
  text,
  actionLabel,
}: {
  className?: string | undefined;
  tone: "info" | "danger";
  icon: typeof Clock;
  title: string;
  text: string;
  actionLabel: string;
}) {
  const danger = tone === "danger";
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
        danger ? "border-destructive/40 bg-destructive/10" : "border-primary/30 bg-primary/5"
      } ${className ?? ""}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${danger ? "text-destructive" : "text-primary"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
      <Link
        to={danger ? "/suscripcion" : "/precios"}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
      >
        <CreditCard className="h-3.5 w-3.5" />
        {actionLabel}
      </Link>
    </div>
  );
}
