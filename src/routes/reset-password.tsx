import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nueva contraseña — WhatsYournumber" },
      { name: "description", content: "Define una contraseña nueva para tu cuenta de WhatsYournumber." },
      { property: "og:title", content: "Nueva contraseña — WhatsYournumber" },
      { property: "og:description", content: "Define una contraseña nueva para tu cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("Contraseña actualizada", "Password updated"));
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("No pudimos actualizarla", "We couldn't update it"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="surface w-full max-w-sm p-7">
        <div className="flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-4 font-display text-lg font-semibold tracking-tight">
            {t("Nueva contraseña", "New password")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Escribe tu nueva contraseña para entrar.", "Type your new password to sign in.")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
          <div>
            <Label htmlFor="new-password" className="text-xs text-muted-foreground">
              {t("Contraseña", "Password")}
            </Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Guardar contraseña", "Save password")}
          </Button>
        </form>
      </div>
    </div>
  );
}
