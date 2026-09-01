/**
 * Planes de la zona infantil, resueltos con la suscripción de WhatsYourNumber
 * (misma cuenta, mismo backend). No hay planes ni cobros separados.
 */
import type { Subscription } from "@/hooks/use-subscription";

export type { Subscription };

/** Perfiles de niño permitidos por plan (cuando no aplica el cupo familiar). */
export const KID_LIMITS: Record<string, number> = {
  free: 2,
  pro: 2,
  family: 2,
};

/**
 * Plan Familiar: 3 perfiles en total contando adultos e hijos.
 * Ej. 2 adultos + 1 hijo, o 1 adulto + 2 hijos. El 4º perfil se paga aparte.
 */
export const FAMILY_TOTAL_SEATS = 3;

/** Coste mensual de cada perfil adicional a partir del límite incluido (tier standard). */
export const EXTRA_KID_PRICE_USD = 3;

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

/**
 * Perfiles de niño disponibles.
 * En el plan Familiar el cupo es compartido con los adultos: 3 en total.
 */
export function kidLimit(sub?: Subscription | null, parentCount = 1): number {
  const plan = activePlan(sub);
  if (plan === "family") {
    return Math.max(1, FAMILY_TOTAL_SEATS - Math.max(1, parentCount));
  }
  return KID_LIMITS[plan] ?? 1;
}

export function planLabel(plan: string, lang: "es" | "en"): string {
  if (plan === "family") return lang === "en" ? "Family" : "Familiar";
  if (plan === "pro") return "Pro";
  return lang === "en" ? "Explorer" : "Explorador";
}
