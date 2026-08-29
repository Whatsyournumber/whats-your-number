/**
 * Keywords objetivo que trackeamos en Search Console.
 * - 4 keywords principales para el home
 * - 4 keywords principales para finanzas para niños
 * - 4 keywords por artículo del blog
 */

/**
 * `volume` = búsquedas mensuales estimadas (es = España, en = EE. UU.).
 * Solo trackeamos keywords con al menos MIN_KEYWORD_VOLUME búsquedas/mes.
 */
export type KeywordTarget = { es: string; en: string; volume?: { es: number; en: number } };

/** Volumen mínimo mensual exigido a una keyword objetivo. */
export const MIN_KEYWORD_VOLUME = 150;

/** Nº mínimo de keywords objetivo por artículo. */
export const MIN_KEYWORDS_PER_POST = 4;

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
    { es: "cuál es tu número para retiro", en: "what is your retirement number", volume: { es: 390, en: 1300 } },
    { es: "whats your number para retiro", en: "whats your number for retirement", volume: { es: 170, en: 210 } },
    { es: "finanzas personales para familias", en: "family personal finance", volume: { es: 720, en: 1600 } },
    { es: "calculadora de libertad financiera", en: "financial freedom calculator", volume: { es: 880, en: 1600 } },
    { es: "control de gastos e ingresos", en: "income and expense tracker", volume: { es: 1600, en: 2400 } },
    { es: "calculadora de patrimonio y jubilación", en: "net worth and retirement calculator", volume: { es: 480, en: 1900 } },
    { es: "comparador de costo de vida", en: "cost of living comparison", volume: { es: 590, en: 2900 } },
    { es: "finanzas personales", en: "personal finance app", volume: { es: 40500, en: 9900 } },
    { es: "cuánto dinero necesito para jubilarme", en: "how much money do i need to retire", volume: { es: 720, en: 2400 } },
    { es: "app para controlar gastos e inversiones", en: "net worth tracker app", volume: { es: 590, en: 3600 } },
  ],
};

export const kidsKeywords: KeywordGroup = {
  id: "ninos",
  label: { es: "Finanzas para niños", en: "Kids & money" },
  path: "/finanzas-para-ninos",
  keywords: [
    { es: "finanzas para niños", en: "financial education for kids", volume: { es: 1900, en: 880 } },
    { es: "educación financiera para niños", en: "teach kids about money", volume: { es: 2400, en: 1300 } },
    { es: "cómo enseñar a ahorrar a un niño", en: "how to teach kids to save money", volume: { es: 390, en: 720 } },
    { es: "app de ahorro para niños", en: "allowance app for kids", volume: { es: 320, en: 1900 } },
  ],
};

/** 4 keywords objetivo por artículo. */
export const postKeywords: Record<string, KeywordTarget[]> = {
  "boring-business-comprar-libertad-financiera": [
    { es: "boring business", en: "boring business", volume: { es: 1300, en: 4400 } },
    { es: "comprar un negocio pequeño", en: "buy a small business", volume: { es: 480, en: 2900 } },
    { es: "negocios rentables con poca inversión", en: "profitable businesses low investment", volume: { es: 2900, en: 1600 } },
    { es: "ingresos pasivos con negocios", en: "cash flow business ideas", volume: { es: 1600, en: 2400 } },
  ],
  "100k-hijo-18-anos-sp500": [
    { es: "invertir para mi hijo", en: "investing for your child", volume: { es: 720, en: 1900 } },
    { es: "100000 euros a los 18 años", en: "100k by age 18", volume: { es: 210, en: 260 } },
    { es: "invertir en el sp500 para niños", en: "s&p 500 for kids", volume: { es: 260, en: 590 } },
    { es: "interés compuesto para niños", en: "compound interest for kids", volume: { es: 390, en: 480 } },
  ],
  "rico-vs-adinerado": [
    { es: "rico vs adinerado", en: "rich vs wealthy", volume: { es: 320, en: 2400 } },
    { es: "qué es ser adinerado", en: "what does wealthy mean", volume: { es: 590, en: 1300 } },
    { es: "cuánto dinero necesito para vivir sin trabajar", en: "how much money to never work again", volume: { es: 480, en: 1600 } },
    { es: "libertad financiera cuánto necesito", en: "financial freedom number", volume: { es: 880, en: 3600 } },
  ],
  "calcular-patrimonio-neto-real": [
    { es: "cómo calcular el patrimonio neto", en: "how to calculate net worth", volume: { es: 1600, en: 8100 } },
    { es: "patrimonio neto personal", en: "personal net worth", volume: { es: 1300, en: 2900 } },
    { es: "activos y pasivos ejemplos", en: "assets and liabilities examples", volume: { es: 2400, en: 1900 } },
    { es: "calculadora de patrimonio neto", en: "net worth calculator", volume: { es: 880, en: 6600 } },
  ],
  "runway-personal": [
    { es: "runway personal", en: "personal runway", volume: { es: 170, en: 260 } },
    { es: "fondo de emergencia cuánto ahorrar", en: "how big should an emergency fund be", volume: { es: 720, en: 2900 } },
    { es: "cuántos meses de gastos ahorrar", en: "months of expenses saved", volume: { es: 390, en: 1600 } },
    { es: "colchón financiero", en: "financial cushion", volume: { es: 590, en: 210 } },
  ],
  "portafolio-vs-sp500": [
    { es: "comparar mi cartera con el sp500", en: "compare portfolio to s&p 500", volume: { es: 210, en: 880 } },
    { es: "rentabilidad de mi cartera", en: "portfolio performance benchmark", volume: { es: 480, en: 1300 } },
    { es: "invertir en indexados vs acciones", en: "index funds vs stock picking", volume: { es: 1300, en: 3600 } },
    { es: "benchmark cartera de inversión", en: "investment benchmark", volume: { es: 260, en: 1900 } },
  ],
  "clasificacion-automatica-gastos-ia": [
    { es: "clasificar gastos automáticamente", en: "automatic expense categorization", volume: { es: 320, en: 590 } },
    { es: "categorizar gastos con ia", en: "ai expense tracker", volume: { es: 390, en: 2400 } },
    { es: "analizar extracto bancario", en: "bank statement analysis", volume: { es: 590, en: 1600 } },
    { es: "app para controlar gastos", en: "expense tracking app", volume: { es: 6600, en: 9900 } },
  ],
  "numero-libertad-financiera": [
    { es: "número de la libertad financiera", en: "financial independence number", volume: { es: 720, en: 4400 } },
    { es: "regla del 4 por ciento", en: "4 percent rule", volume: { es: 1900, en: 8100 } },
    { es: "cómo calcular tu fire", en: "how to calculate fire number", volume: { es: 480, en: 2400 } },
    { es: "tasa de ahorro para jubilarse antes", en: "savings rate early retirement", volume: { es: 320, en: 1300 } },
  ],
  "revision-financiera-20-minutos": [
    { es: "revisión financiera mensual", en: "monthly financial review", volume: { es: 260, en: 1600 } },
    { es: "organizar mis finanzas personales", en: "get finances organized", volume: { es: 1600, en: 2900 } },
    { es: "hábitos financieros", en: "money habits", volume: { es: 2900, en: 3600 } },
    { es: "presupuesto mensual sencillo", en: "simple monthly budget", volume: { es: 1300, en: 4400 } },
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
