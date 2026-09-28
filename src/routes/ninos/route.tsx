import { createFileRoute, Outlet } from "@tanstack/react-router";
import { I18nProvider } from "@/lib/mfn-i18n";
import { PlanGate } from "@/components/plan-gate";

/** Layout de la zona infantil: idioma propio y pantalla completa (sin sidebar de adultos). */
export const Route = createFileRoute("/ninos")({
  ssr: false,
  component: () => (
    <PlanGate required="patrimonio" blur={false}>
      <I18nProvider>
        <Outlet />
      </I18nProvider>
    </PlanGate>
  ),
});
