import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { motion } from "motion/react";

import { useLanguage, useT } from "@/hooks/use-language";
import { blogCategories, categoryCount } from "@/lib/blog-categories";

function AnimatedDemoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center ${className}`}>
      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/15 blur-2xl" />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-primary/30"
          initial={{ width: 56, height: 56, opacity: 0.6 }}
          animate={{ width: 96, height: 96, opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, delay: i, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="absolute h-[84px] w-[84px] rounded-full border border-dashed border-primary/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-elevated ring-1 ring-border transition-transform duration-300 group-hover:scale-105"
      >
        <span className="absolute inset-2 rounded-full ring-1 ring-primary/40" />
        <span className="relative font-display text-3xl font-bold leading-none text-primary">?</span>
      </motion.div>
    </div>
  );
}

/** Sticky rail shown to the right of an article: demo CTA + category navigation. */
export function BlogSidebar({ activeCategory }: { activeCategory?: string | undefined }) {
  const t = useT();
  const { lang } = useLanguage();
  const blogHref = lang === "en" ? "/en/blog" : "/blog";
  const demoHref = lang === "en" ? "/en/financial-freedom-calculator?start=1" : "/calculadora-libertad-financiera?start=1";

  return (
    <div className="sticky top-24 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto pr-1">
      <div className="surface p-4">
        {activeCategory === "ninos" ? (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              {t("Demo gratis", "Free demo")}
            </div>
            <p className="mt-3 whitespace-nowrap font-display text-[15px] font-semibold leading-tight">
              {t("El número de tu hijo en 30seg", "Your child's number in 30s")}
            </p>
            <AnimatedDemoLogo className="mt-3" />
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              {t(
                "Calculamos cuánto necesita a los 18 años para ir a cualquier universidad.",
                "We calculate how much they need by age 18 to go to any university.",
              )}
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              {t("Demo gratis", "Free demo")}
            </div>
            <p className="mt-3 whitespace-nowrap font-display text-[15px] font-semibold leading-tight">
              {t("Descubre tu número en 30seg", "Your number in 30s")}
            </p>
            <AnimatedDemoLogo className="mt-3" />
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              {t(
                "El número para retirarte y alcanzar tu libertad financiera antes.",
                "The number to retire and reach financial freedom sooner.",
              )}
            </p>
          </>
        )}

        <a
          href={activeCategory === "ninos" ? "/calculadora-ahorro-universidad?start=1" : demoHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {activeCategory === "ninos"
            ? t("Probar demo para tu hijo", "Try demo for your child")
            : t("Probar ahora gratis", "Try it free now")}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>


      <nav className="surface p-5" aria-label={t("Categorías del blog", "Blog categories")}>
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          <Tag className="h-3.5 w-3.5" /> {t("Categorías", "Categories")}
        </p>
        <ul className="mt-3 space-y-0.5">
          {blogCategories.map((c) => {
            const count = categoryCount(c.id);
            const href = `${blogHref}?cat=${c.id}`;
            return (
              <li key={c.id}>
                <a
                  href={href}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-elevated hover:text-primary ${
                    activeCategory === c.id ? "bg-elevated text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span>{c.label[lang]}</span>
                  {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
