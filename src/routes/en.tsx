import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout puro para /en: el head (canonical/hreflang) vive en las rutas hoja
// para evitar canonicals duplicadas y conflictos de hreflang en /en/*.
export const Route = createFileRoute("/en")({
  component: () => <Outlet />,
});
