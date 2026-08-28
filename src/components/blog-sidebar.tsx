import { ArrowRight, Sparkles, Tag, Target } from "lucide-react";
import { motion } from "motion/react";

import { useLanguage, useT } from "@/hooks/use-language";
import { blogCategories, categoryCount } from "@/lib/blog-categories";

/** Sticky rail shown to the right of an article: demo CTA + category navigation. */
export function BlogSidebar({ activeCategory }: { activeCategory?: string | undefined }) {
  const t = useT();
  const { lang } = useLanguage();
  const blogHref = lang === "en" ? "/en/blog" : "/blog";

  return (
    <div className="sticky top-24 space-y-5">
      <div className="surface p-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          {t("Demo gratis", "Free demo")}
        </div>
        <p className="mt-3 whitespace-nowrap font-display text-[15px] font-semibold leading-tight">
          {activeCategory === "ninos"
            ? t("Descubre su número en 30seg", "Their number in 30s")
            : t("Descubre tu número en 30seg", "Your number in 30s")}
        </p>
        <img
          src={demoCircle.url}
          alt={t("Demo del número financiero", "Financial number demo")}
          width={200}
          height={200}
          loading="lazy"
          className="mx-auto mt-4 block h-32 w-32 rounded-full object-contain"
        />
        <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
          {t(
            "El número para retirarte y alcanzar tu libertad financiera antes.",
            "The number to retire and reach financial freedom sooner.",
          )}
        </p>



        <a
          href={activeCategory === "ninos" ? "/demo-ninos?start=1" : "/demo?start=1"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {activeCategory === "ninos"
            ? t("Probar demo para tu hijo", "Try demo for your child")
            : t("Probar ahora gratis", "Try it free now")}
          <ArrowRight className="h-4 w-4" />
        </a>
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
