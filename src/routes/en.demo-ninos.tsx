import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

// URL legacy en inglés: redirige a la URL SEO canónica conservando ?start=1.
export const Route = createFileRoute("/en/demo-ninos")({
  validateSearch: demoSearchSchema,
  beforeLoad: ({ search }) => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/en/college-savings-calculator", search });
  },
});
