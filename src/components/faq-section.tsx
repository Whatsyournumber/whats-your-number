import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useT } from "@/hooks/use-language";
import type { LandingFaq } from "@/lib/landing-faqs";

interface FaqSectionProps {
  faqs: LandingFaq[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  variant?: "default" | "kids";
}

export function FaqSection({
  faqs,
  eyebrow,
  title,
  subtitle,
  variant = "default",
}: FaqSectionProps) {
  const t = useT();
  const accent = variant === "kids" ? "text-kid-mint" : "text-primary";

  return (
    <section className="mt-24 md:mt-32">
      <div className="mb-10 text-center">
        <span className={`text-xs font-medium uppercase tracking-wider ${accent}`}>
          {eyebrow ?? t("Preguntas frecuentes", "FAQ")}
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {title ?? t("Todo lo que necesitas saber", "Everything you need to know")}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2 md:gap-6">
        {[faqs.slice(0, Math.ceil(faqs.length / 2)), faqs.slice(Math.ceil(faqs.length / 2))].map(
          (column, colIndex) => (
            <Accordion
              key={colIndex}
              type="single"
              collapsible
              className="surface flex h-full flex-col divide-y divide-border rounded-2xl p-2 md:p-4"
            >
              {column.map((f, i) => {
                const index = colIndex * Math.ceil(faqs.length / 2) + i;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                  >
                    <AccordionItem value={`item-${index}`} className="border-b-0 px-2 md:px-3">
                      <AccordionTrigger className="text-left text-sm font-medium text-foreground md:text-base whitespace-nowrap">
                        {t(f.q.es, f.q.en)}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {t(f.a.es, f.a.en)}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                );
              })}
            </Accordion>
          ),
        )}
      </div>
    </section>
  );
}
