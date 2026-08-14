import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, Baby, Compass, Loader2 } from "lucide-react";

import { BrandMark } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useT } from "@/hooks/use-language";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/elegir")({
  head: () => ({
    meta: [
      { title: "¿Quién eres? — WhatsYournumber" },
      {
        name: "description",
        content:
          "Elige si entras como adulto a WhatsYournumber o si tus hijos entran a My First Number.",
      },
      { property: "og:title", content: "¿Quién eres? — WhatsYournumber" },
      {
        property: "og:description",
        content: "Un acceso para ti y otro para tus hijos: finanzas para toda la familia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChooserPage,
});

function ChooserPage() {
  const { user, loading: authLoading } = useAuth();
  const { isPatrimonio, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const t = useT();

  const loading = authLoading || subscriptionLoading;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    // Esta pantalla de selección de perfiles solo está disponible en el plan Familiar.
    if (!isPatrimonio) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, user, isPatrimonio, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }




  const fullName =
    (user.user_metadata?.['full_name'] as string | undefined) ??
    (user.user_metadata?.['name'] as string | undefined) ??
    user.email?.split("@")[0] ??
    t("Tu cuenta", "Your account");
  const firstName = fullName.split(" ")[0];
  const avatar = user.user_metadata?.['avatar_url'] as string | undefined;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-16">
      <div className="wealth-gradient pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[960px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl text-center"
      >
        <div className="mb-10 flex flex-col items-center gap-4">
          <Link to="/" aria-label="WhatsYourNumber" className="transition-opacity hover:opacity-80">
            <BrandMark className="h-12 w-12" />
          </Link>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {t("¿Quién está usando la app?", "Who's using the app?")}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {t(
              "Elige tu perfil para continuar. Cada uno tiene su propio espacio.",
              "Pick a profile to continue. Each one has its own space.",
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="group flex flex-col items-center gap-4 rounded-3xl border border-border bg-elevated/60 p-8 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-elevated"
          >
            {avatar ? (
              <img
                src={avatar}
                alt={fullName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30">
                <Compass className="h-7 w-7 text-primary" />
              </span>
            )}
            <div>
              <p className="font-display text-lg font-semibold">{firstName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Entrar a WhatsYournumber", "Enter WhatsYournumber")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {t("Continuar", "Continue")} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => void goToKids()}
            className="group flex flex-col items-center gap-4 rounded-3xl border border-border bg-elevated/60 p-8 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-elevated"
          >

            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30">
              <Baby className="h-7 w-7 text-primary" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{t("Hijos", "Kids")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Entrar a My First Number", "Enter My First Number")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {t("Continuar", "Continue")} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
