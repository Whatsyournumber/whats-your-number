import { createFileRoute, redirect } from "@tanstack/react-router";

// URL antigua: la canónica en inglés ahora es /en/finance-for-kids.
export const Route = createFileRoute("/en/finanzas-para-ninos")({
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/en/finance-for-kids" });
  },
});
