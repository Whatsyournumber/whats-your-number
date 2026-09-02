import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";

/** Bienvenida tras un checkout exitoso (?checkout=success). */
export function CheckoutWelcome() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { tier } = useSubscription();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    setOpen(true);
    params.delete("checkout");
    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);

    // The Paddle webhook can land a few seconds after the redirect, so keep
    // refreshing the subscription until the new plan shows up.
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      void qc.invalidateQueries({ queryKey: ["subscription"] });
      if (tries >= 10) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [qc]);

  const planName = tier === "patrimonio" ? "Patrimonio" : "Pro";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card/90 p-8 text-center shadow-2xl backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("Cerrar", "Close")}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
              {t(`Bienvenido a ${planName}`, `Welcome to ${planName}`)}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                "Tu pago se confirmó y todas las funciones premium ya están activas: IA ilimitada, retiro, portafolio, Life Planner y Your next city.",
                "Your payment is confirmed and every premium feature is now active: unlimited AI, retirement, portfolio, Life Planner and Your next city.",
              )}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => setOpen(false)}>{t("Ir a mi dashboard", "Go to my dashboard")}</Button>
              <Button variant="ghost" asChild onClick={() => setOpen(false)}>
                <Link to="/advisor">{t("Probar el Asistente IA", "Try the AI Assistant")}</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
