import { getPost } from "@/lib/blog-posts";

export type Lang = "es" | "en";

type SeoEntry = {
  title: { es: string; en: string };
  description: { es: string; en: string };
};

/**
 * Per-article SEO metadata.
 * Rules: title <= 55 chars (same value used for og:title / twitter:title),
 * description <= 155 chars, both built around the article's main keyword.
 */
export const blogSeo: Record<string, SeoEntry> = {
  "boring-business-comprar-libertad-financiera": {
    title: {
      es: "Boring business: 5 negocios para tu libertad",
      en: "Boring Business: 5 to Buy for Financial Freedom",
    },
    description: {
      es: "Los 5 boring business que puedes comprar con poco capital: inversión inicial, rentabilidad mensual y cómo automatizarlos con IA para tu libertad.",
      en: "The 5 boring businesses you can buy with little capital: upfront cost, monthly profit and how to automate them with AI to reach financial freedom.",
    },
  },
  "100k-hijo-18-anos-sp500": {
    title: {
      es: "100.000 € para tu hijo a los 18 con el S&P 500",
      en: "Investing for Kids: $100k by 18 in the S&P 500",
    },
    description: {
      es: "Cuánto invertir al mes en el S&P 500 para que tu hijo tenga 100.000 € a los 18 años: tablas por edad, rentabilidad histórica y errores a evitar.",
      en: "How much to invest monthly in the S&P 500 so your child has $100k by 18: tables by starting age, historical returns and mistakes to avoid.",
    },
  },
  "rico-vs-adinerado": {
    title: {
      es: "Ser rico vs ser adinerado: cuánto necesitas",
      en: "Rich vs Wealthy: How Much You Really Need",
    },
    description: {
      es: "Diferencia entre ser rico y ser adinerado, cuánto capital necesitas según tu nivel de vida y cómo invertirlo para dejar de pensar en dinero.",
      en: "The difference between rich and wealthy, how much capital you need for your lifestyle and how to invest it so you stop thinking about money.",
    },
  },
  "calcular-patrimonio-neto-real": {
    title: {
      es: "Cómo calcular tu patrimonio neto real",
      en: "How to Calculate Your Real Net Worth",
    },
    description: {
      es: "Guía para calcular tu patrimonio neto real: qué activos y deudas incluir, cómo valorarlos y los errores que inflan la cifra en la mayoría de casos.",
      en: "A guide to calculating your real net worth: which assets and debts to include, how to value them and the mistakes that inflate the number.",
    },
  },
  "runway-personal": {
    title: {
      es: "Runway personal: cuántos meses aguantas",
      en: "Personal Runway: How Many Months Can You Last?",
    },
    description: {
      es: "Calcula tu runway personal: cuántos meses cubres sin ingresos, qué gastos contar y tácticas para ampliarlo sin bajar tu nivel de vida.",
      en: "Calculate your personal runway: how many months you cover with no income, which expenses count and tactics to extend it without lifestyle cuts.",
    },
  },
  "portafolio-vs-sp500": {
    title: {
      es: "Comparar tu portafolio con el S&P 500",
      en: "Benchmark Your Portfolio Against the S&P 500",
    },
    description: {
      es: "Cómo comparar tu portafolio con el S&P 500 paso a paso: rentabilidad real, comisiones, dividendos y qué hacer si tu cartera pierde al índice.",
      en: "How to benchmark your portfolio against the S&P 500: real returns, fees, dividends and what to do when your portfolio trails the index.",
    },
  },
  "clasificacion-automatica-gastos-ia": {
    title: {
      es: "Clasificación automática de gastos con IA",
      en: "Automatic Expense Classification With AI",
    },
    description: {
      es: "Qué puede y qué no puede hacer la IA al clasificar tus gastos: precisión real, categorías difíciles y cómo revisar el extracto en pocos minutos.",
      en: "What AI can and cannot do when classifying your expenses: real accuracy, tricky categories and how to review your bank statement in minutes.",
    },
  },
  "numero-libertad-financiera": {
    title: {
      es: "Número de libertad financiera: cómo calcularlo",
      en: "Financial Freedom Number: How to Calculate It",
    },
    description: {
      es: "Calcula tu número de libertad financiera con la regla del 4%: gastos anuales, tasa de retiro segura, inflación y años que te faltan para lograrlo.",
      en: "Calculate your financial freedom number with the 4% rule: annual expenses, safe withdrawal rate, inflation and the years you still need.",
    },
  },
  "revision-financiera-20-minutos": {
    title: {
      es: "Revisión financiera mensual en 20 minutos",
      en: "Monthly Financial Review in 20 Minutes",
    },
    description: {
      es: "El ritual de revisión financiera mensual en 20 minutos: qué revisar cada mes, en qué orden y cómo convertirlo en un hábito que sostiene tu plan.",
      en: "The 20-minute monthly financial review ritual: what to check each month, in what order and how to turn it into a habit that sustains your plan.",
    },
  },
};

const MAX_TITLE = 55;
const MAX_DESCRIPTION = 155;

function clamp(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** SEO title (<= 55 chars) for an article, with a keyword-based fallback. */
export function blogSeoTitle(slug: string, lang: Lang) {
  const entry = blogSeo[slug];
  if (entry) return clamp(entry.title[lang], MAX_TITLE);
  const post = getPost(slug);
  return clamp(post?.title[lang] ?? (lang === "es" ? "Artículo" : "Article"), MAX_TITLE);
}

/** SEO description (<= 155 chars) for an article, with an excerpt fallback. */
export function blogSeoDescription(slug: string, lang: Lang) {
  const entry = blogSeo[slug];
  if (entry) return clamp(entry.description[lang], MAX_DESCRIPTION);
  const post = getPost(slug);
  return clamp(
    post?.excerpt[lang] ??
      (lang === "es"
        ? "Artículos sobre finanzas personales, inversión y IA."
        : "Articles about personal finance, investing and AI."),
    MAX_DESCRIPTION,
  );
}
