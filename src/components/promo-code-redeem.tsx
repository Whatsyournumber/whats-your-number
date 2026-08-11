import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { getPaddleEnvironment } from "@/lib/paddle";

type RedeemResult = {
  ok: boolean;
  error?: string;
  product_id?: string;
  until?: string;
};

export function PromoCodeRedeem({ className }: { className?: string }) {
  const t = useT();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const errorText = (key: string) => {
    switch (key) {
      case "invalid_code":
        return t("Ese código no existe o ya no está activo.", "That code doesn't exist or is no longer active.");
      case "expired":
        return t("Ese código ya expiró.", "That code has expired.");
      case "exhausted":
        return t("Ese código ya alcanzó su límite de invitaciones.", "That code reached its invite limit.");
      case "already_redeemed":
        return t("Ya canjeaste este código.", "You already redeemed this code.");
      case "not_authenticated":
        return t("Inicia sesión para canjear un código.", "Sign in to redeem a code.");
      default:
        return t("No pudimos canjear el código.", "We couldn't redeem the code.");
    }
  };

  const redeem = async () => {
    const clean = code.trim();
    if (!clean) return;
    if (!user) {
      toast.error(t("Inicia sesión para canjear un código.", "Sign in to redeem a code."));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("redeem_promo_code", {
        _code: clean,
        _environment: getPaddleEnvironment(),
      });
      if (error) throw error;
      const result = data as unknown as RedeemResult;
      if (!result?.ok) {
        toast.error(errorText(result?.error ?? ""));
        return;
      }
      const until = result.until ? new Date(result.until).toLocaleDateString() : "";
      toast.success(
        t("¡Código activado! Acceso Pro hasta ", "Code activated! Pro access until ") + until,
      );
      setCode("");
      await qc.invalidateQueries();
    } catch {
      toast.error(t("No pudimos canjear el código.", "We couldn't redeem the code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-border/60 bg-card/60 p-5 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{t("¿Tienes un código de invitación?", "Have an invite code?")}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") void redeem();
          }}
          placeholder="PRUEBAGRATIS"
          className="rounded-xl uppercase tracking-wide"
          aria-label={t("Código de invitación", "Invite code")}
        />
        <Button onClick={() => void redeem()} disabled={loading || !code.trim()} className="rounded-xl">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("Canjear", "Redeem")}
        </Button>
      </div>
    </div>
  );
}
