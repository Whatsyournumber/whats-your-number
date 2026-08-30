import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { LanguageToggle, useLanguage, useT } from "@/hooks/use-language";
import { useSubscription } from "@/hooks/use-subscription";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { setPendingPromoCode } from "@/lib/pending-promo";
import { getPendingCheckoutPlan } from "@/lib/pending-checkout";
import { startAffiliateWizard } from "@/lib/affiliate-wizard-state";

type AuthSearch = { mode: "login" | "signup"; next?: string; flow?: "affiliate" };

/**
 * Navega al destino guardado. Las rutas con query o punto (p. ej. el
 * consentimiento OAuth `/.lovable/oauth/consent?authorization_id=...`) se
 * resuelven con el navegador porque no forman parte del árbol tipado.
 */
function goNext(
  next: string | undefined,
  fallback: string,
  navigate: (opts: { to: string }) => void,
) {
  if (next && (next.includes("?") || next.includes("."))) {
    window.location.assign(next);
    return;
  }
  navigate({ to: next ?? fallback });
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const rawNext = search["next"];
    // Solo permitimos rutas internas para evitar redirecciones abiertas.
    // Ruta interna relativa (permitimos punto y query para el consentimiento OAuth).
    const next =
      typeof rawNext === "string" &&
      !rawNext.startsWith("//") &&
      /^\/[A-Za-z0-9\-._~/]*(\?[A-Za-z0-9\-._~/=&%]*)?$/.test(rawNext)
        ? rawNext
        : undefined;
    const affiliate = search["flow"] === "affiliate";
    return {
      mode: search["mode"] === "signup" || (affiliate && search["mode"] !== "login") ? "signup" : "login",
      ...(next ? { next } : affiliate ? { next: "/afiliados" } : {}),
      ...(affiliate ? { flow: "affiliate" as const } : {}),
    };
  },

  head: () => ({
    meta: [
      { title: "Sign in — WhatsYournumber" },
      {
        name: "description",
        content: "Inicia sesión o crea tu cuenta de WhatsYournumber / Sign in or create your WhatsYournumber account.",
      },
      { property: "og:title", content: "Sign in — WhatsYournumber" },
      { property: "og:description", content: "Patrimonio, gastos e inversiones con IA en un solo lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.16 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

const SLIDES: { title: [string, string]; body: [string, string] }[] = [
  {
    title: ["Conoce tu número", "Know your number"],
    body: [
      "Descubre cuánto necesitas para alcanzar tu libertad financiera.",
      "Discover exactly how much you need to reach financial freedom.",
    ],
  },
  {
    title: ["Controla tus gastos", "Track your spending"],
    body: [
      "Sube tus estados de cuenta y la IA clasifica todo por ti.",
      "Upload your statements and AI categorizes everything for you.",
    ],
  },
  {
    title: ["Haz crecer tu patrimonio", "Grow your net worth"],
    body: [
      "Portafolio, metas y plan de retiro en un solo lugar.",
      "Portfolio, goals and retirement plan in one place.",
    ],
  },
];

const REVIEWS = [
  {
    initials: "MR",
    name: "Mariana Robles",
    role: ["Fundadora · CDMX", "Founder · Mexico City"] as [string, string],
    quote: [
      "Subí seis meses de estados de cuenta y en minutos vi a dónde se iba realmente mi dinero.",
      "I uploaded six months of statements and in minutes saw where my money was really going.",
    ] as [string, string],
  },
  {
    initials: "CO",
    name: "Camila Ortiz",
    role: ["Médica · Bogotá", "Doctor · Bogotá"] as [string, string],
    quote: [
      "La IA detectó suscripciones que pagaba sin usar. Se pagó sola el primer mes.",
      "The AI detected subscriptions I was paying for without using. It paid for itself in month one.",
    ] as [string, string],
  },
];

function Reviews({ className }: { className?: string }) {
  const tt = useT();
  return (
    <div className={className}>
      {REVIEWS.map((r) => (
        <figure key={r.name} className="surface flex flex-col gap-2 p-4">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, s) => (
              <Star key={s} className="h-3 w-3 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="text-xs leading-relaxed text-muted-foreground">
            “{tt(r.quote[0], r.quote[1])}”
          </blockquote>
          <figcaption className="mt-1 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-[10px] font-semibold text-primary ring-1 ring-border">
              {r.initials}
            </span>
            <span className="text-[11px]">
              <span className="block font-medium text-foreground">{r.name}</span>
              <span className="text-muted-foreground">{tt(r.role[0], r.role[1])}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function SidePanel() {
  const tt = useT();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="relative hidden flex-col justify-between lg:flex">
      <div>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">
          {tt("Tu dinero.", "Your money.")}
          <br />
          {tt("Tu futuro.", "Your future.")}
          <br />
          <span className="text-primary">{tt("Tu número.", "Your number.")}</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {tt(
            "La plataforma todo-en-uno para entender dónde estás y construir tu libertad financiera.",
            "The all-in-one platform to understand where you stand and build your financial freedom.",
          )}
        </p>

        {/* Slider: los 3 puntos clave */}
        <div className="mt-10 max-w-md">
          <div className="surface relative min-h-[120px] p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm font-semibold text-foreground">
                  <span className="mr-2 text-primary">{index + 1}.</span>
                  {tt(slide.title[0], slide.title[1])}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {tt(slide.body[0], slide.body[1])}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="absolute right-4 top-4 flex gap-1">
              <button
                type="button"
                aria-label={tt("Anterior", "Previous")}
                onClick={() => setIndex((index - 1 + SLIDES.length) % SLIDES.length)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={tt("Siguiente", "Next")}
                onClick={() => setIndex((index + 1) % SLIDES.length)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <Reviews className="mt-10 grid max-w-md grid-cols-2 gap-3" />
    </div>
  );
}

function AuthPage() {
  const { mode, next, flow } = Route.useSearch();
  const isAffiliate = flow === "affiliate";
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();
  const { isPatrimonio, loading: subscriptionLoading } = useSubscription();
  const { t } = useLanguage();
  const tt = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [promo, setPromo] = useState("");

  const loading = authLoading || subscriptionLoading;

  // Registro de afiliado: al terminar debe caer directo en los pasos del wizard.
  useEffect(() => {
    if (isAffiliate) startAffiliateWizard();
  }, [isAffiliate]);

  useEffect(() => {
    if (loading || !user) return;
    if (getPendingCheckoutPlan()) {
      navigate({ to: "/precios" });
      return;
    }
    // El plan Familiar siempre entra por la pantalla de perfiles.
    if (isPatrimonio) {
      navigate({ to: "/ninos" });
      return;
    }
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("onboarding_profiles")
        .select("completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      // Cuenta nueva (Free o Pro): siempre pasa primero por el onboarding.
      if (!data?.completed) {
        navigate({ to: "/onboarding" });
        return;
      }
      goNext(next, "/dashboard", navigate);
    })();
    return () => {
      active = false;
    };
  }, [loading, user, isPatrimonio, navigate, next]);


  const setMode = (value: "login" | "signup") =>
    navigate({ to: "/auth", search: (prev) => ({ ...prev, mode: value }) });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (promo.trim()) setPendingPromoCode(promo);
        const pendingCheckout = getPendingCheckoutPlan();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${pendingCheckout ? "/precios" : (next ?? "/onboarding")}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth.toast.signup"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.toast.login"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.toast.error"));
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async () => {
    if (!email.trim()) {
      toast.error(tt("Escribe tu correo primero", "Enter your email first"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(tt("Te enviamos un enlace para cambiarla", "We sent you a link to change it"));
  };

  const onOAuth = async () => {
    if (promo.trim()) setPendingPromoCode(promo);
    setBusy(true);
    try {
      // El helper administrado detecta la URL pública correcta y coordina el
      // popup con la vista previa. Pasar parámetros manuales aquí puede dejar
      // una ventana `about:blank` en navegadores embebidos.
      const result = await lovable.auth.signInWithOAuth("google");
      if (result.error) {
        toast.error(t("auth.toast.oauth"));
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      if (getPendingCheckoutPlan()) navigate({ to: "/precios" });
      else goNext(next, "/dashboard", navigate);
    } catch (error) {
      console.error(error);
      toast.error(t("auth.toast.oauth"));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />

      <div
        className={`relative z-10 grid w-full items-center gap-12 lg:gap-16 ${
          isAffiliate ? "max-w-sm" : "max-w-5xl lg:grid-cols-2"
        }`}
      >
        {!isAffiliate && <SidePanel />}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm justify-self-center lg:justify-self-end"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.back")}
          </Link>
          <LanguageToggle />
        </div>

        <div className="surface p-7">
          {isAffiliate && (
            <div className="mb-6 flex flex-nowrap items-center justify-center gap-x-2">
              {[
                tt("Crea tu cuenta", "Create account"),
                tt("Sobre ti", "About you"),
                tt("Tu link", "Your link"),
                tt("Comparte", "Share"),
              ].map((label, i) => {
                const active = i === 0;
                const done = false;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <span className="h-px w-3 bg-border" />}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active || done ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                    <span
                      className={`text-[10px] ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-col items-center text-center">
            {isAffiliate ? (
              <>
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
                  {tt("Programa de afiliados", "Affiliate program")}
                </span>
                <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight">
                  <span className="bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
                    {mode === "signup"
                      ? tt("Crea tu cuenta de afiliado", "Create your affiliate account")
                      : tt("Entra a tu panel de afiliado", "Sign in to your affiliate panel")}
                  </span>
                </h1>
                <p className="mt-2 whitespace-nowrap text-xs leading-relaxed text-muted-foreground">
                  {tt(
                    "Es gratis · Genera 30% · Dinero pasivo cada mes",
                    "It's free · Earn 30% · Passive income every month",
                  )}
                </p>
              </>
            ) : (
              <>
                <BrandLogo />
                <p className="mt-4 font-display text-lg font-semibold tracking-tight">
                  {mode === "signup" ? t("auth.title.signup") : t("auth.title.login")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "signup" ? t("auth.subtitle.signup") : t("auth.subtitle.login")}
                </p>
              </>
            )}
          </div>



          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-elevated/60 p-1 text-xs">
            {(["login", "signup"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "login" ? t("auth.login") : t("auth.signup")}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
            {mode === "signup" && (
              <div>
                <Label htmlFor="fullName" className="text-xs text-muted-foreground">
                  {t("auth.name")}
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1.5 rounded-xl"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1.5 rounded-xl"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  {t("auth.password")}
                </Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => void onForgot()}
                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {tt("¿Olvidaste tu contraseña?", "Forgot your password?")}
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 rounded-xl"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>


            {mode === "signup" && (
              <div>
                <Label htmlFor="promo" className="text-xs text-muted-foreground">
                  {t("auth.promo.label")}
                </Label>
                <Input
                  id="promo"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.toUpperCase())}
                  className="mt-1.5 rounded-xl uppercase tracking-wide"
                />
              </div>
            )}

            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? t("auth.submit.signup") : t("auth.submit.login")}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{t("auth.or")}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 rounded-full bg-background"
            onClick={() => void onOAuth()}
            disabled={busy}
          >
            <GoogleMark />
            {t("auth.google")}
          </Button>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">{t("auth.legal")}</p>
        </div>

        {!isAffiliate && <Reviews className="mt-6 grid gap-3 sm:grid-cols-2 lg:hidden" />}
      </motion.div>
      </div>
    </div>
  );
}
