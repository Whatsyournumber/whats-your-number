/**
 * Keywords objetivo que trackeamos en Search Console.
 * - 4 keywords principales para el home
 * - 4 keywords principales para finanzas para niños
 * - 4 keywords por artículo del blog
 */

export type KeywordTarget = { es: string; en: string };

export type KeywordGroup = {
  id: string;
  label: { es: string; en: string };
  /** Ruta canónica en español (para abrir la página desde el panel). */
  path: string;
  /** Fecha de creación/publicación (solo artículos). */
  date?: string;
  keywords: KeywordTarget[];
};

export const homeKeywords: KeywordGroup = {
  id: "home",
  label: { es: "Home · WhatsYourNumber", en: "Home · WhatsYourNumber" },
  path: "/",
  keywords: [
    { es: "finanzas personales", en: "personal finance app" },
    { es: "calculadora libertad financiera", en: "financial freedom calculator" },
    { es: "cuánto dinero necesito para jubilarme", en: "how much money do i need to retire" },
    { es: "app para controlar gastos e inversiones", en: "net worth tracker app" },
  ],
};

export const kidsKeywords: KeywordGroup = {
  id: "ninos",
  label: { es: "Finanzas para niños", en: "Kids & money" },
  path: "/finanzas-para-ninos",
  keywords: [
    { es: "finanzas para niños", en: "financial education for kids" },
    { es: "educación financiera para niños", en: "teach kids about money" },
    { es: "cómo enseñar a ahorrar a un niño", en: "how to teach kids to save money" },
    { es: "app de ahorro para niños", en: "allowance app for kids" },
  ],
};

/** 4 keywords objetivo por artículo. */
export const postKeywords: Record<string, KeywordTarget[]> = {
  "boring-business-comprar-libertad-financiera": [
    { es: "boring business", en: "boring business" },
    { es: "comprar un negocio pequeño", en: "buy a small business" },
    { es: "negocios rentables con poca inversión", en: "profitable businesses low investment" },
    { es: "ingresos pasivos con negocios", en: "cash flow business ideas" },
  ],
  "100k-hijo-18-anos-sp500": [
    { es: "invertir para mi hijo", en: "investing for your child" },
    { es: "100000 euros a los 18 años", en: "100k by age 18" },
    { es: "invertir en el sp500 para niños", en: "s&p 500 for kids" },
    { es: "interés compuesto para niños", en: "compound interest for kids" },
  ],
  "rico-vs-adinerado": [
    { es: "rico vs adinerado", en: "rich vs wealthy" },
    { es: "qué es ser adinerado", en: "what does wealthy mean" },
    { es: "cuánto dinero necesito para vivir sin trabajar", en: "how much money to never work again" },
    { es: "libertad financiera cuánto necesito", en: "financial freedom number" },
  ],
  "calcular-patrimonio-neto-real": [
    { es: "cómo calcular el patrimonio neto", en: "how to calculate net worth" },
    { es: "patrimonio neto personal", en: "personal net worth" },
    { es: "activos y pasivos ejemplos", en: "assets and liabilities examples" },
    { es: "calculadora de patrimonio neto", en: "net worth calculator" },
  ],
  "runway-personal": [
    { es: "runway personal", en: "personal runway" },
    { es: "fondo de emergencia cuánto ahorrar", en: "how big should an emergency fund be" },
    { es: "cuántos meses de gastos ahorrar", en: "months of expenses saved" },
    { es: "colchón financiero", en: "financial cushion" },
  ],
  "portafolio-vs-sp500": [
    { es: "comparar mi cartera con el sp500", en: "compare portfolio to s&p 500" },
    { es: "rentabilidad de mi cartera", en: "portfolio performance benchmark" },
    { es: "invertir en indexados vs acciones", en: "index funds vs stock picking" },
    { es: "benchmark cartera de inversión", en: "investment benchmark" },
  ],
  "clasificacion-automatica-gastos-ia": [
    { es: "clasificar gastos automáticamente", en: "automatic expense categorization" },
    { es: "categorizar gastos con ia", en: "ai expense tracker" },
    { es: "analizar extracto bancario", en: "bank statement analysis" },
    { es: "app para controlar gastos", en: "expense tracking app" },
  ],
  "numero-libertad-financiera": [
    { es: "número de la libertad financiera", en: "financial independence number" },
    { es: "regla del 4 por ciento", en: "4 percent rule" },
    { es: "cómo calcular tu fire", en: "how to calculate fire number" },
    { es: "tasa de ahorro para jubilarse antes", en: "savings rate early retirement" },
  ],
  "revision-financiera-20-minutos": [
    { es: "revisión financiera mensual", en: "monthly financial review" },
    { es: "organizar mis finanzas personales", en: "get finances organized" },
    { es: "hábitos financieros", en: "money habits" },
    { es: "presupuesto mensual sencillo", en: "simple monthly budget" },
  ],
};

export function allKeywordGroups(): KeywordGroup[] {
  return [homeKeywords, kidsKeywords];
}

/** Todas las keywords objetivo (es + en) en minúsculas, sin duplicados. */
export function allTargetKeywords(): string[] {
  const set = new Set<string>();
  const push = (list: KeywordTarget[]) =>
    list.forEach((k) => {
      set.add(k.es.toLowerCase());
      set.add(k.en.toLowerCase());
    });
  allKeywordGroups().forEach((g) => push(g.keywords));
  Object.values(postKeywords).forEach(push);
  return [...set];
}
