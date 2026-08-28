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
      <div className="surface overflow-hidden">
        {activeCategory === "ninos" && (
          <a
            href="/demo-ninos?start=1"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={demoNinosCard.url}
              alt={t(
                "Vista previa del demo: el número de tu hijo a los 18 años",
                "Demo preview: your child's number at 18",
              )}
              loading="lazy"
              className="aspect-[5/4] w-full object-cover opacity-90 transition-opacity hover:opacity-100"
            />
          </a>
        )}
        <div className="p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {t("Demo gratis", "Free demo")}
          </p>
          <p className="mt-2 font-display text-[15px] font-semibold leading-snug">
            {activeCategory === "ninos"
              ? t(
                  "Calcula el número de tu hijo en 3 minutos",
                  "Calculate your child's number in 3 minutes",
                )
              : t("Calcula tu número en 3 minutos", "Calculate your number in 3 minutes")}
          </p>
          <ul className="mt-3 space-y-1.5">
            {(activeCategory === "ninos"
              ? [
                  t("Capital final a los 18 años", "Final capital at age 18"),
                  t("Aporta fijo cada mes al 10% anual", "Fixed monthly input at 10% a year"),
                  t("Sin tarjeta · 3 preguntas", "No card · 3 questions"),
                ]
              : [
                  t("Patrimonio y runway al instante", "Net worth and runway instantly"),
                  t("Años hasta tu libertad financiera", "Years to financial freedom"),
                  t("Sin tarjeta · 3 preguntas", "No card · 3 questions"),
                ]
            ).map((line) => (
              <li key={line} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
          <a
            href={activeCategory === "ninos" ? "/demo-ninos?start=1" : "/demo?start=1"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {activeCategory === "ninos"
              ? t("Hacer el demo para tu hijo", "Try the demo for your child")
              : t("Hacer el demo", "Try the demo")}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-2 inline-flex w-full items-center justify-center text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {t("Crear cuenta gratis", "Create free account")}
          </Link>
        </div>
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
