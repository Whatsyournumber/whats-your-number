import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/hooks/use-language";
import { getPaddleEnvironment } from "@/lib/paddle";
import { setPendingDiscount } from "@/lib/pending-discount";
import { lookupDiscountCode, redeemPromoCode } from "@/lib/promo.functions";


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
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<string | null>(null);

  const closeConfirmation = () => {
    setActivatedPlan(null);
    void navigate({ to: "/dashboard" });
  };

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
      // Primero: ¿es un descuento de pago (ej. 30%)? Entonces va al checkout.
      try {
        const discount = (await lookupDiscountCode({
          data: { code: clean, environment: getPaddleEnvironment() },
        })) as { ok: boolean; code?: string; label?: string };
        if (discount?.ok && discount.code) {
          setPendingDiscount({ code: discount.code, label: discount.label ?? "" });
          setCode("");
          toast.success(
            t(
              `Descuento ${discount.label} listo. Elige tu plan para pagar con descuento.`,
              `${discount.label} discount ready. Pick your plan to pay with the discount.`,
            ),
          );
          navigate({ to: "/precios" });
          return;
        }
      } catch {
        // seguimos con el canje clásico
      }

      const result = (await redeemPromoCode({
        data: { code: clean, environment: getPaddleEnvironment() },
      })) as RedeemResult;
      if (!result?.ok) {
        toast.error(errorText(result?.error ?? ""));
        return;
      }

      setCode("");
      setActivatedPlan(result.product_id === "patrimonio_plan" ? "Familiar" : "Pro");
      void qc.invalidateQueries({ queryKey: ["subscription"] });
    } catch {
      toast.error(t("No pudimos canjear el código.", "We couldn't redeem the code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <section className={`rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:p-5 ${className ?? ""}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_minmax(320px,1.3fr)] lg:items-center">
        <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium">{t("¿Tienes un código de invitación?", "Have an invite code?")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("Activa los beneficios asociados a tu código.", "Unlock the benefits linked to your code.")}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") void redeem();
          }}
          placeholder={t("Ingresa tu código", "Enter your invite code")}
          className="h-11 rounded-xl bg-background/60 uppercase tracking-wide"
          aria-label={t("Código de invitación", "Invite code")}
        />
        <Button onClick={() => void redeem()} disabled={loading || !code.trim()} className="h-11 rounded-xl px-6">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("Canjear", "Redeem")}
        </Button>
      </div>
      </div>
    </section>
    <Dialog open={activatedPlan !== null} onOpenChange={(open) => { if (!open) closeConfirmation(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Gift className="h-6 w-6" />
        </div>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>{t("¡Código aplicado!", "Code applied!")}</DialogTitle>
          <DialogDescription>
            {t(`Ahora puedes disfrutar de tu plan ${activatedPlan ?? "Pro"}.`, `You can now enjoy your ${activatedPlan ?? "Pro"} plan.`)}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={closeConfirmation} className="w-full">
          {t("Ir al inicio", "Go to dashboard")}
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}
