import { blogPosts, type BlogPost } from "@/lib/blog-posts";

export type BlogCategoryId =
  | "ahorro"
  | "inversiones"
  | "fire"
  | "business"
  | "habitos"
  | "ninos";

export type BlogCategory = {
  id: BlogCategoryId;
  label: { es: string; en: string };
  description: { es: string; en: string };
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
    label: { es: "Inversiones & patrimonio", en: "Investing & net worth" },
    description: {
      es: "Carteras, índices, activos y cómo medir de verdad lo que tienes.",
      en: "Portfolios, index funds, assets and how to truly measure what you own.",
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
    id: "business",
    label: { es: "Business ideas", en: "Business ideas" },
    description: {
      es: "Ingresos extra, negocios y proyectos que multiplican tu capacidad de ahorro.",
      en: "Side income, businesses and projects that multiply your saving power.",
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
  },
];

const POST_CATEGORY: Record<string, BlogCategoryId> = {
  "boring-business-comprar-libertad-financiera": "business",
  "rico-vs-adinerado": "fire",

  "numero-libertad-financiera": "fire",
  "calcular-patrimonio-neto-real": "inversiones",
  "runway-personal": "ahorro",
  "portafolio-vs-sp500": "inversiones",
  "clasificacion-automatica-gastos-ia": "habitos",
  "revision-financiera-20-minutos": "habitos",
  "100k-hijo-18-anos-sp500": "ninos",
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
