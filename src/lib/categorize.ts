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

export type CategoryRule = { name: string; hints: string[] };

/** Categorías base del sistema (en orden de prioridad de match). */
export const RULES: CategoryRule[] = [
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
      "tiktok ads", "tik tok ads", "linkedin ads", "twitter ads", "x ads", "adwords", "ads manager", "publicidad",
      "marketing", "mailchimp", "hubspot", "klaviyo", "semrush", "ahrefs", "hootsuite", "buffer",
      "shopify", "wix", "squarespace", "godaddy", "namecheap", "webflow", "campaign",
      "facebook", "facebk", "fb", "meta", "tiktok", "tik tok", "google", "youtube ads",
    ],
  },
  {
    name: "Apps",
    hints: [
      "app store", "appstore", "google play", "play store", "itunes", "spotify", "netflix", "hbo", "max ",
      "disney", "prime video", "youtube premium", "apple music", "apple tv", "icloud", "dropbox", "notion",
      "figma", "canva", "adobe", "microsoft 365", "office 365", "openai", "chatgpt", "claude", "midjourney",
      "github", "slack", "zoom", "linear", "vercel", "netlify", "aws", "google cloud", "digitalocean",
      "suscripcion", "suscripción", "subscription", "saas", "software",
    ],
  },
  {
    name: "Transporte",
    hints: [
      "uber", "cabify", "didi", "bolt", "taxi", "lyft", "metro ", "subway station", "bus ", "autobus",
      "autobús", "renfe", "cercanias", "cercanías", "tren", "train", "peaje", "toll", "parking",
      "estacionamiento", "gasolin", "combustible", "fuel", "shell", "repsol", "texaco", "chevron", "petro",
      "esso", "bp ", "delta ", "carwash", "lavado de auto", "taller", "mecanic", "mecánic", "neumatic",
      "neumátic", "llanta", "seguro auto", "revision tecnica", "scooter", "bicicleta", "bike",
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
      "trader joe", "wong", "jumbo", "exito", "éxito", "olimpica", "olímpica", "d1", "ara ",
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
    name: "Lifestyle",
    hints: [
      "gym", "gimnasio", "fitness", "crossfit", "yoga", "pilates", "spa", "masaje", "hammam", "hammam",
      "balneario", "sauna", "jacuzzi", "termal", "termas", "talaso", "thalasso", "peluqueria",
      "peluquería", "barberia", "barbería", "salon", "salón", "estetica", "estética", "manicur", "nails",
      "wellness", "terapia", "psicolog", "coach", "farmacia", "pharmacy", "dentista", "clinica", "clínica",
      "medic", "doctor", "vitamina", "supplement", "curso", "academia", "udemy", "coursera", "libreria",
      "librería", "book", "hobby", "mascota", "veterinar", "pet ",
      // Deportes: todo lo deportivo entra en Lifestyle
      "deporte", "deportiv", "sport", "sports", "athletic", "atletic", "atlétic", "padel", "pádel",
      "tenis", "tennis", "golf", "futbol", "fútbol", "football", "soccer", "basket", "baloncesto",
      "voley", "vóley", "volleyball", "rugby", "beisbol", "béisbol", "baseball", "hockey", "boxeo",
      "boxing", "muay thai", "kickboxing", "jiu jitsu", "jiujitsu", "bjj", "judo", "karate", "taekwondo",
      "mma", "escalada", "climbing", "boulder", "surf", "kitesurf", "paddle", "kayak club", "vela",
      "buceo", "diving", "esqui", "esquí", "ski", "snowboard", "patinaje", "skate", "ciclismo",
      "cycling", "spinning", "triatlon", "triatlón", "maraton", "maratón", "running", "carrera 10k",
      "natacion", "natación", "piscina", "pool club", "polideportivo", "club deportivo", "estadio",
      "stadium", "cancha", "pista de", "federacion deportiva", "federación deportiva", "entrenador",
      "personal trainer", "training", "workout", "strava", "garmin", "whoop", "decathlon", "nike",
      "adidas", "puma ", "under armour", "sportium", "forum sport", "sprinter", "jd sports",
      "intersport", "basic fit", "basic-fit", "anytime fitness", "smartfit", "smart fit", "virgin active",
      "mcfit", "vivagym", "altafit", "synergym", "dir ", "metropolitan club", "gimnasi",
    ],
  },
  {
    name: "Compras",
    hints: [
      "amazon", "zara", "h&m", "hm ", "uniqlo", "mango", "primark", "shein", "temu", "aliexpress", "ebay",
      "zalando", "el corte ingles", "el corte inglés", "ikea", "leroy",
      "mediamarkt", "fnac", "apple store", "tienda", "boutique", "shop", "store", "retail", "mall",
      "outlet", "ropa", "calzado", "sephora", "perfum",
    ],
  },
];

/** Nombres de las categorías base, en el orden que se muestran. */
export const BASE_CATEGORIES = [
  "Mercado",
  "Restaurantes",
  "Salidas",
  "Compras",
  "Viajes",
  "Transporte",
  "Lifestyle",
  "Apps",
  "Marketing digital",
  "Otros",
];

const FOOD_CATEGORIES = ["aliment", "comida", "food", "groceries", "supermerc", "restaurant"];

const hay = (t: CategorizableTx) =>
  `${t.merchant} ${t.description ?? ""} ${t.subcategory ?? ""} ${t.category ?? ""}`.toLowerCase();

const isCoreTransport = (text: string) =>
  /(^|\W)(cabify|taxi|uber|bolt|metro)(\W|$)/i.test(text);

/**
 * Clasifica una transacción. Las reglas personalizadas (custom) tienen prioridad
 * sobre las base para que el usuario pueda crear sus propias categorías.
 */
export function categorizeTx(t: CategorizableTx, custom: CategoryRule[] = []): string {
  const text = hay(t);

  // Uber Eats y Uber Food deben ir a Restaurantes, no a Transporte.
  if (/\buber\b/i.test(text) && (/\beats\b/i.test(text) || /\bfood\b/i.test(text))) return "Restaurantes";

  // Los servicios de movilidad principales siempre son Transporte, aunque
  // el EEFF o una regla personalizada traigan otra categoría.
  if (isCoreTransport(text)) return "Transporte";

  for (const rule of custom) {
    if (rule.hints.some((h) => h && text.includes(h.toLowerCase()))) return rule.name;
  }

  // Google Play, Google Cloud, YouTube y Google One son suscripciones/apps, no marketing.
  if (text.includes("google") && (
    text.includes("play") ||
    text.includes("cloud") ||
    text.includes("youtube") ||
    text.includes("google one") ||
    text.includes("googleone") ||
    text.includes("workspace") ||
    text.includes("gmail") ||
    text.includes("photos")
  )) return "Apps";

  for (const rule of RULES) {
    if (rule.hints.some((h) => text.includes(h))) return rule.name;
  }

  const original = t.category ?? "Sin categoría";
  // "Alimentación" sin comercio reconocible: por defecto es mercado.
  if (FOOD_CATEGORIES.some((c) => original.toLowerCase().includes(c))) return "Mercado";

  // Lo que no reconoce ninguna regla se agrupa como Otros.
  return "Otros";
}
