import { useState } from "react";
import { Check, ChevronDown, Minus, Sparkles } from "lucide-react";

import comparePhoto from "@/assets/pricing-compare.jpg";

import { useT } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

type Cell = boolean | "partial" | string;

export function PricingComparison() {
  const t = useT();

  const competitors = ["Monarch Money", "Copilot", "YNAB"];

  const rows: { feature: string; us: Cell; others: Cell[] }[] = [
    {
      feature: t("Tu número de libertad financiera", "Your financial freedom number"),
      us: true,
      others: [false, false, false],
    },
    {
      feature: t("Simulador de retiro por ciudad global", "Retirement simulator by global city"),
      us: true,
      others: [false, false, false],
    },
    {
      feature: t("Asistente de IA con tus datos reales", "AI assistant on your real data"),
      us: true,
      others: ["partial", "partial", false],
    },
    {
      feature: t("Importación de EEFF en PDF con IA", "AI-powered PDF statement import"),
      us: true,
      others: [false, false, false],
    },
    {
      feature: t("Multi-moneda con tasas en tiempo real", "Multi-currency with live rates"),
      us: true,
      others: ["partial", false, "partial"],
    },
    {
      feature: t("Presupuesto 40/40/20 automático", "Automatic 40/40/20 budget"),
      us: true,
      others: ["partial", "partial", true],
    },
    {
      feature: t("Patrimonio neto e inversiones", "Net worth and investments"),
      us: true,
      others: [true, true, false],
    },
    {
      feature: t("Análisis de hipoteca y amortización", "Mortgage and amortization analysis"),
      us: true,
      others: [false, false, false],
    },
    {
      feature: t("Life Planner interactivo", "Interactive Life Planner"),
      us: true,
      others: [false, false, false],
    },
    {
      feature: t("Finanzas para hijos (perfiles familiares)", "Kids' finances (family profiles)"),
      us: true,
      others: ["partial", false, false],
    },
    {
      feature: t("Disponible en español e inglés", "Available in Spanish and English"),
      us: true,
      others: [false, false, false],
    },
    {
      feature: t("Precio desde", "Starting price"),
      us: t("Gratis", "Free"),
      others: ["$14.99/mes", "$13/mes", "$14.99/mes"],
    },
  ];

  return (
    <section className="mt-16">
      <header className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
          {t("Comparativa", "Comparison")}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {t("WhatsYournumber vs. la competencia", "WhatsYournumber vs. the competition")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Otras apps te dicen en qué gastaste. Nosotros te decimos cuánto necesitas para ser libre, y dónde. Miles de personas ya toman decisiones con su número encima de la mesa.",
            "Other apps tell you what you spent. We tell you how much you need to be free, and where. Thousands already make decisions with their number on the table.",
          )}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            t("Tu número, no solo tus gastos", "Your number, not just your spending"),
            t("IA que entiende tu vida", "AI that gets your life"),
            t("Español e inglés", "Spanish and English"),
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-elevated/50 px-3 py-1 text-[11px] text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>
      </header>

      <div className="surface mt-8 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("Funcionalidad", "Feature")}
              </th>
              <th className="relative w-[150px] p-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    <Sparkles className="h-3 w-3" />
                    WhatsYournumber
                  </span>
                </div>
              </th>
              {competitors.map((c) => (
                <th key={c} className="w-[130px] p-4 text-center text-xs font-medium text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.feature} className={cn("border-b border-border/60 last:border-0", i % 2 === 1 && "bg-elevated/30")}>
                <td className="p-4 text-left text-xs font-medium md:text-sm">{row.feature}</td>
                <td className="bg-primary/5 p-4 text-center">
                  <CellValue value={row.us} highlight />
                </td>
                {row.others.map((value, idx) => (
                  <td key={competitors[idx]} className="p-4 text-center">
                    <CellValue value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        {t(
          "Comparativa basada en información pública de cada producto. Actualizada periódicamente.",
          "Comparison based on each product's public information. Updated periodically.",
        )}
      </p>
    </section>
  );
}

function CellValue({ value, highlight }: { value: Cell; highlight?: boolean }) {
  const t = useT();
  if (value === true) {
    return (
      <span
        className={cn(
          "mx-auto flex h-6 w-6 items-center justify-center rounded-full",
          highlight ? "bg-primary/20 text-primary" : "bg-muted/40 text-foreground/70",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-muted/20 text-muted-foreground/50">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === "partial") {
    return <span className="text-[11px] text-muted-foreground">{t("Parcial", "Partial")}</span>;
  }
  return (
    <span className={cn("text-xs font-semibold", highlight ? "text-primary" : "text-muted-foreground")}>{value}</span>
  );
}

export function PricingFaq() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    {
      q: t("¿En qué se diferencia de Monarch o Copilot?", "How is it different from Monarch or Copilot?"),
      a: t(
        "Ellos organizan tu pasado; nosotros calculamos tu futuro. WhatsYournumber te da la cifra exacta que necesitas para vivir de tus ingresos pasivos y te muestra en qué ciudades del mundo ya podrías lograrlo hoy.",
        "They organize your past; we calculate your future. WhatsYournumber gives you the exact figure you need to live off passive income and shows which cities worldwide you could already afford today.",
      ),
    },
    {
      q: t("¿Necesito conectar mi banco?", "Do I need to connect my bank?"),
      a: t(
        "No. Puedes subir tus estados de cuenta en PDF o CSV y nuestra IA los categoriza sola, o introducir tus cifras manualmente en menos de tres minutos.",
        "No. You can upload PDF or CSV statements and our AI categorizes them automatically, or enter your figures manually in under three minutes.",
      ),
    },
    {
      q: t("¿Mis datos están seguros?", "Is my data secure?"),
      a: t(
        "Sí. Cifrado en tránsito y en reposo, aislamiento por usuario a nivel de base de datos y cero venta de datos a terceros. Puedes borrar tu cuenta y todo su contenido cuando quieras.",
        "Yes. Encrypted in transit and at rest, per-user isolation at the database level, and zero data selling. You can delete your account and all its content anytime.",
      ),
    },
    {
      q: t("¿Puedo cambiar o cancelar mi plan?", "Can I change or cancel my plan?"),
      a: t(
        "Cuando quieras, desde tu perfil y en un clic. Sin permanencia ni llamadas de retención. Si cancelas conservas el acceso hasta el final del periodo pagado.",
        "Anytime, from your profile in one click. No lock-in, no retention calls. If you cancel you keep access until the end of the paid period.",
      ),
    },
    {
      q: t("¿Qué incluye el plan Familiar?", "What does the Familiar plan include?"),
      a: t(
        "Todo lo de Pro más perfiles para cada hijo, plan de ahorro e inversión por hijo, simulador de universidad y acceso a My First Number para que aprendan finanzas jugando.",
        "Everything in Pro plus profiles for each child, per-child savings and investment plans, a college simulator and access to My First Number so they learn finance by playing.",
      ),
    },
    {
      q: t("¿Funciona con varias monedas?", "Does it work with multiple currencies?"),
      a: t(
        "Sí. Convertimos automáticamente entre EUR, USD, GBP y más con tasas de mercado en tiempo real, ideal si cobras o inviertes fuera de tu país.",
        "Yes. We automatically convert between EUR, USD, GBP and more with live market rates, ideal if you earn or invest abroad.",
      ),
    },
  ];

  return (
    <section className="mt-16">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <header className="text-center md:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {t("Preguntas frecuentes", "Frequently asked questions")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:mx-0">
              {t(
                "Todo lo que necesitas saber antes de empezar. Si tienes otra duda, escríbenos.",
                "Everything you need to know before starting. If you have another question, write us.",
              )}
            </p>
          </header>

          <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-elevated/30">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-elevated/60"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium">{faq.q}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen ? (
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border lg:sticky lg:top-24">
          <img
            src={comparePhoto}
            alt={t("Pareja revisando sus finanzas en casa", "Couple reviewing their finances at home")}
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full max-h-[420px] w-full object-cover lg:max-h-none lg:min-h-[420px]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-medium">
              {t("\u201cPor fin sé cuándo puedo parar.\u201d", "\u201cI finally know when I can stop.\u201d")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Laura & Diego · Madrid</p>
          </div>
        </div>
      </div>
    </section>
  );
}
