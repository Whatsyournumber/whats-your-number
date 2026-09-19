/** Catálogo de categorías para el objetivo de gasto personalizado. */
export type BudgetGroup = "essentials" | "lifestyle" | "other";

export type BudgetCategory = {
  id: string;
  emoji: string;
  es: string;
  en: string;
  group: BudgetGroup;
  /** Nombres de categorías de la app (en minúscula) que suman a esta categoría. */
  aliases: string[];
};

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "housing", emoji: "🏠", es: "Vivienda", en: "Housing", group: "essentials", aliases: ["vivienda", "housing", "alquiler", "hipoteca", "renta", "condominio", "mantenimiento vivienda", "mantenimiento hogar", "home maintenance", "community fee", "cuota comunidad"] },
  { id: "utilities", emoji: "💡", es: "Servicios", en: "Utilities", group: "essentials", aliases: ["servicios", "utilities"] },
  { id: "groceries", emoji: "🛒", es: "Supermercado", en: "Groceries", group: "lifestyle", aliases: ["mercado", "supermercado", "groceries"] },
  { id: "transport", emoji: "🚗", es: "Transporte", en: "Transport", group: "lifestyle", aliases: ["transporte", "transport", "coche", "car"] },
  { id: "insurance", emoji: "🛡️", es: "Seguros", en: "Insurance", group: "essentials", aliases: ["seguros", "insurance", "bancos & seguros", "banks & insurance"] },
  { id: "health", emoji: "🏥", es: "Salud", en: "Health", group: "lifestyle", aliases: ["salud", "health"] },
  { id: "education", emoji: "🎓", es: "Educación", en: "Education", group: "essentials", aliases: ["educacion", "educación", "education", "colegio", "school"] },
  { id: "family", emoji: "👨‍👩‍👧", es: "Hijos/Familia", en: "Kids/Family", group: "lifestyle", aliases: ["hijos", "familia", "family", "kids"] },
  { id: "debt", emoji: "💳", es: "Deudas/préstamos", en: "Debt/loans", group: "essentials", aliases: ["deudas", "prestamos", "préstamos", "debt", "loans"] },

  { id: "restaurants", emoji: "🍽️", es: "Restaurantes", en: "Restaurants", group: "lifestyle", aliases: ["restaurantes", "restaurants"] },
  { id: "delivery", emoji: "🛵", es: "Delivery", en: "Delivery", group: "lifestyle", aliases: ["delivery"] },
  { id: "travel", emoji: "✈️", es: "Viajes", en: "Travel", group: "lifestyle", aliases: ["viajes", "travel"] },
  { id: "nightlife", emoji: "🎉", es: "Ocio/Nightlife", en: "Nightlife", group: "lifestyle", aliases: ["nightlife", "ocio"] },
  { id: "shopping", emoji: "🛍️", es: "Compras", en: "Shopping", group: "lifestyle", aliases: ["compras", "shopping"] },
  { id: "clothing", emoji: "👕", es: "Ropa", en: "Clothing", group: "lifestyle", aliases: ["ropa", "clothing"] },
  { id: "beauty", emoji: "💇", es: "Cuidado personal", en: "Personal care", group: "lifestyle", aliases: ["belleza", "cuidado personal", "beauty", "personal care"] },
  { id: "gym", emoji: "🏋️", es: "Gimnasio/Deportes", en: "Gym/Sports", group: "essentials", aliases: ["deportes", "gimnasio", "sports", "gym"] },
  { id: "apps", emoji: "📱", es: "Apps/Suscripciones", en: "Apps/Subscriptions", group: "essentials", aliases: ["apps", "suscripciones", "subscriptions"] },
  { id: "entertainment", emoji: "🎮", es: "Entretenimiento", en: "Entertainment", group: "lifestyle", aliases: ["entretenimiento", "entertainment"] },
  { id: "pets", emoji: "🐶", es: "Mascotas", en: "Pets", group: "lifestyle", aliases: ["mascotas", "pets"] },
  { id: "gifts", emoji: "🎁", es: "Regalos", en: "Gifts", group: "lifestyle", aliases: ["regalos", "gifts"] },

  { id: "professional", emoji: "💼", es: "Gastos profesionales", en: "Professional expenses", group: "other", aliases: ["profesionales", "professional", "marketing digital", "digital marketing"] },
  { id: "donations", emoji: "❤️", es: "Donaciones", en: "Donations", group: "other", aliases: ["donaciones", "donations"] },
  { id: "second-home", emoji: "🏡", es: "Segunda vivienda", en: "Second home", group: "other", aliases: ["segunda vivienda", "second home"] },
  { id: "other", emoji: "📦", es: "Otros", en: "Other", group: "other", aliases: ["otros", "other"] },
];

/** Las 12 que se muestran por defecto. */
export const DEFAULT_BUDGET_IDS = [
  "housing",
  "utilities",
  "groceries",
  "transport",
  "insurance",
  "gym",
  "restaurants",
  "delivery",
  "travel",
  "nightlife",
  "shopping",
  "apps",
];

export const GROUP_LABELS: Record<BudgetGroup, { es: string; en: string }> = {
  essentials: { es: "Gastos fijos mensuales", en: "Monthly fixed expenses" },
  lifestyle: { es: "Gastos variables mensuales", en: "Monthly variable expenses" },
  other: { es: "Otros", en: "Other" },
};

export const findBudgetCategory = (id: string) => BUDGET_CATEGORIES.find((c) => c.id === id);
