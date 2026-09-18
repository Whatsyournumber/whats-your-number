import { createFileRoute } from "@tanstack/react-router";

import { NotFoundPage } from "@/components/not-found-page";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
  head: () => ({
    meta: [
      { title: "Página no encontrada | WhatsYournumber" },
      {
        name: "description",
        content:
          "Esta página no existe. Vuelve al inicio de WhatsYournumber y sigue construyendo tu número de libertad financiera.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
});
