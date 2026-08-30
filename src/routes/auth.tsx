import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/auth-hero-v3.jpg";
import reviewCamila from "@/assets/review-camila.jpg";
import reviewMaria from "@/assets/review-maria.jpg";
import reviewMariana from "@/assets/review-mariana.jpg";

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

const POINTS: { icon: typeof Target; title: [string, string]; body: [string, string] }[] = [
  {
    icon: Target,
    title: ["Conoce tu número", "Know your number"],
    body: [
      "Descubre cuánto necesitas para alcanzar tu libertad financiera.",
      "Discover exactly how much you need to reach financial freedom.",
    ],
  },
  {
    icon: TrendingUp,
    title: ["Ve cómo llegar", "See how to get there"],
    body: [
      "Analiza gastos, patrimonio y metas con un plan claro y personalizado.",
      "Analyze spending, net worth and goals with a clear, personal plan.",
    ],
  },
  {
    icon: Sparkles,
    title: ["Decide mejor con IA", "Decide better with AI"],
    body: [
      "Convierte tus números en próximos pasos concretos en segundos.",
      "Turn your numbers into concrete next steps in seconds.",
    ],
  },
];

const REVIEWS = [
  {
    image: reviewMaria,
    name: "María P.",
    quote: [
      "La IA me ha ayudado a tomar mejores decisiones con mi dinero. Totalmente recomendada.",
      "The AI has helped me make better decisions with my money. Totally recommended.",
    ] as [string, string],
  },
  {
    image: reviewMariana,
    name: "Mariana Robles",
    quote: [
      "Subí seis meses de estados de cuenta y en minutos vi a dónde se iba realmente mi dinero.",
      "I uploaded six months of statements and in minutes saw where my money was really going.",
    ] as [string, string],
  },
  {
    image: reviewCamila,
    name: "Camila Ortiz",
    quote: [
      "La IA detectó suscripciones que pagaba sin usar. Se pagó sola el primer mes.",
      "The AI detected subscriptions I was paying for without using. It paid for itself in month one.",
    ] as [string, string],
  },
];

function ReviewCard({ index, light }: { index: number; light?: boolean }) {
  const tt = useT();
  const r = REVIEWS[index % REVIEWS.length] ?? REVIEWS[0]!;

  return (
    <AnimatePresence mode="wait">
      <motion.figure
        key={r.name}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-4 ${light ? "rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm" : ""}`}
      >
        <img
          src={r.image}
          alt={r.name}
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/20"
        />
        <div className="min-w-0">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, s) => (
              <Star key={s} className="h-3 w-3 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className={`mt-1.5 text-xs leading-relaxed ${light ? "text-white/80" : "text-white/75"}`}>
            “{tt(r.quote[0], r.quote[1])}”
          </blockquote>
          <figcaption className={`mt-1 text-[11px] font-medium ${light ? "text-white" : "text-white"}`}>
            {r.name}
          </figcaption>
        </div>
      </motion.figure>
    </AnimatePresence>
  );
}

function PointsCarousel({
  index,
  onChange,
  light,
}: {
  index: number;
  onChange: (i: number) => void;
  light?: boolean;
}) {
  const tt = useT();
  const prev = () => onChange((index - 1 + POINTS.length) % POINTS.length);
  const next = () => onChange((index + 1) % POINTS.length);

  return (
    <div className={`rounded-3xl p-5 ${light ? "border border-white/10 bg-black/20 backdrop-blur-sm" : ""}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={prev}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className={`grid flex-1 grid-cols-3 ${light ? "divide-x divide-white/10" : "divide-x divide-white/10"}`}>
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            const active = i === index;
            return (
              <button
                key={p.title[1]}
                type="button"
                onClick={() => onChange(i)}
                className="flex flex-col items-center gap-1.5 px-2 text-center"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-primary" : light ? "text-white/40" : "text-white/40"
                  }`}
                />
                <span
                  className={`text-xs font-semibold transition-colors ${
                    active ? "text-white" : "text-white/60"
                  }`}
                >
                  {tt(p.title[0], p.title[1])}
                </span>
                <span
                  className={`text-[11px] leading-snug text-white/55 ${active ? "" : "hidden sm:block"}`}
                >
                  {tt(p.body[0], p.body[1])}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={next}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {POINTS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => onChange(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-primary" : "w-1.5 bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Panel hero fotográfico (desktop): foto a pantalla completa + puntos + review. */
function SidePanel() {
  const tt = useT();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % POINTS.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative hidden min-h-screen flex-col justify-between lg:flex">
      <div className="relative p-10">
        <BrandLogo />
      </div>

      <div className="relative flex flex-col gap-8 p-10 pt-0">
        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white xl:text-6xl">
            {tt("Tu dinero.", "Your money.")}
            <br />
            {tt("Tu futuro.", "Your future.")}
            <br />
            <span className="text-primary">{tt("Tu número.", "Your number.")}</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            {tt(
              "La plataforma todo-en-uno para entender dónde estás y construir tu libertad financiera.",
              "The all-in-one platform to understand where you stand and build your financial freedom.",
            )}
          </p>
        </div>

        <div className="max-w-xl">
          <PointsCarousel index={index} onChange={setIndex} light />
        </div>

        <div className="max-w-md">
          <ReviewCard index={index} light />
        </div>

        <p className="flex items-center gap-2 text-[11px] text-white/60">
          <Lock className="h-3.5 w-3.5 text-primary" />
          {tt("Tus datos son privados y cifrados.", "Your data is private and encrypted.")}
        </p>
      </div>
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
  const [point, setPoint] = useState(0);

  const loading = authLoading || subscriptionLoading;

  // Registro de afiliado: al terminar debe caer directo en los pasos del wizard.
  useEffect(() => {
    if (isAffiliate) startAffiliateWizard();
  }, [isAffiliate]);

  useEffect(() => {
    const id = window.setInterval(() => setPoint((i) => (i + 1) % POINTS.length), 5000);
    return () => window.clearInterval(id);
  }, []);

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

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md"
    >
      <div className="mb-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground lg:text-slate-400 lg:hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.back")}
        </Link>
        <LanguageToggle />
      </div>

      {/* Tarjeta clara: box flotante con sombra premium */}
      <div className="rounded-[2rem] bg-white p-7 text-slate-900 shadow-[0_32px_80px_-28px_rgba(0,0,0,0.22)] sm:p-9">
        {isAffiliate && (
          <div className="mb-6 flex flex-nowrap items-center justify-center gap-x-2">
            {[
              tt("Crea tu cuenta", "Create account"),
              tt("Sobre ti", "About you"),
              tt("Tu link", "Your link"),
              tt("Comparte", "Share"),
            ].map((label, i) => {
              const active = i === 0;
              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-3 bg-slate-200" />}
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary" : "bg-slate-300"}`} />
                  <span className={`text-[10px] ${active ? "font-medium text-slate-900" : "text-slate-400"}`}>
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
                {mode === "signup"
                  ? tt("Crea tu cuenta de afiliado", "Create your affiliate account")
                  : tt("Entra a tu panel de afiliado", "Sign in to your affiliate panel")}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {tt("Es gratis · Genera 30% · Dinero pasivo cada mes", "It's free · Earn 30% · Passive income every month")}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                {mode === "signup"
                  ? tt("Crea tu cuenta gratis", "Create your free account")
                  : tt("Bienvenido de vuelta", "Welcome back")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {tt(
                  "Tu futuro financiero empieza conociendo tu número.",
                  "Your financial future starts by knowing your number.",
                )}
              </p>
            </>
          )}
        </div>

        {/* Google primero, como en la referencia */}
        <Button
          variant="outline"
          className="mt-6 w-full gap-2 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          onClick={() => void onOAuth()}
          disabled={busy}
        >
          <GoogleMark />
          {tt("Continuar con Google", "Continue with Google")}
        </Button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] text-slate-400">{tt("o continúa con email", "or continue with email")}</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <Label htmlFor="fullName" className="text-xs text-slate-500">
                {t("auth.name")}
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tt("Tu nombre", "Your name")}
                className="mt-1.5 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-xs text-slate-500">
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="mt-1.5 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password" className="text-xs text-slate-500">
                {t("auth.password")}
              </Label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => void onForgot()}
                  className="text-xs text-primary underline-offset-2 hover:underline"
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
              className="mt-1.5 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {mode === "signup" && (
            <div>
              <Label htmlFor="promo" className="text-xs text-slate-500">
                {t("auth.promo.label")}
              </Label>
              <Input
                id="promo"
                value={promo}
                onChange={(e) => setPromo(e.target.value.toUpperCase())}
                className="mt-1.5 rounded-xl border-slate-200 bg-white uppercase tracking-wide text-slate-900 placeholder:text-slate-400"
              />
            </div>
          )}

          <Button type="submit" className="w-full rounded-xl" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signup" ? t("auth.submit.signup") : tt("Entrar", "Sign in")}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <>
              {tt("¿Aún no tienes cuenta?", "Don't have an account yet?")}{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {tt("Crear cuenta gratis", "Create free account")} <ArrowRight className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              {tt("¿Ya tienes cuenta?", "Already have an account?")}{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {tt("Entrar", "Sign in")} <ArrowRight className="h-3 w-3" />
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-[11px] text-slate-400">{t("auth.legal")}</p>
      </div>
    </motion.div>
  );

  if (isAffiliate) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
        <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl" />
        <div className="relative z-10">{card}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.55fr_1fr]">
      <SidePanel />

      <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-slate-200 px-6 py-10 lg:px-10">
        <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl lg:hidden" />
        {card}

        {/* Móvil: puntos + review debajo de la tarjeta */}
        <div className="w-full max-w-md space-y-6 lg:hidden">
          <PointsCarousel index={point} onChange={setPoint} light />
          <ReviewCard index={point} light />
        </div>
      </div>
    </div>
  );
}
