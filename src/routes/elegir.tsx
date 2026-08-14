import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Acceso histórico al selector de perfiles familiares.
 * Ahora la zona infantil (My First Number) vive en /ninos dentro de esta misma app.
 */
export const Route = createFileRoute("/elegir")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/ninos" });
  },
  component: () => null,
});
