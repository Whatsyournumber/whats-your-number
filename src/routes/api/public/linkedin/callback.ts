import { createFileRoute } from "@tanstack/react-router";

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>LinkedIn</title><body style="font-family:system-ui;background:#0b0f14;color:#e6edf3;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center;max-width:520px;padding:24px">${body}</div></body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/linkedin/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

        if (oauthError) return html(`<h2>Autorización cancelada</h2><p>${oauthError}</p>`, 400);
        if (!code || !state) return html("<h2>Faltan parámetros de autorización</h2>", 400);

        const { getConnection, exchangeCode } = await import("@/lib/linkedin.server");
        const conn = await getConnection();
        const stateAt = conn?.oauth_state_at ? Date.parse(conn.oauth_state_at) : 0;
        const fresh = stateAt > 0 && Date.now() - stateAt < 15 * 60 * 1000;
        if (!conn?.oauth_state || conn.oauth_state !== state || !fresh) {
          return html("<h2>Estado de autorización inválido o caducado</h2><p>Vuelve a iniciar la conexión desde el panel.</p>", 400);
        }

        try {
          await exchangeCode(code);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("LinkedIn OAuth exchange failed:", message);
          return html(`<h2>No se pudo completar la conexión</h2><pre style="white-space:pre-wrap;text-align:left">${message}</pre>`, 502);
        }

        return html(
          `<h2>✅ Página de LinkedIn conectada</h2><p>Ya puedes publicar artículos desde el panel de administración.</p><p><a style="color:#4ade80" href="/admin">Volver al panel</a></p>`,
        );
      },
    },
  },
});
