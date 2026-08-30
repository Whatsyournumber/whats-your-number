import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

// URL SEO anterior: se conserva como redirección hacia la URL inglesa corta.
export const Route = createFileRoute("/en/financial-freedom-calculator")({
  validateSearch: demoSearchSchema,
  beforeLoad: ({ search }) => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/en/demo", search });
  },
});
