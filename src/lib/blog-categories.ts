import { blogPosts, type BlogPost } from "@/lib/blog-posts";

export type BlogCategoryId =
  | "ahorro"
  | "inversiones"
  | "fire"
  | "patrimonio"
  | "ia"
  | "habitos"
  | "ninos";

export type BlogCategory = {
  id: BlogCategoryId;
  label: { es: string; en: string };
  description: { es: string; en: string };
  /** Optional external landing page for categories without articles yet. */
  href?: { es: string; en: string };
};

export const blogCategories: BlogCategory[] = [
  {
    id: "ahorro",
    label: { es: "Ahorro", en: "Saving" },
    description: {
      es: "Colchón, runway y cómo estirar cada euro sin dejar de vivir.",
      en: "Emergency fund, runway and stretching every euro without stopping living.",
    },
  },
  {
    id: "inversiones",
    label: { es: "Inversiones", en: "Investing" },
    description: {
      es: "Carteras, índices, riesgo y rentabilidad real a largo plazo.",
      en: "Portfolios, index funds, risk and real long-term returns.",
    },
  },
  {
    id: "fire",
    label: { es: "FIRE", en: "FIRE" },
    description: {
      es: "Independencia financiera: tu número, tus años y tu tasa de ahorro.",
      en: "Financial independence: your number, your years and your savings rate.",
    },
  },
  {
    id: "patrimonio",
    label: { es: "Patrimonio", en: "Net worth" },
    description: {
      es: "Activos, pasivos y cómo medir de verdad lo que tienes.",
      en: "Assets, liabilities and how to truly measure what you own.",
    },
  },
  {
    id: "ia",
    label: { es: "IA y finanzas", en: "AI & finance" },
    description: {
      es: "Automatiza gastos, categorías y decisiones con inteligencia artificial.",
      en: "Automate expenses, categories and decisions with AI.",
    },
  },
  {
    id: "habitos",
    label: { es: "Hábitos", en: "Habits" },
    description: {
      es: "Rutinas cortas que mantienen tus finanzas en orden.",
      en: "Short routines that keep your finances in order.",
    },
  },
  {
    id: "ninos",
    label: { es: "Finanzas para niños", en: "Kids & money" },
    description: {
      es: "Educación financiera para tus hijos desde los 5 años.",
      en: "Financial education for your kids from age 5.",
    },
    href: { es: "/finanzas-para-ninos", en: "/en/finanzas-para-ninos" },
  },
];

const POST_CATEGORY: Record<string, BlogCategoryId> = {
  "rico-vs-adinerado": "fire",
  "numero-libertad-financiera": "fire",
  "calcular-patrimonio-neto-real": "patrimonio",
  "runway-personal": "ahorro",
  "portafolio-vs-sp500": "inversiones",
  "clasificacion-automatica-gastos-ia": "ia",
  "revision-financiera-20-minutos": "habitos",
};

export function postCategory(slug: string): BlogCategory | undefined {
  const id = POST_CATEGORY[slug];
  return blogCategories.find((c) => c.id === id);
}

export function postsByCategory(id: BlogCategoryId): BlogPost[] {
  return blogPosts.filter((p) => POST_CATEGORY[p.slug] === id);
}

export function categoryCount(id: BlogCategoryId): number {
  return postsByCategory(id).length;
}
