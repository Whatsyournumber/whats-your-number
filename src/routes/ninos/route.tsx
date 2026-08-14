import { createFileRoute, Outlet } from "@tanstack/react-router";
import { I18nProvider } from "@/lib/mfn-i18n";

/** Layout de la zona infantil: idioma propio y pantalla completa (sin sidebar de adultos). */
export const Route = createFileRoute("/ninos")({
  ssr: false,
  component: () => (
    <I18nProvider>
      <Outlet />
    </I18nProvider>
  ),
});
