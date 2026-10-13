import { createFileRoute, redirect } from "@tanstack/react-router";

// URL del último paso del onboarding (se usa para medir la conversión).
// La pantalla la renderiza /onboarding; esta ruta solo cubre recargas
// y visitas directas llevando al onboarding, que reanuda el resumen.
export const Route = createFileRoute("/number-ready")({
  beforeLoad: () => {
    throw redirect({ to: "/onboarding", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Tu Número está listo | WhatsYournumber" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
