export type Bi = { es: string; en: string };

export type InternalLink = {
  /** Anchor text = main keyword of the target page. */
  label: Bi;
  /** Extra short phrases that may appear verbatim in article copy. */
  aliases?: Bi[];
  /** Spanish path; English variant is derived with /en prefix for blog posts. */
  to: string;
  enTo?: string;
  note: Bi;
  external?: false;
};

export type ExternalLink = {
  label: Bi;
  aliases?: Bi[];
  href: string;
  note: Bi;
};

export type PostLinks = {
  internal: InternalLink[];
  external: ExternalLink;
};

const post = (slug: string, label: Bi, note: Bi, aliases: Bi[] = []): InternalLink => ({
  label,
  aliases,
  to: `/blog/${slug}`,
  enTo: `/en/blog/${slug}`,
  note,
});

const NUMBER_LINK = post(
  "numero-libertad-financiera",
  { es: "número de libertad financiera", en: "financial freedom number" },
  { es: "Calcula cuánto capital necesitas para dejar de depender del sueldo.", en: "Work out how much capital you need to stop depending on a salary." },
  [
    { es: "tu número", en: "your number" },
    { es: "libertad financiera", en: "financial freedom" },
    { es: "número universal", en: "universal number" },
    { es: "tasa de ahorro", en: "savings rate" },
  ],
);
const NETWORTH_LINK = post(
  "calcular-patrimonio-neto-real",
  { es: "calcular tu patrimonio neto", en: "calculate your net worth" },
  { es: "El punto de partida honesto: activos menos deudas.", en: "The honest starting point: assets minus debts." },
  [
    { es: "patrimonio neto", en: "net worth" },
    { es: "tu patrimonio", en: "your net worth" },
    { es: "activos líquidos", en: "liquid assets" },
  ],
);
const RUNWAY_LINK = post(
  "runway-personal",
  { es: "runway personal", en: "personal runway" },
  { es: "Cuántos meses aguantas hoy sin ingresos.", en: "How many months you'd last today without income." },
  [
    { es: "runway", en: "runway" },
    { es: "meses de libertad", en: "months of freedom" },
    { es: "colchón financiero", en: "financial cushion" },
    { es: "gasto mensual", en: "monthly spending" },
    { es: "colchón", en: "buffer" },
  ],
);
const RICH_LINK = post(
  "rico-vs-adinerado",
  { es: "ser rico o ser adinerado", en: "rich vs wealthy" },
  { es: "La diferencia entre ganar mucho y no depender de nadie.", en: "The gap between earning a lot and depending on no one." },
  [
    { es: "ser rico", en: "being rich" },
    { es: "adinerado", en: "wealthy" },
  ],
);
const KIDS_LINK = post(
  "100k-hijo-18-anos-sp500",
  { es: "ahorrar para tus hijos e invertir en el S&P 500", en: "investing for kids in the S&P 500" },
  { es: "Cómo llegar a 100.000 € para tu hijo a los 18 años.", en: "How to reach €100,000 for your child by age 18." },
  [
    { es: "invertir para tus hijos", en: "investing for your kids" },
    { es: "100.000 €", en: "€100,000" },
    { es: "los 18 años", en: "age 18" },
  ],
);
const SPX_LINK = post(
  "portafolio-vs-sp500",
  { es: "comparar tu portafolio con el S&P 500", en: "benchmark your portfolio against the S&P 500" },
  { es: "Saber si tu cartera realmente bate al índice.", en: "Find out whether your portfolio really beats the index." },
  [
    { es: "S&P 500", en: "S&P 500" },
    { es: "el índice", en: "the index" },
  ],
);
const AI_LINK = post(
  "clasificacion-automatica-gastos-ia",
  { es: "clasificación automática de gastos con IA", en: "automatic expense classification with AI" },
  { es: "Ordena tus gastos sin hojas de cálculo.", en: "Sort your spending without spreadsheets." },
  [
    { es: "clasificación automática", en: "automatic classification" },
    { es: "con IA", en: "with AI" },
  ],
);
const REVIEW_LINK = post(
  "revision-financiera-20-minutos",
  { es: "revisión financiera mensual", en: "monthly financial review" },
  { es: "El hábito de 20 minutos que sostiene el plan.", en: "The 20-minute habit that keeps the plan alive." },
  [
    { es: "revisión mensual", en: "monthly review" },
    { es: "20 minutos", en: "20 minutes" },
  ],
);
const BORING_LINK = post(
  "boring-business-comprar-libertad-financiera",
  { es: "boring business", en: "boring business" },
  { es: "Negocios aburridos y rentables para acelerar tu número.", en: "Boring, profitable businesses to speed up your number." },
  [
    { es: "negocios aburridos", en: "boring businesses" },
    { es: "negocio aburrido", en: "boring business" },
  ],
);

const DEMO_LINK: InternalLink = {
  label: { es: "calcular tu número gratis", en: "calculate your number for free" },
  aliases: [
    { es: "demo gratis", en: "free demo" },
    { es: "prueba el demo", en: "try the demo" },
    { es: "calcula tu número", en: "calculate your number" },
  ],
  to: "/demo",
  note: { es: "Demo interactivo en minutos, sin registro.", en: "Interactive demo in minutes, no signup." },
};
const KIDS_HUB: InternalLink = {
  label: { es: "finanzas para niños", en: "money skills for kids" },
  aliases: [
    { es: "educación financiera", en: "financial education" },
    { es: "tus hijos", en: "your kids" },
  ],
  to: "/finanzas-para-ninos",
  enTo: "/en/finance-for-kids",
  note: { es: "La experiencia para que tus hijos aprendan invirtiendo.", en: "The experience where your kids learn by investing." },
};
const PRICING_LINK: InternalLink = {
  label: { es: "planes y precios", en: "plans and pricing" },
  aliases: [
    { es: "precio regional", en: "regional pricing" },
    { es: "planes", en: "plans" },
  ],
  to: "/precios",
  note: { es: "Free, Pro y Familiar con precio regional.", en: "Free, Pro and Family with regional pricing." },
};

export const postLinks: Record<string, PostLinks> = {
  "boring-business-comprar-libertad-financiera": {
    internal: [NUMBER_LINK, RICH_LINK, RUNWAY_LINK, DEMO_LINK],
    external: {
      label: { es: "Datos de supervivencia empresarial (U.S. Bureau of Labor Statistics)", en: "Business survival data (U.S. Bureau of Labor Statistics)" },
      aliases: [{ es: "Bureau of Labor Statistics", en: "Bureau of Labor Statistics" }, { es: "supervivencia empresarial", en: "business survival" }],
      href: "https://www.bls.gov/bdm/entrepreneurship/entrepreneurship.htm",
      note: { es: "Serie oficial de supervivencia de negocios por años de vida.", en: "Official series on business survival rates by age." },
    },
  },
  "100k-hijo-18-anos-sp500": {
    internal: [KIDS_HUB, NUMBER_LINK, SPX_LINK, DEMO_LINK],
    external: {
      label: { es: "S&P 500 — metodología y rentabilidad histórica (S&P Dow Jones Indices)", en: "S&P 500 — methodology and historical returns (S&P Dow Jones Indices)" },
      aliases: [{ es: "S&P Dow Jones Indices", en: "S&P Dow Jones Indices" }, { es: "rentabilidad histórica", en: "historical returns" }],
      href: "https://www.spglobal.com/spdji/en/indices/equity/sp-500/",
      note: { es: "Fuente primaria del índice usado en los cálculos.", en: "Primary source for the index used in the calculations." },
    },
  },
  "rico-vs-adinerado": {
    internal: [NUMBER_LINK, RUNWAY_LINK, NETWORTH_LINK, BORING_LINK],
    external: {
      label: { es: "Regla del 4 % y estudio Trinity (Bogleheads)", en: "The 4% rule and the Trinity study (Bogleheads)" },
      aliases: [{ es: "regla del 4 %", en: "4% rule" }, { es: "estudio Trinity", en: "Trinity study" }],
      href: "https://www.bogleheads.org/wiki/Trinity_study_update",
      note: { es: "Revisión de las tasas de retiro seguras a largo plazo.", en: "Review of safe long-term withdrawal rates." },
    },
  },
  "calcular-patrimonio-neto-real": {
    internal: [NUMBER_LINK, RUNWAY_LINK, SPX_LINK, DEMO_LINK],
    external: {
      label: { es: "Survey of Consumer Finances (Reserva Federal de EE. UU.)", en: "Survey of Consumer Finances (U.S. Federal Reserve)" },
      aliases: [{ es: "Reserva Federal", en: "Federal Reserve" }, { es: "Survey of Consumer Finances", en: "Survey of Consumer Finances" }],
      href: "https://www.federalreserve.gov/econres/scfindex.htm",
      note: { es: "Referencia estadística sobre patrimonio de los hogares.", en: "Statistical reference on household net worth." },
    },
  },
  "runway-personal": {
    internal: [NETWORTH_LINK, NUMBER_LINK, REVIEW_LINK, DEMO_LINK],
    external: {
      label: { es: "Tasa de ahorro de los hogares (OCDE)", en: "Household savings rate (OECD)" },
      aliases: [{ es: "tasa de ahorro", en: "savings rate" }, { es: "OCDE", en: "OECD" }],
      href: "https://www.oecd.org/en/data/indicators/household-savings.html",
      note: { es: "Comparativa internacional de cuánto ahorran los hogares.", en: "International comparison of how much households save." },
    },
  },
  "portafolio-vs-sp500": {
    internal: [NETWORTH_LINK, NUMBER_LINK, KIDS_LINK, DEMO_LINK],
    external: {
      label: { es: "Informes SPIVA: gestión activa vs. índice (S&P Global)", en: "SPIVA reports: active management vs. the index (S&P Global)" },
      aliases: [{ es: "SPIVA", en: "SPIVA" }, { es: "gestión activa", en: "active management" }],
      href: "https://www.spglobal.com/spdji/en/research-insights/spiva/",
      note: { es: "Cuántos gestores baten realmente a su índice.", en: "How many managers actually beat their benchmark." },
    },
  },
  "clasificacion-automatica-gastos-ia": {
    internal: [REVIEW_LINK, RUNWAY_LINK, NUMBER_LINK, DEMO_LINK],
    external: {
      label: { es: "Guía de presupuesto del CFPB (EE. UU.)", en: "CFPB budgeting guide (U.S.)" },
      aliases: [{ es: "CFPB", en: "CFPB" }, { es: "presupuesto", en: "budget" }],
      href: "https://www.consumerfinance.gov/consumer-tools/budgeting/",
      note: { es: "Marco oficial para categorizar y controlar gastos.", en: "Official framework to categorize and control spending." },
    },
  },
  "numero-libertad-financiera": {
    internal: [NETWORTH_LINK, RUNWAY_LINK, RICH_LINK, PRICING_LINK],
    external: {
      label: { es: "La regla del 4 % explicada (Investopedia)", en: "The 4% rule explained (Investopedia)" },
      aliases: [{ es: "regla del 4 %", en: "4% rule" }, { es: "tasa de retiro", en: "withdrawal rate" }, { es: "Investopedia", en: "Investopedia" }],
      href: "https://www.investopedia.com/terms/f/four-percent-rule.asp",
      note: { es: "Origen y límites de la tasa de retiro del 4 %.", en: "Origin and limits of the 4% withdrawal rate." },
    },
  },
  "revision-financiera-20-minutos": {
    internal: [AI_LINK, RUNWAY_LINK, NUMBER_LINK, DEMO_LINK],
    external: {
      label: { es: "Herramientas de finanzas personales del CFPB", en: "CFPB personal finance tools" },
      aliases: [{ es: "CFPB", en: "CFPB" }, { es: "finanzas personales", en: "personal finance" }],
      href: "https://www.consumerfinance.gov/consumer-tools/",
      note: { es: "Checklists públicos para revisar tus finanzas.", en: "Public checklists to review your finances." },
    },
  },
};

export function getPostLinks(slug: string) {
  return postLinks[slug] ?? null;
}
