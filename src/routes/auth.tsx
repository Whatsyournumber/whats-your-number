import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/auth-hero-v4.jpg";
import kidsHeroAsset from "@/assets/kids-auth-family.png.asset.json";
const kidsHeroImg = kidsHeroAsset.url;
import kidDad from "@/assets/kids-review-dad2.jpg";
import kidMom from "@/assets/kids-review-mom2.jpg";
import kidSofia from "@/assets/kids-review-sarah2.jpg";
import reviewCamila from "@/assets/review-camila.jpg";
import reviewCarlos from "@/assets/review-carlos.jpg";
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

type AuthSearch = { mode: "login" | "signup"; next?: string; flow?: "affiliate" | "kids" };

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
    const kids = search["flow"] === "kids";
    return {
      mode: search["mode"] === "signup" || (affiliate && search["mode"] !== "login") ? "signup" : "login",
      ...(next ? { next } : affiliate ? { next: "/afiliados" } : {}),
      ...(affiliate ? { flow: "affiliate" as const } : kids ? { flow: "kids" as const } : {}),
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
    title: ["1. Descubre tu número", "1. Discover your number"],
    body: [
      "Calcula cuánto necesitas para alcanzar tu libertad financiera.",
      "Calculate how much you need to reach financial freedom.",
    ],
  },
  {
    icon: TrendingUp,
    title: ["2. Mira dónde estás", "2. See where you stand"],
    body: [
      "Analiza tus gastos, patrimonio e inversiones en un solo lugar.",
      "Analyze your spending, net worth and investments in one place.",
    ],
  },
  {
    icon: Sparkles,
    title: ["3. Obtén tu plan con IA", "3. Get your AI plan"],
    body: [
      "Recibe próximos pasos personalizados para acercarte a tus metas.",
      "Get personalized next steps to move closer to your goals.",
    ],
  },
];

const REVIEWS = [
  {
    image: reviewCarlos,
    name: "Carlos R.",
    quote: [
      "Por fin puedo hacer tracking de todo mi patrimonio en un solo lugar. Un game changer.",
      "I can finally track all my net worth in one place. A total game changer.",
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

function ReviewCard({ index, variant = "general" }: { index: number; variant?: "general" | "kids" }) {
  const tt = useT();
  const reviews = variant === "kids"
    ? [
        { image: kidMom, name: "Lucía Pérez", quote: ["En un mes entendió el interés compuesto mejor que yo a los 25.", "In a month she understood compound interest better than I did at 25."] as [string, string] },
        { image: kidDad, name: "Andrés Duarte", quote: ["Las tareas dejaron de ser pelea: ahora las hace porque ve subir su número.", "Chores stopped being a fight: he does them because he sees his number go up."] as [string, string] },
        { image: kidSofia, name: "Sarah Mitchell", quote: ["Ahora mi hija sabe el valor del dinero y el esfuerzo de conseguir su bicicleta.", "Now my daughter understands the value of money and the effort behind a new bike."] as [string, string] },
      ]
    : REVIEWS;
  const r = reviews[index % reviews.length] ?? reviews[0];
  if (!r) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.figure
        key={r.name}
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <img
          src={r.image}
          alt={r.name}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-slate-900/10 lg:h-11 lg:w-11 lg:ring-white/20"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-2.5 w-2.5 fill-primary text-primary lg:h-3.5 lg:w-3.5" />
              ))}
            </div>
            <figcaption className="text-[11px] font-medium text-slate-900 lg:text-sm lg:text-white">{r.name}</figcaption>
          </div>
          <blockquote className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600 lg:text-sm lg:leading-relaxed lg:text-white/70">
            “{tt(r.quote[0], r.quote[1])}”
          </blockquote>
        </div>
      </motion.figure>
    </AnimatePresence>
  );
}

const KIDS_POINTS: { icon: typeof Target; title: [string, string]; body: [string, string] }[] = [
  {
    icon: Target,
    title: ["1. Planifica su futuro", "1. Plan their future"],
    body: ["Calcula cuánto tendrá a los 18 para sus grandes sueños.", "See how much they could have by 18 for their biggest dreams."],
  },
  {
    icon: TrendingUp,
    title: ["2. Enseña hábitos", "2. Teach money habits"],
    body: ["Ahorro, mesada e inversión en una experiencia familiar.", "Saving, allowance and investing in one family experience."],
  },
  {
    icon: Sparkles,
    title: ["3. Crecen juntos", "3. Grow together"],
    body: ["Un plan visual para que cada pequeño avance cuente.", "A visual plan that makes every small step count."],
  },
];

function PointsCarousel({ index, onChange, variant = "general" }: { index: number; onChange: (i: number) => void; variant?: "general" | "kids" }) {
  const tt = useT();
  const points = variant === "kids" ? KIDS_POINTS : POINTS;
  const isKids = variant === "kids";
  const divider = isKids ? "divide-border" : "divide-white/10";
  const inactiveIcon = isKids ? "text-muted-foreground/60" : "text-white/40";
  const inactiveTitle = isKids ? "text-muted-foreground" : "text-white/60";
  const body = isKids ? "text-muted-foreground" : "text-white/50";

  return (
    <div>
      <div className={`grid grid-cols-3 divide-x ${divider}`}>
        {points.map((p, i) => {
          const Icon = p.icon;
          const active = i === index;
          return (
            <button
              key={p.title[1]}
              type="button"
              onClick={() => onChange(i)}
              className="flex items-start gap-2.5 px-4 text-left first:pl-0 last:pr-0"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 transition-colors lg:h-5 lg:w-5 ${active ? "text-primary" : inactiveIcon}`} />
              <span className="min-w-0">
                <span className={`block text-xs font-semibold leading-tight transition-colors lg:text-base lg:whitespace-nowrap ${active ? (isKids ? "text-foreground" : "text-white") : inactiveTitle}`}>
                  {tt(p.title[0], p.title[1])}
                </span>
                <span className={`mt-1 block text-[10px] leading-snug lg:text-xs ${body}`}>{tt(p.body[0], p.body[1])}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-1.5">
        {points.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => onChange(i)}
            className={`h-1 rounded-full transition-all ${i === index ? "w-5 bg-primary" : isKids ? "w-1.5 bg-border" : "w-1.5 bg-white/25"}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Panel hero fotográfico (desktop): foto a pantalla completa + puntos + review. */
function SidePanel({ variant = "general" }: { variant?: "general" | "kids" }) {
  const tt = useT();
  const [index, setIndex] = useState(0);
  const points = variant === "kids" ? KIDS_POINTS : POINTS;

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % points.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative hidden h-screen flex-col lg:flex">
      {/* Bloque de texto empujado hacia la parte baja del panel */}
      <div className="relative mt-auto flex flex-col gap-6 p-8 pb-8">
        <div className="w-full">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white xl:text-6xl">
            {variant === "kids" ? tt("Construye", "Build") : tt("Descubre", "Discover")}
            <br />
            <span className="text-primary">{variant === "kids" ? tt("su futuro.", "their future.") : tt("tu número.", "your number.")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 lg:text-xl lg:leading-relaxed">
            {tt(
              variant === "kids"
                ? "Planifica su futuro y enséñale a manejar el dinero desde pequeño."
                : "Toma mejores decisiones hoy para tu libertad financiera mañana.",
              variant === "kids"
                ? "Plan their future and teach them about money from day one."
                : "Make better decisions today for your financial freedom tomorrow.",
            )}
          </p>
        </div>

        {/* Parte de abajo: puntos compactos + review integrada en el fondo */}
        <div className="w-full border-t border-white/10 pt-5">
          <PointsCarousel index={index} onChange={setIndex} variant={variant} />
          <div className="relative isolate mt-5">
            <ReviewCard index={index} variant={variant} />
          </div>

        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const { mode, next, flow } = Route.useSearch();
  const isAffiliate = flow === "affiliate";
  const isKids = flow === "kids";
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();
  const { isPatrimonio, loading: subscriptionLoading } = useSubscription();
  const { t } = useLanguage();
  const tt = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={isKids ? "/finanzas-para-ninos" : "/"}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground lg:text-slate-400 lg:hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.back")}
        </Link>
        <LanguageToggle />
      </div>

      {/* Tarjeta clara: box flotante alto con sombra premium */}
      <div className="flex flex-col rounded-[2rem] bg-white p-7 text-slate-900 shadow-[0_32px_80px_-28px_rgba(0,0,0,0.22)] sm:p-9 lg:max-h-[calc(100vh-6rem)] lg:min-h-[calc(100vh-9rem)] lg:justify-center lg:overflow-y-auto">
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
          {/* Logo dentro del box, justo encima del título, como en mobile */}
          <div className="mb-3 flex justify-center">
            <BrandLogo variant="light" />
          </div>

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
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
                {mode === "signup"
                  ? tt("Crea tu cuenta gratis", "Create your free account")
                  : tt("Bienvenido de vuelta", "Welcome back")}
              </h2>
              <p className="mt-1.5 whitespace-nowrap text-sm leading-relaxed text-slate-500">
                {mode === "signup"
                  ? tt("Todo empieza con un número. Descubre el tuyo.", "Everything starts with a number. Discover yours.")
                  : tt("Sigamos construyendo tu libertad financiera.", "Let's keep building your financial freedom.")}
              </p>
            </>
          )}
        </div>

        {/* Google primero, como en la referencia */}
        <Button
          variant="outline"
          className="mt-5 w-full gap-2 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          onClick={() => void onOAuth()}
          disabled={busy}
        >
          <GoogleMark />
          {tt("Continuar con Google", "Continue with Google")}
        </Button>

        <div className="my-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] text-slate-400">{tt("o continúa con email", "or continue with email")}</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
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
            <Label htmlFor="password" className="text-xs text-slate-500">
              {t("auth.password")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 rounded-xl border-slate-200 bg-white pr-10 text-slate-900 placeholder:text-slate-400"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? tt("Ocultar contraseña", "Hide password") : tt("Mostrar contraseña", "Show password")}
                className="absolute right-2.5 top-1/2 mt-[3px] -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 focus-visible:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "login" && (
              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  onClick={() => void onForgot()}
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  {tt("¿Olvidaste tu contraseña?", "Forgot your password?")}
                </button>
              </div>
            )}
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

          <Button
            type="submit"
            className="mt-1 h-12 w-full gap-2 rounded-2xl text-base font-semibold"
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? tt("Descubre tu número", "Discover your number") : tt("Entrar", "Sign in")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* 3 puntos de confianza, como en la referencia */}
        {mode === "login" ? (
          <div className="mt-4 flex items-center justify-center text-center">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-500">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600" aria-hidden="true">
                <Lock className="h-2.5 w-2.5" />
              </span>
              {tt("Tus datos se guardan de forma privada y cifrada.", "Your data is stored privately and encrypted.")}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex flex-nowrap items-center justify-center divide-x divide-slate-200">
            {[
              tt("Gratis", "Free"),
              tt("Sin tarjeta", "No card"),
              tt("Datos privados", "Private data"),
            ].map((label) => (
              <span key={label} className="flex items-center gap-1.5 whitespace-nowrap px-2 text-[11px] text-slate-500 first:pl-0 last:pr-0 sm:px-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                {label}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
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
    <div className="relative min-h-screen overflow-hidden bg-background lg:grid lg:h-screen lg:grid-cols-[1.65fr_1fr] lg:overflow-hidden">
      {/* Fondo infinito: la foto cubre toda la página, sin cortes ni bordes,
          y pasa por debajo de la tarjeta flotante */}
      <img
        src={isKids ? kidsHeroImg : heroImg}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 hidden w-full lg:block ${
          isKids
            ? "h-[68%] top-[4%] object-contain object-left"
            : "h-[118%] -translate-y-[15%] object-cover object-[left_5%_top_0%]"
        }`}
      />
      {/* Izquierda legible */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-background/70 via-transparent to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-background/90 via-transparent to-background/30 lg:block" />
      {/* Derecha: fundido a oscuro bajo la tarjeta */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-gradient-to-l from-background via-background/70 to-transparent lg:block" />

      <SidePanel variant={isKids ? "kids" : "general"} />

      <div className={`relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10 lg:h-screen lg:min-h-0 lg:bg-transparent lg:px-10 lg:py-6 ${isKids ? "bg-background" : "bg-slate-200"}`}>
        {isKids && <img src={kidsHeroImg} alt={tt("familia aprendiendo sobre dinero", "family learning about money")} className="pointer-events-none absolute inset-x-0 top-0 h-56 w-full object-contain object-top opacity-90 lg:hidden" />}
        {isKids && <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-transparent to-background lg:hidden" />}
        <div className="wealth-gradient pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl lg:hidden" />
        {card}

        {/* Móvil: solo reviews debajo de la tarjeta */}
        <div className="w-full max-w-md px-2 lg:hidden">
          {isKids && <div className="mb-5"><PointsCarousel index={point} onChange={setPoint} variant="kids" /></div>}
          <ReviewCard index={point} variant={isKids ? "kids" : "general"} />
        </div>
      </div>
    </div>
  );
}
