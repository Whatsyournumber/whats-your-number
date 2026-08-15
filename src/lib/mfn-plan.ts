/**
 * Planes de la zona infantil, resueltos con la suscripción de WhatsYourNumber
 * (misma cuenta, mismo backend). No hay planes ni cobros separados.
 */
import type { Subscription } from "@/hooks/use-subscription";

export type { Subscription };

/** Perfiles de niño permitidos por plan. */
export const KID_LIMITS: Record<string, number> = {
  free: 2,
  pro: 2,
  family: 2,
};

/** Coste mensual de cada perfil adicional a partir del límite incluido. */
export const EXTRA_KID_PRICE_USD = 5;

export function isActive(sub?: Subscription | null): boolean {
  if (!sub) return false;
  const future = sub.current_period_end
    ? new Date(sub.current_period_end).getTime() > Date.now()
    : true;
  if (sub.status === "canceled") return Boolean(sub.current_period_end) && future;
  if (!["active", "trialing", "past_due"].includes(sub.status)) return false;
  return future;
}

/** "free" | "pro" | "family" */
export function activePlan(sub?: Subscription | null): string {
  if (!isActive(sub)) return "free";
  if (sub!.product_id === "patrimonio_plan") return "family";
  if (sub!.product_id === "pro_plan") return "pro";
  return "free";
}

export function kidLimit(sub?: Subscription | null): number {
  return KID_LIMITS[activePlan(sub)] ?? 1;
}

export function planLabel(plan: string, lang: "es" | "en"): string {
  if (plan === "family") return lang === "en" ? "Family" : "Familiar";
  if (plan === "pro") return "Pro";
  return lang === "en" ? "Explorer" : "Explorador";
}
