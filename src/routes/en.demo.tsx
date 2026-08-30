import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

// La URL pública canónica del demo en inglés es /en/financial-freedom-calculator.
export const Route = createFileRoute("/en/demo")({
  validateSearch: demoSearchSchema,
  beforeLoad: ({ search }) => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/en/financial-freedom-calculator", search });
  },
});
