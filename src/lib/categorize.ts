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

/**
 * Movimientos que NO son gasto variable: duplican gastos fijos ya declarados,
 * son traspasos entre cuentas o pagos de tarjeta.
 */
export const EXCLUDED_HINTS = [
  "servicio en un 2x3",
  "servicio 2x3",
  "servicio en un 2*3",
  "2x3",
  "pago de tarjeta",
  "pago tarjeta",
  "pago a tu tarjeta",
  "abono a su cuenta",
  "transferencia propia",
  "traspaso",
  "mercantil seguros",
];

/** Comercios concretos con categoría forzada (tienen prioridad sobre las reglas). */
const MERCHANT_OVERRIDES: { hints: string[]; category: string }[] = [
  {
    category: "Nightlife",
    hints: [
      "blondie", "gabana", "saint club", "urban club", "insomnio", "secrets chueca", "florida park",
      "o clock", "terraza abc", "trastevere rooftop", "zamira lounge", "cabaret", "fourvenues",
      "le boulevard", "panthera", "blue tap house", "la rumba", "carpe diem terrace", "tantalo roofbar",
      "sole beach club", "vento beach club", "college events", "fabrica de suenos", "fábrica de sueños",
      "la rana dorada", "gota wine", "vinology", "castellana 8", "el templo", "papaya hosteleria",
      "golden wave", "bamvolea", "umusic",
    ],
  },
  {
    category: "Deportes",
    hints: [
      "cr7", "crunch fit", "fairplay padel", "padel world", "world padel", "padel nuestro", "playtomic",
      "decathlon", "baqueira forfaits", "toti ski", "totiaran", "park and padel", "sport center",
      "fitvending", "nyx*fit",
    ],
  },
  {
    category: "Restaurantes",
    hints: [
      "myka", "vasuak", "marabu", "marabú", "la esquinita gourmet", "dionisos", "la flaca", "honest greens",
      "walk a mole", "bienmesabe", "celicioso", "la mamona", "la sirena madrid", "lateral ponzano",
      "nolita", "el patio madrid", "gracias padre", "sibuya", "tartufo", "vicio", "kausa", "makan",
      "ombra", "mandarosso", "peppe fusco", "tracatra", "mazal", "chiton", "torcuato", "fanatica",
      "lalala molina", "la que faltaba", "poca solta", "galipan", "galipán", "castizo", "casa suecia",
      "casa longinos", "el gran jamonal", "muchas gracias", "la huerta", "la taska", "la destileria",
      "la destilería", "la cantina", "brief atocha", "kuikku", "domo murisca", "mon parnasse",
      "montsec", "artisa", "obeid", "metl", "karau", "mira mira", "asian garden", "aangan", "zetor",
      "jatkil", "w-restaurants", "sala despiece", "sala de despiece", "doble y gilda", "canas y tapas",
      "cañas y tapas", "elcano tavern", "beths", "beth's", "la esquina de recoleto", "la chocita",
      "la agujafina", "la aguja fina", "forn la torna", "maison kayser", "charlie s cream", "umi house",
      "wimpys", "habbobs", "gamboa baking", "la arepería", "la areperia", "nacion sushi", "esa flaca rica",
      "fitness food", "bo specialty", "clima cafecito", "rebel cafe", "sax caffe", "caffe armonia",
      "eunoia", "big mamma", "dadycon", "frankie burger", "anti burger", "vino e focaccia",
      "vinoefocaccia", "reginella", "istawood", "le caffetterie", "hostel", "kiki riki", "olimpia - r",
      "tobacco s press", "quisco", "mo mo coffee", "singular restaurant", "lucca tratoria", "pastisser",
      "pasteleria", "pastelería", "sonder", "mini super daniel", "riva milica", "sp oasis", "tr nita",
      "basca doo", "dekaderon", "matesevo", "prijepolje", "algetarik", "host auy", "la imprenta",
      "capon mejia", "capón mejía", "hostelería", "hosteleria", "restauracion", "restauración",
      "la chocita", "world wide kebab", "aguachiles", "frozen yogurt", "myka frozen",
    ],
  },
  {
    category: "Marketing digital",
    hints: ["linkedin", "lovable"],
  },
  {
    category: "Apps",
    hints: [
      "tinder", "bumble", "inner circle", "faceapp", "unfold", "nebula", "wingman", "spliiit",
      "coursiv", "invideo", "vidiq", "zadarma", "workana", "gamma.app", "elevenlabs", "helium10",
      "nightwatch", "ubersuggest", "zoho", "twilio", "sendgrid", "paddle.net",
    ],
  },

  {
    category: "Salud",
    hints: [
      "hammam", "loyly", "rituals", "marco aldany", "barber", "barberia",
      "barbería", "coronado beauty", "cl.dental", "dental care",
      "clinica odont", "clínica odont", "herbolario", "apoteka",
    ],
  },

  {
    category: "Compras",
    hints: [
      "muebles jamar", "colineal", "nordik small living", "do it center", "el machetazo", "mirgor",
      "marcoled", "silbon", "el ganso", "zara", "defacto", "wh smith", "whsmith", "air side store",
      "bazar", "multitienda", "wondermarket",
      // Ropa y calzado que antes caía en "Otros"
      "doppelganger", "doppelgänger", "beso shop", "sin-pies", "sinpies", "longplay industries",
      "fourbrothers", "four brothers", "campo simbolico", "campo simbólico", "alta group",
      "the matbath", "dolly bel",
    ],
  },
];

/** Categorías base del sistema (en orden de prioridad de match). */
export const RULES: CategoryRule[] = [
  {
    name: "Viajes",
    hints: [
      "viaj", "vuelo", "aeroli", "airline", "airlines", "hotel", "airbnb", "booking", "bkg*", "expedia",
      "crucero", "hostal", "despegar", "latam", "avianca", "iberia", "ryanair", "vueling", "turismo",
      "travel", "flight", "aeropuerto", "airport", "kayak", "trip", "resort", "air europa", "air serbia",
      "aeroitalia", "pegasus", "copa air", "ajet hava", "apartmani", "lodging", "sixt", "airalo",
      "travibly", "omio", "flixbus",
    ],
  },
  {
    name: "Apps",
    hints: [
      "app store", "appstore", "google play", "play store", "itunes", "spotify", "netflix", "hbo", "max ",
      "disney", "prime video", "amazon prime", "youtube premium", "apple music", "apple tv", "icloud",
      "dropbox", "notion", "figma", "canva", "adobe", "microsoft 365", "office 365", "openai", "chatgpt",
      "claude", "midjourney", "github", "slack", "zoom", "linear", "vercel", "netlify", "aws",
      "amazon web services", "google cloud", "google one", "workspace", "digitalocean", "instagram",
      "suscripcion", "suscripción", "subscription", "saas", "software", "dating",
    ],
  },
  {
    name: "Marketing digital",
    hints: [
      "google ads", "googleads", "meta ads", "facebook ads", "facebk ads", "fb ads", "instagram ads",
      "tiktok ads", "tik tok ads", "linkedin ads", "twitter ads", "x ads", "adwords", "ads manager",
      "publicidad", "marketing", "mailchimp", "hubspot", "klaviyo", "semrush", "ahrefs", "hootsuite",
      "buffer", "shopify", "wix", "squarespace", "godaddy", "namecheap", "webflow", "campaign",
      "facebook", "facebk", "meta", "tiktok", "tik tok", "youtube ads",
    ],
  },
  {
    name: "Transporte",
    hints: [
      "uber", "cabify", "didi", "bolt", "taxi", "taksi", "lyft", "licencia", "lic ", "llic", "metro ",
      "metro de", "subway station", "bus ", "autobus", "autobús", "renfe", "cercanias", "cercanías",
      "tren", "train", "peaje", "toll", "parking", "naplatna", "autoceste", "putevi",
      "estacionamiento", "gasolin", "combustible", "fuel", "shell", "repsol", "texaco", "chevron",
      "petro", "terpel", "eds ", "esso", "bp ", "carwash", "lavado de auto", "taller", "mecanic",
      "mecánic", "neumatic", "neumátic", "llanta", "seguro auto", "revision tecnica", "scooter",
      "bicicleta", "panapass", "cuota carro",
    ],
  },
  {
    name: "Bancos & Seguros",
    hints: [
      "banco", "bank", "banca", "banesco", "bbva", "santander", "caixa", "caixabank", "sabadell",
      "bankinter", "ing direct", "openbank", "unicaja", "abanca", "kutxabank", "ibercaja", "cajamar",
      "revolut", "n26", "wise", "monzo", "bnext", "paypal", "stripe", "payoneer", "western union",
      "moneygram", "remesa", "bancolombia", "davivienda", "bancomer", "banamex", "banorte", "itau",
      "itaú", "bradesco", "banistmo", "bac ", "credomatic", "scotiabank", "citibank", "chase",
      "wells fargo", "hsbc", "deutsche bank", "credit agricole", "societe generale",
      "comision", "comisión", "commission", "fee", "cuota mantenimiento", "mantenimiento cuenta",
      "cuota tarjeta", "tarjeta credito", "tarjeta crédito", "credit card fee", "interes", "interés",
      "intereses", "interest", "overdraft", "descubierto", "transfer fee", "feci", "itbms", "impuesto",
      "dgi", "tesoro nacional", "cambio divisa", "fx fee", "atm", "cajero", "retiro efectivo",
      "prestamo", "préstamo", "loan", "hipoteca", "mortgage", "financiacion", "financiación",
      "extrafinanciamiento", "plan saldos", "leasing", "quasicash", "onramper", "paybis", "paymonade",
      "seguro", "seguros", "insurance", "aseguradora", "poliza", "póliza", "policy", "mapfre", "assa",
      "axa", "allianz", "generali", "zurich", "adeslas", "sanitas", "asisa", "dkv", "cigna",
      "mutua", "mutual", "caser", "linea directa", "línea directa", "pelayo", "reale", "verti",
      "occident", "catalana occidente", "sura", "colsanitas", "proteccion robo", "mercantil seguros",
    ],
  },
  {
    name: "Deportes",
    hints: [
      "deporte", "deportiv", "sport", "sports", "athletic", "atletic", "atlétic", "padel", "pádel",
      "tenis", "tennis", "golf", "futbol", "fútbol", "football", "soccer", "basket", "baloncesto",
      "voley", "vóley", "volleyball", "rugby", "beisbol", "béisbol", "baseball", "hockey", "boxeo",
      "boxing", "muay thai", "kickboxing", "jiu jitsu", "jiujitsu", "bjj", "judo", "karate", "taekwondo",
      "mma", "escalada", "climbing", "boulder", "surf", "kitesurf", "vela", "buceo", "diving",
      "esqui", "esquí", "ski", "snowboard", "forfait", "patinaje", "skate", "ciclismo", "cycling",
      "spinning", "triatlon", "triatlón", "maraton", "maratón", "running", "natacion", "natación",
      "piscina", "polideportivo", "club deportivo", "estadio", "stadium", "cancha", "gimnasio",
      "gimnasi", "gym", "fitness", "crossfit", "yoga", "pilates", "federacion deportiva",
      "personal trainer", "training", "workout", "strava", "garmin", "whoop", "nike", "adidas",
      "puma ", "under armour", "sportium", "forum sport", "sprinter", "jd sports", "intersport",
      "basic fit", "basic-fit", "anytime fitness", "smartfit", "smart fit", "virgin active", "mcfit",
      "vivagym", "altafit", "synergym", "metropolitan club",
    ],
  },
  {
    name: "Delivery",
    hints: [
      "glovo", "ubereats", "uber eats", "rappi", "just eat", "justeat", "deliveroo", "doordash",
      "pedidosya", "delivery", "domicilio", "a domicilio", "getir", "gorillas", "wolt", "grubhub",
      "didi food", "didifood", "ifood",
    ],
  },
  {
    name: "Nightlife",
    hints: [
      "bar ", " bar", "bar,", "pub", "cervec", "brewery", "cocktail", "coctel", "cóctel", "disco",
      "discoteca", "club nocturno", "nightclub", "night club", "beach club", "lounge", "rooftop",
      "roofbar", "terrace", "terraza", "cine", "cinema", "cinepolis", "cinépolis", "yelmo", "teatro",
      "theater", "concierto", "concert", "festival", "ticketmaster", "eventbrite", "entradas eventos",
      "taquillas", "boliche", "bowling", "karaoke", "casino", "entretenimiento", "nightlife", "copas",
      "wine bar", "vinoteca", "fandango", "ocio", "club", "clubs", "clubes",
      "vida nocturna", "vidanocturna", "night", "noche", "after", "antro", "coctele",

    ],
  },
  {
    name: "Restaurantes",
    hints: [
      "restaurant", "restaurante", "restoran", "resto", "rte.", "ristorante", "trattoria", "tratoria",
      "cafe", "café", "caffe", "cafeteria", "cafetería", "coffee", "starbucks", "mcdonald", "burger",
      "burguer", "kfc", "popeyes", "subway", "pizza", "sushi", "taco", "kebab", "suvlak", "grill",
      "gastro", "gastrobar", "bistro", "brunch", "tapas", "pintxos", "taberna", "tavern", "konoba",
      "panaderia", "panadería", "bakery", "baking", "heladeria", "heladería", "food", "comida",
      "gourmet", "deli", "kitchen", "cocina", "asador", "parrilla", "marisqu", "ramen", "wok", "poke",
      "arepe", "empanad", "aperitiv", "gelat", "creper", "pastel", "vinos",
    ],
  },

  {
    name: "Mercado",
    hints: [
      "supermercado", "supermarket", "sup.ex", "super ex", "supercor", "mercado", "market", "grocer",
      "abarrote", "mercadona", "carrefour", "lidl", "aldi", "dia 1", "mp**dia", "alcampo", "eroski",
      "consum", "walmart", "costco", "kroger", "whole foods", "trader joe", "wong", "jumbo", "exito",
      "éxito", "olimpica", "olímpica", "k-market", "k-citymarket", "riba smith", "super 99", "el rey",
      "pricesmart", "fruteria", "frutería", "frutas", "carniceria", "carnicería", "charcuteria",
      "charcutería", "verduler", "alimentacion", "alimentación", "simplemente aliment",
      "el corte ingles-superm", "el corte inglés-superm",
    ],
  },
  {
    name: "Salud",
    hints: [
      "salud", "health", "medic", "médic", "doctor", "doctora", "consulta medica", "consulta médica",
      "clinica", "clínica", "clinic", "hospital", "policlinic", "policlínic", "centro medico",
      "centro médico", "urgencias", "ambulanc", "laboratorio clinico", "laboratorio clínico",
      "analitica", "analítica", "radiolog", "resonancia", "ecograf", "rayos x",
      "farmacia", "pharmacy", "farmacie", "apotheke", "botica", "droguer", "parafarmacia",
      "dentista", "dental", "odontolog", "ortodonc", "implante dental",
      "oftalmolog", "optica", "óptica", "optical", "lentes", "gafas", "audifon", "audiolog",
      "dermatolog", "ginecolog", "pediatr", "cardiolog", "traumatolog", "fisioterap", "physio",
      "kinesiolog", "quiroprac", "osteopat", "nutricion", "nutrición", "nutriolog", "dietist",
      "psicolog", "psiquiatr", "terapia", "therapy", "vacuna", "vaccine",
      "estetica", "estética", "aesthetic", "medicina estetica", "medicina estética",
      "dermoestetica", "dermoestética", "botox", "depilacion", "depilación", "laser", "láser",
      "peluqueria", "peluquería", "barberia", "barbería", "barber", "salon de belleza",
      "salón de belleza", "manicur", "pedicur", "nails", "beauty", "spa", "masaje", "massage",
      "wellness", "balneario", "sauna", "termal", "termas", "talaso", "thalasso",
      "vitamina", "supplement", "suplement",
    ],
  },

  {
    name: "Compras",
    hints: [
      "amazon", "amzn", "zara", "h&m", "hm ", "uniqlo", "mango", "primark", "shein", "temu",
      "aliexpress", "ebay", "zalando", "el corte ingles", "el corte inglés", "ikea", "leroy",
      "mediamarkt", "fnac", "apple store", "tienda", "boutique", "mall", "outlet", "ropa", "calzado",
      "sephora", "perfum", "muebles", "hogar", "bazar",
      // Moda / ropa genérico
      "moda", "fashion", "clothing", "clothes", "apparel", "wear", "textil", "sastre", "camiser",
      "zapater", "zapatos", "sneaker", "footwear", "denim", "jeans", "lenceria", "lencería",
      "bershka", "pull&bear", "pull and bear", "stradivarius", "massimo dutti", "oysho", "springfield",
      "cortefiel", "scalpers", "levis", "levi s", "tommy hilfiger", "calvin klein", "lacoste",
      "ralph lauren", "guess", "desigual", "bimba y lola", "sfera", "asos", "vinted", "snipes",
      "foot locker", "jd sports", "courir", "punto roma", "women s secret", "womens secret",
    ],
  },
];

/** Nombres de las categorías base, en el orden que se muestran. */
export const BASE_CATEGORIES = [
  "Mercado",
  "Restaurantes",
  "Delivery",

  "Nightlife",
  "Deportes",
  "Compras",
  "Viajes",
  "Transporte",
  "Salud",
  "Apps",
  "Marketing digital",
  "Bancos & Seguros",
  "Otros",
];

const FOOD_CATEGORIES = ["aliment", "comida", "food", "groceries", "supermerc", "restaurant"];

const hay = (t: CategorizableTx) =>
  `${t.merchant} ${t.description ?? ""} ${t.subcategory ?? ""} ${t.category ?? ""}`.toLowerCase();

const isCoreTransport = (text: string) =>
  /(^|\W)(cabify|taxi|uber|bolt|metro)(\W|$)/i.test(text);

/** True cuando el movimiento no debe contarse como gasto variable. */
export function isExcludedTx(t: CategorizableTx): boolean {
  const text = hay(t);
  return EXCLUDED_HINTS.some((h) => text.includes(h));
}

/**
 * Clasifica una transacción. Las reglas personalizadas (custom) tienen prioridad
 * sobre las base para que el usuario pueda crear sus propias categorías.
 */
export function categorizeTx(t: CategorizableTx, custom: CategoryRule[] = []): string {
  const text = hay(t);

  // Uber Eats y Uber Food deben ir a Restaurantes, no a Transporte.
  if (/\buber\b/i.test(text) && (/\beats\b/i.test(text) || /\bfood\b/i.test(text))) return "Delivery";

  // Los servicios de movilidad principales siempre son Transporte, aunque
  // el EEFF o una regla personalizada traigan otra categoría.
  if (isCoreTransport(text)) return "Transporte";

  for (const rule of custom) {
    if (rule.hints.some((h) => h && text.includes(h.toLowerCase()))) return rule.name;
  }

  // Comercios conocidos con categoría forzada.
  for (const o of MERCHANT_OVERRIDES) {
    if (o.hints.some((h) => text.includes(h))) return o.category;
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

/** Categorías que, durante un viaje, se consideran gasto del viaje. */
const TRAVEL_ABSORBED = new Set(["Transporte"]);

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Pistas que indican un vuelo (no hotel, no tour): definen el inicio/fin del viaje. */
const FLIGHT_HINTS = [
  "vuelo", "flight", "aeroli", "airline", "airlines", "airways", "aeropuerto", "airport",
  "avianca", "latam", "iberia", "vueling", "ryanair", "easyjet", "wizz", "air europa",
  "air serbia", "air france", "klm", "lufthansa", "united air", "american air", "delta air",
  "copa air", "wingo", "jetsmart", "volaris", "aeromexico", "turkish airlines", "emirates",
  "qatar airways", "level.com", "plusultra", "edreams", "kiwi.com", "skyscanner",
];

const isFlightTx = (t: CategorizableTx) => {
  const s = `${t.description ?? ""} ${t.merchant ?? ""}`.toLowerCase();
  return FLIGHT_HINTS.some((h) => s.includes(h));
};

/**
 * Días que forman parte de un viaje.
 * 1) Si hay vuelos, cada par de vuelos separados por <= 45 días define la ventana
 *    completa del viaje (ida → vuelta) y todos los días intermedios cuentan.
 * 2) Además se agrupan las fechas con otros gastos de "Viajes" (hoteles, Airbnb…)
 *    uniendo huecos de hasta 3 días y con un día de margen.
 */
export function buildTravelDays(
  txs: (CategorizableTx & { tx_date: string | null })[],
  custom: CategoryRule[] = [],
): Set<string> {
  const dated = txs.filter((t) => t.tx_date);
  const seeds = [
    ...new Set(
      dated
        .filter((t) => categorizeTx(t, custom) === "Viajes")
        .map((t) => t.tx_date!.slice(0, 10)),
    ),
  ].sort();

  const days = new Set<string>();
  const DAY = 86_400_000;
  const add = (from: Date, to: Date) => {
    for (let d = from.getTime(); d <= to.getTime(); d += DAY) days.add(dayKey(new Date(d)));
  };

  // 1) Ventanas definidas por vuelos (ida y vuelta).
  const flightDays = [
    ...new Set(dated.filter(isFlightTx).map((t) => t.tx_date!.slice(0, 10))),
  ].sort();
  for (let i = 0; i < flightDays.length - 1; i++) {
    const a = new Date(`${flightDays[i]}T00:00:00Z`);
    const b = new Date(`${flightDays[i + 1]}T00:00:00Z`);
    if (b.getTime() - a.getTime() <= 45 * DAY) add(a, b);
  }
  for (const f of flightDays) {
    const d = new Date(`${f}T00:00:00Z`);
    add(d, d);
  }

  if (seeds.length === 0) return days;

  // 2) Clusters de otros gastos de viaje.
  let start = new Date(`${seeds[0]}T00:00:00Z`);
  let end = start;
  for (const s of seeds.slice(1)) {
    const cur = new Date(`${s}T00:00:00Z`);
    if (cur.getTime() - end.getTime() <= 3 * DAY) end = cur;
    else {
      add(new Date(start.getTime() - DAY), new Date(end.getTime() + DAY));
      start = cur;
      end = cur;
    }
  }
  add(new Date(start.getTime() - DAY), new Date(end.getTime() + DAY));
  return days;
}


/** Igual que categorizeTx, pero durante un viaje restaurantes y transporte suman a "Viajes". */
export function categorizeTxWithTravel(
  t: CategorizableTx & { tx_date?: string | null },
  custom: CategoryRule[] = [],
  travelDays?: Set<string>,
): string {
  const cat = categorizeTx(t, custom);
  if (travelDays && t.tx_date && travelDays.has(t.tx_date.slice(0, 10)) && TRAVEL_ABSORBED.has(cat)) {
    return "Viajes";
  }
  return cat;
}
