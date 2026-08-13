export type PendingCheckoutPlan = "pro" | "familiar";

const STORAGE_KEY = "wyn_pending_checkout_plan";

export function setPendingCheckoutPlan(plan: PendingCheckoutPlan) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, plan);
}

export function getPendingCheckoutPlan(): PendingCheckoutPlan | null {
  if (typeof window === "undefined") return null;
  const plan = window.sessionStorage.getItem(STORAGE_KEY);
  return plan === "pro" || plan === "familiar" ? plan : null;
}

export function clearPendingCheckoutPlan() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}