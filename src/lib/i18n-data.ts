/** Traducción de textos generados en libs de datos (objetivos, notas). */
export type Lang = "es" | "en";

const GOAL_NAMES: Record<string, string> = {
  "Fondo de emergencia": "Emergency fund",
  "Cartera de inversión": "Investment portfolio",
  "Retiro anticipado": "Early retirement",
  "Your Number": "Your Number",
};

export function translateGoalName(name: string, lang: Lang) {
  if (lang !== "en") return name;
  if (GOAL_NAMES[name]) return GOAL_NAMES[name]!;
  if (name.startsWith("Vivir en ")) return `Live in ${name.slice("Vivir en ".length)}`;
  return name;
}

export function translateGoalNote(note: string, lang: Lang) {
  if (lang !== "en") return note;
  return note
    .replace("Vivir en ", "Live in ")
    .replace("Ciudad objetivo", "Target city")
    .replace("ahorro ", "savings ")
    .replace("/mes", "/mo")
    .replace("/mes", "/mo")
    .replace("te retiras en menos de 1 año", "you retire in under 1 year")
    .replace(/te retiras en (\d+) años/, "you retire in $1 years")
    .replace("te retiras en +60 años", "you retire in 60+ years");
}

const CATEGORY_NAMES: Record<string, string> = {
  "Mercado": "Groceries",
  "Restaurantes": "Restaurants",
  "Delivery": "Delivery",
  "Nightlife": "Nightlife",
  "Deportes": "Sports",
  "Compras": "Shopping",
  "Viajes": "Travel",
  "Transporte": "Transport",
  "Salud": "Health",
  "Apps": "Apps",
  "Marketing digital": "Digital marketing",
  "Bancos & Seguros": "Banks & Insurance",
  "Otros": "Other",
  "Lifestyle": "Lifestyle",
  "Vivienda": "Housing",
  "Necesidades": "Needs",
  "Deseos": "Wants",
  "Ahorro e inversión": "Savings & investing",
};

/** Traduce nombres de categorías de gasto (deja intactas las personalizadas). */
export function translateCategory(name: string, lang: Lang) {
  if (lang !== "en") return name;
  return CATEGORY_NAMES[name] ?? name;
}

const FIXED_NAMES: Record<string, string> = {
  "Hipoteca / Alquiler": "Mortgage / Rent",
  "Hipoteca": "Mortgage",
  "Alquiler": "Rent",
  "Fondo de ahorro": "Savings fund",
  "Servicios (luz, agua, internet)": "Utilities (power, water, internet)",
  "Servicios": "Utilities",
  "Seguro de salud": "Health insurance",
  "Seguros": "Insurance",
  "Colegio": "School",
  "Coche": "Car",
  "Transporte": "Transport",
  "Suscripciones": "Subscriptions",
  "Nuevo gasto fijo": "New fixed expense",
};

/** Traduce nombres de gastos fijos por defecto. */
export function translateFixedName(name: string, lang: Lang) {
  if (lang !== "en") return name;
  return FIXED_NAMES[name] ?? name;
}
