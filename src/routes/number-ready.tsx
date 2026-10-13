import { createFileRoute } from "@tanstack/react-router";

import { OnboardingPage } from "./onboarding";

// Último paso del onboarding («Tu Número está listo») con URL propia
// para medir la conversión en GA4/GTM. Renderiza la misma pantalla que
// /onboarding, que reanuda el resumen gracias a la marca de sesión.
export const Route = createFileRoute("/number-ready")({
  component: OnboardingPage,
  head: () => {
    const isEn =
      typeof window !== "undefined" && window.localStorage.getItem("yn.lang") === "en";
    return {
      meta: [
        {
          title: isEn
            ? "Your Number is ready | WhatsYournumber"
            : "Tu Número está listo | WhatsYournumber",
        },
        { name: "robots", content: "noindex" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
});
