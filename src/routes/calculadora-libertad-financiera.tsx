import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const demoSearchSchema = z.object({
  start: z.coerce.number().optional(),
});

// Se conserva la URL descriptiva anterior y se redirige a la URL pública corta.
export const Route = createFileRoute("/calculadora-libertad-financiera")({
  validateSearch: demoSearchSchema,
  beforeLoad: ({ search }) => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: "/demo", search });
  },
});
