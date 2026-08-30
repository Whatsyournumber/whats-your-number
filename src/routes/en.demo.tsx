import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

// URL corta legacy: redirige a la URL SEO canónica en inglés conservando ?start=1.
export const Route = createFileRoute("/en/demo")({
  validateSearch: demoSearchSchema,
  beforeLoad: ({ search }) => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/en/financial-freedom-calculator", search });
  },
});
