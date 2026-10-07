import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { NotFoundPage } from "@/components/not-found-page";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Cualquier error o página inexistente usa la 404 de la marca.
    defaultErrorComponent: ({ reset }) => (
      <NotFoundPage onRetry={() => { router.invalidate(); reset(); }} />
    ),
    defaultNotFoundComponent: () => <NotFoundPage />,
  });

  return router;
};
