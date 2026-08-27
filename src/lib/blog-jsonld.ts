import { getAuthor } from "@/lib/blog-authors";
import { getPost } from "@/lib/blog-posts";

const SITE = "https://whatsyour-number.com";
const FALLBACK_IMAGE = `${SITE}/og-cover.jpg`;

/** Absolute URL for an asset path emitted by the bundler. */
export function absoluteUrl(path: string | undefined) {
  if (!path) return FALLBACK_IMAGE;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** ISO date (YYYY-MM-DD) derived from the article's English date label. */
export function postIsoDate(slug: string) {
  const post = getPost(slug);
  if (!post) return undefined;
  const parsed = new Date(post.date.en);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

/** schema.org BreadcrumbList for a blog post (Home → Blog → Article). */
export function buildBreadcrumbJsonLd(slug: string, lang: "es" | "en") {
  const post = getPost(slug);
  if (!post) return null;
  const home = lang === "en" ? `${SITE}/en` : SITE;
  const blog = lang === "en" ? `${SITE}/en/blog` : `${SITE}/blog`;
  const article = lang === "en" ? `${SITE}/en/blog/${slug}` : `${SITE}/blog/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "en" ? "Home" : "Inicio",
        item: home,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blog,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title[lang],
        item: article,
      },
    ],
  };
}

/** schema.org BreadcrumbList for the blog index (Home → Blog). */
export function buildBlogIndexBreadcrumbJsonLd(lang: "es" | "en") {
  const home = lang === "en" ? `${SITE}/en` : SITE;
  const blog = lang === "en" ? `${SITE}/en/blog` : `${SITE}/blog`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "en" ? "Home" : "Inicio",
        item: home,
      },
      { "@type": "ListItem", position: 2, name: "Blog", item: blog },
    ],
  };
}

/** Full schema.org Article JSON-LD for a blog post in the given language. */
export function buildArticleJsonLd(slug: string, lang: "es" | "en") {
  const post = getPost(slug);
  if (!post) return null;
  const author = getAuthor(slug);
  const url = lang === "en" ? `${SITE}/en/blog/${slug}` : `${SITE}/blog/${slug}`;
  const published = postIsoDate(slug);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title[lang].slice(0, 110),
    name: post.title[lang],
    description: post.excerpt[lang],
    image: [absoluteUrl(post.image)],
    inLanguage: lang === "en" ? "en" : "es",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.keyword[lang],
    articleSection: post.tag[lang],
    wordCount: post.sections.reduce(
      (acc, s) => acc + s.paragraphs.reduce((a, p) => a + p[lang].split(/\s+/).length, 0),
      0,
    ),
    ...(published ? { datePublished: published, dateModified: published } : {}),
    author: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role[lang],
      description: author.bio[lang],
    },
    publisher: {
      "@type": "Organization",
      name: "WhatsYournumber",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og-cover.jpg` },
    },
  };
}

export type Faq = { q: { es: string; en: string }; a: { es: string; en: string } };

/** FAQ pairs used for FAQPage schema (helps AI/GEO answer engines). */
export const POST_FAQ: Record<string, Faq[]> = {
  "100k-hijo-18-anos-sp500": [
    {
      q: { es: "¿Cuánto hay que invertir al mes para tener 100.000 € a los 18 años?", en: "How much per month do you need to reach €100,000 by age 18?" },
      a: {
        es: "Empezando al nacer y con una rentabilidad media del 8 % anual hacen falta unos 210–230 € al mes. Si empiezas a los 8 años, la cifra sube a unos 500 € mensuales: cada año de retraso encarece el objetivo.",
        en: "Starting at birth with an 8% average annual return you need roughly €210–230 per month. Starting at age 8 the figure rises to about €500 per month: every year of delay makes the goal more expensive.",
      },
    },
    {
      q: { es: "¿Es buena idea invertir en el S&P 500 para un niño?", en: "Is the S&P 500 a good idea for a child?" },
      a: {
        es: "Con un horizonte de 15–18 años, un fondo indexado de bajo coste sobre el S&P 500 ha sido históricamente una de las formas más simples y diversificadas de capturar el crecimiento del mercado, siempre asumiendo la volatilidad de la renta variable.",
        en: "Over a 15–18 year horizon, a low-cost S&P 500 index fund has historically been one of the simplest, most diversified ways to capture market growth, always accepting equity volatility.",
      },
    },
    {
      q: { es: "¿Qué pasa si el mercado cae justo antes de los 18 años?", en: "What if the market falls right before age 18?" },
      a: {
        es: "Se reduce el riesgo bajando la exposición a renta variable en los 3–5 años finales y pasando parte a activos más estables, para no depender del precio de un único año.",
        en: "You reduce risk by lowering equity exposure in the final 3–5 years and shifting part of the portfolio to more stable assets, so the outcome doesn't hinge on a single year's price.",
      },
    },
  ],
  "rico-vs-adinerado": [
    {
      q: { es: "¿Cuál es la diferencia entre ser rico y ser adinerado?", en: "What is the difference between rich and wealthy?" },
      a: {
        es: "Rico es tener un ingreso alto que depende de seguir trabajando. Adinerado es tener activos que cubren tu coste de vida sin que tengas que trabajar: la libertad se mide en meses cubiertos, no en salario.",
        en: "Rich means a high income that depends on continuing to work. Wealthy means owning assets that cover your cost of living without working: freedom is measured in months covered, not in salary.",
      },
    },
    {
      q: { es: "¿Cuánto dinero necesito para dejar de pensar en dinero?", en: "How much money do I need to stop thinking about money?" },
      a: {
        es: "Multiplica tu gasto anual por 25 (regla del 4 %). Con 5.000 €/mes de gasto necesitas unos 1,5 M €; con 7.000 €/mes, unos 2,1 M €.",
        en: "Multiply your annual spending by 25 (the 4% rule). At €5,000/month you need about €1.5M; at €7,000/month, roughly €2.1M.",
      },
    },
    {
      q: { es: "¿Se puede ser adinerado con un sueldo normal?", en: "Can you become wealthy on an ordinary salary?" },
      a: {
        es: "Sí: la variable decisiva es la tasa de ahorro invertida, no el ingreso bruto. Ahorrar el 40 % de un sueldo medio y mantener el gasto estable adelanta la libertad más que subir de sueldo y de nivel de vida a la vez.",
        en: "Yes: the decisive variable is the invested savings rate, not gross income. Saving 40% of an average salary while keeping lifestyle flat brings freedom sooner than raising both pay and spending.",
      },
    },
  ],
  "calcular-patrimonio-neto-real": [
    {
      q: { es: "¿Cómo se calcula el patrimonio neto?", en: "How do you calculate net worth?" },
      a: {
        es: "Suma todos tus activos (efectivo, inversiones, planes de pensiones, inmuebles a valor de mercado) y resta todas tus deudas (hipoteca, préstamos, tarjetas). La diferencia es tu patrimonio neto real.",
        en: "Add every asset (cash, investments, pensions, property at market value) and subtract every debt (mortgage, loans, credit cards). The difference is your true net worth.",
      },
    },
    {
      q: { es: "¿Debo incluir mi vivienda habitual?", en: "Should I include my primary home?" },
      a: {
        es: "Sí en el patrimonio, pero sepárala del patrimonio líquido: no puedes vivir de una casa en la que vives. Para calcular tu libertad financiera cuenta solo ahorros e inversiones.",
        en: "Yes for net worth, but keep it separate from liquid net worth: you can't live off the house you live in. For financial freedom, count only savings and investments.",
      },
    },
    {
      q: { es: "¿Cada cuánto debo actualizar mi patrimonio neto?", en: "How often should I update my net worth?" },
      a: {
        es: "Una vez al mes es suficiente. Lo importante es la tendencia trimestral, no la variación diaria de los mercados.",
        en: "Once a month is enough. What matters is the quarterly trend, not daily market swings.",
      },
    },
  ],
  "runway-personal": [
    {
      q: { es: "¿Qué es el runway personal?", en: "What is personal runway?" },
      a: {
        es: "Los meses que puedes vivir con tus activos líquidos si mañana desaparecen tus ingresos: activos líquidos dividido entre tu gasto mensual.",
        en: "The number of months you could live on your liquid assets if your income stopped tomorrow: liquid assets divided by monthly spending.",
      },
    },
    {
      q: { es: "¿Cuántos meses de runway son suficientes?", en: "How many months of runway are enough?" },
      a: {
        es: "De 3 a 6 meses con ingresos estables; de 9 a 12 si eres autónomo, tienes ingresos variables o dependes de un solo cliente.",
        en: "Three to six months with stable income; nine to twelve if you're self-employed, have variable income or depend on a single client.",
      },
    },
    {
      q: { es: "¿El runway incluye inversiones?", en: "Does runway include investments?" },
      a: {
        es: "Incluye lo que puedas vender en días sin gran penalización: efectivo, fondos monetarios y fondos indexados. No incluye inmuebles ni planes de pensiones bloqueados.",
        en: "It includes anything you can sell within days without a big penalty: cash, money-market funds and index funds. It excludes property and locked pension plans.",
      },
    },
  ],
  "portafolio-vs-sp500": [
    {
      q: { es: "¿Cómo comparo mi portafolio con el S&P 500?", en: "How do I benchmark my portfolio against the S&P 500?" },
      a: {
        es: "Calcula tu rentabilidad ponderada por tiempo (TWR) en la misma moneda y el mismo periodo que el índice, incluyendo dividendos reinvertidos y restando comisiones.",
        en: "Compute your time-weighted return (TWR) in the same currency and period as the index, including reinvested dividends and net of fees.",
      },
    },
    {
      q: { es: "¿Por qué mi rentabilidad no coincide con la del índice?", en: "Why doesn't my return match the index?" },
      a: {
        es: "Por aportaciones en distintos momentos, divisa, comisiones, impuestos y por comparar precio sin dividendos frente al índice total return.",
        en: "Because of contributions at different times, currency, fees, taxes, and comparing a price index against a total-return index.",
      },
    },
    {
      q: { es: "¿Es malo quedar por debajo del índice?", en: "Is underperforming the index a problem?" },
      a: {
        es: "Solo si ocurre de forma persistente varios años y sin menos riesgo a cambio. Un año por debajo es ruido; cinco años seguidos es una señal para simplificar hacia indexados.",
        en: "Only if it persists over several years without lower risk in exchange. One year below is noise; five in a row is a signal to simplify into index funds.",
      },
    },
  ],
  "clasificacion-automatica-gastos-ia": [
    {
      q: { es: "¿Cómo clasifica la IA mis gastos?", en: "How does AI classify my expenses?" },
      a: {
        es: "Combina reglas sobre el texto del movimiento (comercio, importe, recurrencia) con un modelo de lenguaje que interpreta descripciones ambiguas y agrupa gastos relacionados, como los de un mismo viaje.",
        en: "It combines rules over the transaction text (merchant, amount, recurrence) with a language model that interprets ambiguous descriptions and groups related spending, such as one trip's costs.",
      },
    },
    {
      q: { es: "¿Es fiable la categorización automática?", en: "Is automatic categorization reliable?" },
      a: {
        es: "Acierta la mayoría de movimientos habituales y deja los dudosos para que los revises. Cada corrección tuya mejora la clasificación futura.",
        en: "It gets most routine transactions right and flags doubtful ones for review. Every correction you make improves future classification.",
      },
    },
    {
      q: { es: "¿Tengo que conectar mi banco?", en: "Do I have to connect my bank?" },
      a: {
        es: "No. Puedes subir el extracto en PDF o CSV, o introducir gastos manualmente por día o por mes.",
        en: "No. You can upload a PDF or CSV statement, or enter expenses manually by day or by month.",
      },
    },
  ],
  "numero-libertad-financiera": [
    {
      q: { es: "¿Qué es el número de libertad financiera?", en: "What is a financial freedom number?" },
      a: {
        es: "El capital invertido que genera lo suficiente para cubrir tu coste de vida sin trabajar. Con la regla del 4 % equivale a tu gasto anual multiplicado por 25.",
        en: "The invested capital that generates enough to cover your cost of living without working. Under the 4% rule it equals your annual spending times 25.",
      },
    },
    {
      q: { es: "¿Qué tasa de retiro debo usar?", en: "Which withdrawal rate should I use?" },
      a: {
        es: "El 4 % es la referencia clásica para 30 años. Si te retiras muy pronto o quieres margen, usa 3–3,5 %, lo que eleva el objetivo a 28–33 veces tu gasto anual.",
        en: "4% is the classic reference for a 30-year horizon. For very early retirement or extra margin use 3–3.5%, which raises the target to 28–33 times annual spending.",
      },
    },
    {
      q: { es: "¿El número cambia si tengo pareja e hijos?", en: "Does the number change with a partner and kids?" },
      a: {
        es: "Sí: depende del gasto del hogar completo, incluida educación y vivienda. Por eso conviene recalcularlo cuando cambia la situación familiar o la ciudad.",
        en: "Yes: it depends on total household spending, including education and housing. Recalculate it whenever your family situation or city changes.",
      },
    },
  ],
  "revision-financiera-20-minutos": [
    {
      q: { es: "¿Cada cuánto debo hacer una revisión financiera?", en: "How often should I do a financial review?" },
      a: {
        es: "Una vez al mes, siempre el mismo día. Veinte minutos bastan para revisar gastos, patrimonio, runway y avance hacia tu número.",
        en: "Once a month, always on the same day. Twenty minutes is enough to review spending, net worth, runway and progress toward your number.",
      },
    },
    {
      q: { es: "¿Qué debo revisar exactamente?", en: "What exactly should I review?" },
      a: {
        es: "Gasto del mes frente a la media, gastos fijos y suscripciones, patrimonio neto, aportación invertida y meses de runway.",
        en: "Monthly spending vs. your average, fixed costs and subscriptions, net worth, invested contribution and months of runway.",
      },
    },
    {
      q: { es: "¿Sirve de algo si mis ingresos son irregulares?", en: "Is it useful if my income is irregular?" },
      a: {
        es: "Más aún: con ingresos variables la referencia es el gasto medio de 6 meses y el runway, no el sueldo del mes.",
        en: "Even more so: with variable income the reference is your 6-month average spending and your runway, not this month's pay.",
      },
    },
  ],
  "boring-business-comprar-libertad-financiera": [
    {
      q: { es: "¿Qué es un boring business?", en: "What is a boring business?" },
      a: {
        es: "Un negocio sencillo y poco glamuroso —lavandería, vending, self storage, agencia de ventas o house flipping— con demanda estable, clientes recurrentes y flujo de caja predecible, fácil de automatizar con tecnología e IA.",
        en: "A simple, unglamorous business — laundromat, vending, self storage, sales agency or house flipping — with stable demand, recurring customers and predictable cash flow that is easy to automate with technology and AI.",
      },
    },
    {
      q: { es: "¿Con cuánto dinero puedo empezar un boring business?", en: "How much money do I need to start a boring business?" },
      a: {
        es: "Desde 0–500 USD con una agencia de growth marketing centrada solo en ventas, 2.000–8.000 USD en vending especializado, 40.000–150.000 USD en una lavandería automática y desde 150.000 USD en self storage.",
        en: "From $0–500 with a sales-only growth marketing agency, $2,000–8,000 for specialized vending, $40,000–150,000 for a self-service laundromat and from $150,000 for self storage.",
      },
    },
    {
      q: { es: "¿Es mejor comprar un negocio o crearlo desde cero?", en: "Is it better to buy a business or start one from scratch?" },
      a: {
        es: "Comprar un negocio rentable (estrategia ETA, Entrepreneurship Through Acquisition) suele tener mejores probabilidades: ya existen clientes, ingresos y procesos. Solo necesitas mejorarlo un 10–20 % con digitalización, IA y mejor marketing.",
        en: "Buying a profitable business (the ETA strategy, Entrepreneurship Through Acquisition) usually has better odds: customers, revenue and processes already exist. You only need to improve it by 10–20% with digitization, AI and better marketing.",
      },
    },
    {
      q: { es: "¿Cómo acelera un boring business mi libertad financiera?", en: "How does a boring business speed up financial freedom?" },
      a: {
        es: "Aumenta tu tasa de ahorro. Con un objetivo de 900.000 € y 1.000 €/mes de ahorro tardarías unos 33 años; añadir 2.000 €/mes de caja reinvertida baja el plazo a unos 18 años.",
        en: "It raises your savings rate. With a €900,000 goal and €1,000/month saved you would need roughly 33 years; adding €2,000/month of reinvested cash cuts it to about 18 years.",
      },
    },
  ],
};

/** schema.org FAQPage for articles that have curated question/answer pairs. */
export function buildFaqJsonLd(slug: string, lang: "es" | "en") {
  const faqs = POST_FAQ[slug];
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q[lang],
      acceptedAnswer: { "@type": "Answer", text: f.a[lang] },
    })),
  };
}
