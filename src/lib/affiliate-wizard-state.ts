// Estado global del wizard de afiliado: mientras esté activo, /afiliados se
// muestra a pantalla completa (fuera del dashboard) hasta terminar el paso 5.
import { useSyncExternalStore } from "react";

const KEY = "affiliate_wizard_active";
const listeners = new Set<() => void>();
let active = false;

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1";
}

if (typeof window !== "undefined") active = read();

function emit() {
  listeners.forEach((l) => l());
}

export function startAffiliateWizard() {
  active = true;
  if (typeof window !== "undefined") window.sessionStorage.setItem(KEY, "1");
  emit();
}

export function endAffiliateWizard() {
  active = false;
  if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
  emit();
}

export function useAffiliateWizardActive(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => active,
    () => false,
  );
}
