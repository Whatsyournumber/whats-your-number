import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Instagram,
  LayoutDashboard,
  Linkedin,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";

import { BrandMark } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, useT } from "@/hooks/use-language";

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/whatis.your.number/" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/107005182/" },
];

/**
 * Cielo estrellado determinista. Las cifras se redondean a 2 decimales para que
 * servidor y cliente generen exactamente el mismo string y no haya mismatch de hidratación.
 */
const STARS = Array.from({ length: 28 }, (_, i) => {
  const round2 = (x: number) => Number(x.toFixed(2));
  const frac = (x: number) => x - Math.floor(x);
  const a = frac(Math.sin(i * 12.9898) * 43758.5453);
  const b = frac(Math.sin(i * 78.233) * 12345.6789);
  const c = frac(Math.sin(i * 39.425) * 24634.6345);
  return {
    top: round2(3 + a * 84),
    left: round2(2 + b * 96),
    size: round2(1.5 + c * 2.5),
    delay: round2(a * 6),
    duration: round2(3.2 + b * 4.5),
  };
});

export function NotFoundPage({ onRetry }: { onRetry?: () => void } = {}) {
  const t = useT();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const homeHref = lang === "en" ? "/en" : "/";
  const blogHref = lang === "en" ? "/en/blog" : "/blog";
  const demoHref =
    lang === "en" ? "/en/financial-freedom-calculator?start=1" : "/calculadora-libertad-financiera?start=1";

  const quickLinks = [
    ...(user ? [{ to: "/dashboard", icon: LayoutDashboard, label: t("Mi dashboard", "My dashboard") }] : []),
    { to: demoHref, icon: Calculator, label: t("Calcular mi número", "Calculate my number") },
    { to: "/precios", icon: Tag, label: t("Precios", "Pricing") },
    { to: blogHref, icon: BookOpen, label: t("Blog", "Blog") },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-14">
      {/* El faro barre la noche mientras las estrellas respiran. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="wyn-beam" />
        {STARS.map((star, i) => (
          <span
            key={i}
            className="wyn-star"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
      </div>

      <main className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur sm:text-[11px]"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {onRetry ? t("Algo falló", "Something went wrong") : t("Página no encontrada", "Page not found")}
        </motion.span>

        {/* El cero es el faro: él te trae de vuelta. */}
        <motion.h1
          aria-label="404"
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.32, 0.72, 0, 1] }}
          className="mt-5 flex items-center justify-center gap-[0.03em] font-display text-[6rem] font-bold leading-[0.82] tracking-tighter text-foreground sm:text-[8rem]"
        >
          <span>4</span>
          <span
            aria-hidden="true"
            className="relative grid h-[0.78em] w-[0.78em] place-items-center rounded-full bg-primary/5 ring-1 ring-primary/25"
          >
            <span className="wyn-halo absolute inset-0 rounded-full bg-primary/30 blur-2xl" />
            <BrandMark className="relative h-[0.48em] w-[0.48em]" />
          </span>
          <span>4</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="mt-5"
        >
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {onRetry
              ? t("Esta página no cargó.", "This page didn't load.")
              : t("Este número no estaba en tu plan.", "This number wasn't in your plan.")}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {onRetry
              ? t(
                  "Algo falló de nuestro lado. Puedes reintentar o volver al inicio.",
                  "Something went wrong on our end. You can retry or go back home.",
                )
              : t(
                  "El enlace se movió o nunca existió. El faro te lleva de vuelta a lo que sí importa.",
                  "The link moved or never existed. The lighthouse takes you back to what matters.",
                )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="mt-8 flex w-full flex-col items-center gap-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform duration-200 hover:scale-[1.03] active:scale-100"
              >
                <RotateCcw className="h-4 w-4" />
                {t("Reintentar", "Try again")}
              </button>
            ) : null}
            <Link
              to={homeHref}
              className={
                onRetry
                  ? "group inline-flex items-center gap-2 rounded-full border border-border bg-elevated/60 px-7 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-primary/40"
                  : "group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform duration-200 hover:scale-[1.03] active:scale-100"
              }
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              {t("Volver al inicio", "Back to home")}
            </Link>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={label}
                to={to}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </motion.div>

        {/* Si algo falló, las redes y el correo siguen abiertos. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38, ease: [0.32, 0.72, 0, 1] }}
          className="mt-10 w-full max-w-md"
        >
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 sm:text-[11px]">
              {t("¿Crees que algo falló?", "Think something broke?")}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t(
              "Cuéntanos qué buscabas y lo arreglamos.",
              "Tell us what you were looking for and we'll fix it.",
            )}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-muted-foreground ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:ring-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
