import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: Error | null }>;
};
type RedirectPayload = { redirect_url?: string; redirect_to?: string };
type AuthorizationDetails = RedirectPayload & { client?: { name?: string } };

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // El cliente lee la sesión desde localStorage: no existe en el paso SSR.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { mode: "login" as const, next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">
        No pudimos cargar esta solicitud de autorización / Could not load this authorization request:{" "}
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "una aplicación / an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-elevated/60 p-8 shadow-xl backdrop-blur">
        <BrandLogo className="mb-6" />
        <h1 className="text-xl font-semibold text-foreground">
          Conectar {clientName} con tu cuenta
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta aplicación podrá leer tu perfil financiero, tu patrimonio, tus objetivos y tus gastos, y crear
          nuevos objetivos en tu nombre.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          This app will be able to read your financial profile, wealth, goals and expenses, and create new goals as you.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => void decide(true)}>
            Aprobar / Approve
          </Button>
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => void decide(false)}>
            Rechazar / Deny
          </Button>
        </div>
      </div>
    </main>
  );
}
