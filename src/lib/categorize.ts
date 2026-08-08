/**
 * Categorización de transacciones de los EEFF.
 * Reglas por palabras clave sobre comercio + descripción + subcategoría + categoría original.
 */

export type CategorizableTx = {
  merchant: string;
  description?: string | null;
  subcategory?: string | null;
  category?: string | null;
};

const RULES: { name: string; hints: string[] }[] = [
  {
    name: "Viajes",
    hints: [
      "viaj", "vuelo", "aeroli", "airline", "airlines", "hotel", "airbnb", "booking", "expedia", "crucero",
      "hostal", "despegar", "latam", "avianca", "iberia", "ryanair", "vueling", "turismo", "travel", "flight",
      "aeropuerto", "airport", "kayak", "trip", "hostel", "resort",
    ],
  },
  {
    name: "Marketing digital",
    hints: [
      "google ads", "googleads", "meta ads", "facebook ads", "facebk ads", "fb ads", "instagram ads",
      "tiktok ads", "linkedin ads", "twitter ads", "x ads", "adwords", "ads manager", "publicidad",
      "marketing", "mailchimp", "hubspot", "klaviyo", "semrush", "ahrefs", "canva", "hootsuite", "buffer",
      "shopify", "wix", "squarespace", "godaddy", "namecheap", "webflow", "campaign",
    ],
  },
  {
    name: "Restaurantes",
    hints: [
      "restaurant", "restaurante", "resto", "cafe", "café", "cafeteria", "starbucks", "mcdonald", "burger",
      "kfc", "subway", "pizza", "sushi", "taco", "grill", "bistro", "brunch", "panaderia", "panadería",
      "heladeria", "heladería", "food", "comida", "deli", "kitchen", "asador", "parrilla", "ramen", "wok",
      "glovo", "ubereats", "uber eats", "rappi", "just eat", "justeat", "deliveroo", "doordash", "pedidosya",
    ],
  },
  {
    name: "Mercado",
    hints: [
      "supermercado", "supermarket", "mercado", "market", "grocer", "abarrote", "mercadona", "carrefour",
      "lidl", "aldi", "dia %", "alcampo", "eroski", "consum", "walmart", "costco", "kroger", "whole foods",
      "trader joe", "wong", "metro", "jumbo", "exito", "éxito", "olimpica", "olímpica", "d1", "ara ",
      "riba smith", "super 99", "el rey", "pricesmart", "fruteria", "frutería", "carniceria", "carnicería",
      "verduler",
    ],
  },
  {
    name: "Salidas",
    hints: [
      "bar ", " bar", "pub", "cervec", "brewery", "cocktail", "coctel", "cóctel", "disco", "club nocturno",
      "nightclub", "lounge", "cantina", "taberna", "cine", "cinema", "cinepolis", "cinépolis", "teatro",
      "theater", "concierto", "concert", "festival", "ticketmaster", "eventbrite", "boliche", "bowling",
      "karaoke", "casino", "entretenimiento", "nightlife", "copas",
    ],
  },
  {
    name: "Compras",
    hints: [
      "amazon", "zara", "h&m", "hm ", "uniqlo", "mango", "primark", "shein", "temu", "aliexpress", "ebay",
      "nike", "adidas", "zalando", "el corte ingles", "el corte inglés", "ikea", "leroy", "decathlon",
      "mediamarkt", "fnac", "apple store", "tienda", "boutique", "shop", "store", "retail", "mall",
      "outlet", "ropa", "calzado", "sephora", "perfum",
    ],
  },
];

const FOOD_CATEGORIES = ["aliment", "comida", "food", "groceries", "supermerc", "restaurant"];

export function categorizeTx(t: CategorizableTx): string {
  const original = t.category ?? "Sin categoría";
  const hay = `${t.merchant} ${t.description ?? ""} ${t.subcategory ?? ""} ${original}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.hints.some((h) => hay.includes(h))) return rule.name;
  }

  // "Alimentación" sin comercio reconocible: por defecto es mercado.
  if (FOOD_CATEGORIES.some((c) => original.toLowerCase().includes(c))) return "Mercado";

  return original;
}
