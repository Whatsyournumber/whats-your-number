import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Tag } from "lucide-react";
import demoNinosCard from "@/assets/blog/demo-ninos-card.png.asset.json";

import { useLanguage, useT } from "@/hooks/use-language";
import { blogCategories, categoryCount } from "@/lib/blog-categories";

/** Sticky rail shown to the right of an article: demo CTA + category navigation. */
export function BlogSidebar({ activeCategory }: { activeCategory?: string | undefined }) {
  const t = useT();
  const { lang } = useLanguage();
  const blogHref = lang === "en" ? "/en/blog" : "/blog";

  return (
    <div className="sticky top-24 space-y-5">
      <div className="surface glow p-6">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> {t("Demo gratis", "Free demo")}
        </p>
        <p className="mt-3 font-display text-base font-semibold leading-snug">
          {activeCategory === "ninos"
            ? t(
                "Calcula el número de tu hijo en 3 minutos",
                "Calculate your child's number in 3 minutes",
              )
            : t("Calcula tu número en 3 minutos", "Calculate your number in 3 minutes")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {activeCategory === "ninos"
            ? t(
                "Proyecta cuánto tendrá a los 18 años si inviertes una cantidad fija cada mes en el S&P 500 (10% anual). Ves el capital final, los años de crecimiento y el esfuerzo mensual que necesitas. Sin tarjeta.",
                "Project what they'll have at 18 if you invest a fixed amount each month in the S&P 500 (10% a year). See the final capital, the years of growth and the monthly effort needed. No card required.",
              )
            : t(
                "Patrimonio, runway y años hasta tu libertad financiera. Sin tarjeta.",
                "Net worth, runway and years to financial freedom. No card required.",
              )}
        </p>
        <a
          href={activeCategory === "ninos" ? "/demo-ninos?start=1" : "/demo?start=1"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {activeCategory === "ninos"
            ? t("Hacer el demo para tu hijo", "Try the demo for your child")
            : t("Hacer el demo", "Try the demo")}{" "}
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {t("Crear cuenta gratis", "Create free account")}
        </Link>
      </div>

      <nav className="surface p-6" aria-label={t("Categorías del blog", "Blog categories")}>
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          <Tag className="h-3.5 w-3.5" /> {t("Categorías", "Categories")}
        </p>
        <ul className="mt-4 space-y-1">
          {blogCategories.map((c) => {
            const count = categoryCount(c.id);
            const href = `${blogHref}?cat=${c.id}`;
            return (
              <li key={c.id}>
                <a
                  href={href}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-elevated hover:text-primary ${
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
