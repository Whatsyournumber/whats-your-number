import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout puro para /en/blog: el head vive en las rutas hoja.
export const Route = createFileRoute("/en/blog")({
  component: () => <Outlet />,
});
