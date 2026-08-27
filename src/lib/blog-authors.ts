import author1 from "@/assets/author-1.jpg";
import author2 from "@/assets/author-2.jpg";
import author3 from "@/assets/author-3.jpg";
import author4 from "@/assets/author-4.jpg";

export type BlogAuthor = {
  name: string;
  photo: string;
  role: { es: string; en: string };
  bio: { es: string; en: string };
};

const authors: Record<string, BlogAuthor> = {
  valeria: {
    name: "Valeria Restrepo",
    photo: author1,
    role: { es: "Analista de patrimonio", en: "Wealth analyst" },
    bio: {
      es: "Amante de las finanzas personales y de los números que sí se entienden. Escribe sobre patrimonio, hábitos de gasto y cómo construir libertad financiera sin complicarse.",
      en: "In love with personal finance and numbers that actually make sense. She writes about net worth, spending habits and building financial freedom without the noise.",
    },
  },
  mateo: {
    name: "Marco Rinaldi",
    photo: author2,
    role: { es: "Editor de inversión", en: "Investing editor" },
    bio: {
      es: "Fanático de los índices, las hojas de cálculo y el interés compuesto. Lleva más de 10 años ayudando a familias a ordenar su dinero y a invertir con calma.",
      en: "A fan of index funds, spreadsheets and compound interest. He has spent 10+ years helping families organize their money and invest calmly.",
    },
  },
  carolina: {
    name: "Emma Lindström",
    photo: author3,
    role: { es: "Planificadora financiera", en: "Financial planner" },
    bio: {
      es: "Amante de las finanzas y de las conversaciones honestas sobre dinero. Le apasiona traducir la planificación patrimonial a decisiones simples del día a día.",
      en: "Loves finance and honest money conversations. She is passionate about turning wealth planning into simple everyday decisions.",
    },
  },

  daniel: {
    name: "Daniel Ortega",
    photo: author4,
    role: { es: "Editor de datos y IA", en: "Data & AI editor" },
    bio: {
      es: "Curioso de los datos y del dinero bien gestionado. Escribe sobre automatización, IA aplicada a las finanzas personales y cómo medir tu progreso real.",
      en: "Curious about data and well-managed money. He writes about automation, AI for personal finance and how to measure real progress.",
    },
  },
};

const bySlug: Record<string, keyof typeof authors> = {
  "100k-hijo-18-anos-sp500": "carolina",
  "rico-vs-adinerado": "mateo",
  "calcular-patrimonio-neto-real": "valeria",
  "runway-personal": "mateo",
  "portafolio-vs-sp500": "daniel",
  "clasificacion-automatica-gastos-ia": "carolina",
  "numero-libertad-financiera": "mateo",
  "revision-financiera-20-minutos": "valeria",
};

export function getAuthor(slug: string): BlogAuthor {
  return authors[bySlug[slug] ?? "valeria"]!;
}
