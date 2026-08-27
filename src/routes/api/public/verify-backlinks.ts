import { createFileRoute } from "@tanstack/react-router";

import { verifyBacklinks } from "@/lib/backlinks.server";

/**
 * Verificación periódica de backlinks (cron externo).
 * Requiere el secreto INDEXING_CRON_SECRET en Authorization: Bearer <secreto>.
 */
export const Route = createFileRoute("/api/public/verify-backlinks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INDEXING_CRON_SECRET"];
        const auth = request.headers.get("authorization") ?? "";
        if (!secret || auth !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        const report = await verifyBacklinks();
        return Response.json(report);
      },
    },
  },
});
