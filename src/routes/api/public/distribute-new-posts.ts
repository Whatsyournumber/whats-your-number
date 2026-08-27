import { createFileRoute } from "@tanstack/react-router";

/**
 * Difusión automática de artículos nuevos.
 * Idempotente: solo envía los artículos que aún no se han difundido.
 * Protegido con el secreto INDEXING_CRON_SECRET (cabecera Authorization: Bearer …
 * o ?token=…), para que lo pueda llamar un cron externo tras cada publicación.
 */
export const Route = createFileRoute("/api/public/distribute-new-posts")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});

async function run(request: Request) {
  const secret = process.env["INDEXING_CRON_SECRET"];
  if (!secret) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("token") ??
    "";
  if (provided !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { distributeNewPosts } = await import("@/lib/indexing.server");
  const result = await distributeNewPosts(false);
  return Response.json({
    distributed: result.newSlugs,
    channels: result.report?.results ?? [],
  });
}
