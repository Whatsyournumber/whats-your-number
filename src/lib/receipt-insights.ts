import type { Tx } from "@/hooks/use-transactions";

export type ReceiptItem = { name: string; amount: number; category: string };

const PREFIX = "wyn-receipt:";
const SHARED_RECEIPT_MARKER = "|wyn-receipt:";

/** Keep split/name metadata for shared expenses alongside itemized products. */
export function sharedReceiptDescription(split: string, name: string, items: ReceiptItem[]): string {
  return `shared:${split}|${name}${items.length ? `${SHARED_RECEIPT_MARKER}${JSON.stringify(items)}` : ""}`;
}

/** A receipt's line amounts are in the transaction's original currency. */
export function receiptItemsFrom(description: string | null | undefined): ReceiptItem[] {
  const detail = description?.startsWith(PREFIX)
    ? description.slice(PREFIX.length)
    : description?.startsWith("shared:") && description.includes(SHARED_RECEIPT_MARKER)
      ? description.slice(description.indexOf(SHARED_RECEIPT_MARKER) + SHARED_RECEIPT_MARKER.length)
      : null;
  if (!detail) return [];
  try {
    const parsed: unknown = JSON.parse(detail);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item: unknown) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const name = typeof row["name"] === "string" ? row["name"].trim() : "";
      const amount = Number(row["amount"]);
      const category = typeof row["category"] === "string" ? row["category"] : "Otros";
      return name && Number.isFinite(amount) && amount > 0 ? [{ name, amount, category }] : [];
    });
  } catch {
    return [];
  }
}

export type GroceryGroup = "protein" | "produce" | "dairy" | "bakery" | "pantry" | "snacks" | "drinks" | "prepared" | "personal" | "home" | "babyPets" | "other";
export const GROCERY_GROUPS: GroceryGroup[] = ["protein", "produce", "dairy", "bakery", "pantry", "snacks", "drinks", "prepared", "personal", "home", "babyPets", "other"];
export type GroceryRule = { id: string; match: string; group: GroceryGroup; origin?: "added" | "corrected" };
export const GROCERY_LABELS: Record<GroceryGroup, { es: string; en: string; icon: string; detailEs: string; detailEn: string; color: string }> = {
  protein: { es: "Carne y proteínas", en: "Meat & protein", icon: "🥩", detailEs: "Carne, pollo, pescado, huevos y proteína deportiva", detailEn: "Meat, chicken, fish, eggs and sports protein", color: "bg-chart-5" },
  produce: { es: "Frutas y verduras", en: "Fruit & vegetables", icon: "🥬", detailEs: "Frutas, verduras, ensaladas y productos frescos", detailEn: "Fruit, vegetables, salads and fresh produce", color: "bg-chart-1" },
  dairy: { es: "Lácteos", en: "Dairy", icon: "🥛", detailEs: "Leche, queso, yogur y mantequilla", detailEn: "Milk, cheese, yogurt and butter", color: "bg-chart-3" },
  bakery: { es: "Panadería y cereales", en: "Bakery & grains", icon: "🍞", detailEs: "Pan, arroz, pasta, cereales y avena", detailEn: "Bread, rice, pasta, cereal and oats", color: "bg-chart-6" },
  pantry: { es: "Despensa", en: "Pantry", icon: "🥫", detailEs: "Conservas, aceitunas, salsas, aceite, condimentos y alimentos básicos", detailEn: "Canned food, olives, sauces, oil, seasonings and staples", color: "bg-chart-7" },
  snacks: { es: "Snacks y dulces", en: "Snacks & sweets", icon: "🍿", detailEs: "Chocolates, galletas, frutos secos, palomitas, barritas y caramelos", detailEn: "Chocolate, cookies, nuts, popcorn, bars and sweets", color: "bg-chart-4" },
  drinks: { es: "Bebidas", en: "Drinks", icon: "🥤", detailEs: "Agua, refrescos, zumos, café y té", detailEn: "Water, soft drinks, juice, coffee and tea", color: "bg-chart-2" },
  prepared: { es: "Congelados y preparados", en: "Frozen & prepared", icon: "❄️", detailEs: "Congelados, platos preparados y comida lista para consumir", detailEn: "Frozen products, ready meals and prepared food", color: "bg-chart-3" },
  personal: { es: "Cuidado personal", en: "Personal care", icon: "🧴", detailEs: "Champú, cosmética, desodorante, vitaminas y suplementos", detailEn: "Shampoo, skincare, deodorant, vitamins and supplements", color: "bg-chart-6" },
  home: { es: "Hogar y limpieza", en: "Home & cleaning", icon: "🧽", detailEs: "Detergente, papel, productos de limpieza y bolsas", detailEn: "Detergent, paper, cleaning products and bags", color: "bg-chart-2" },
  babyPets: { es: "Bebé / Mascotas", en: "Baby / Pets", icon: "👶", detailEs: "Pañales, comida infantil y productos para mascotas", detailEn: "Diapers, baby food and pet products", color: "bg-chart-5" },
  other: { es: "Otros", en: "Other", icon: "🛒", detailEs: "Productos que aún no se han podido clasificar", detailEn: "Products not yet classified", color: "bg-chart-8" },
};

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const match = (text: string, words: string[]) => words.some((word) => ` ${text} `.includes(` ${word} `));

/**
 * Built-in receipt vocabulary. Keep specific groups first in groceryGroup:
 * receipt labels are often abbreviated, brand-heavy and omit accents.
 */
const GROCERY_VOCABULARY: Record<GroceryGroup, string[]> = {
  prepared: [
    "congelado", "congelados", "ultracongelado", "frozen", "pizza", "plato preparado", "platos preparados", "comida preparada", "ready meal", "ready meals",
    "precocinado", "precocinados", "lasana", "croquetas", "nuggets", "empanada", "sopa preparada", "gazpacho", "salmorejo", "canelones", "ravioli fresco",
    "patatas congeladas", "verduras congeladas", "helado salado", "masa pizza", "comida lista", "calentar y servir", "microondas", "sushi", "tortilla preparada",
  ],
  babyPets: [
    "bebe", "infantil", "papilla", "potito", "panal", "panales", "toallitas bebe", "diaper", "diapers", "baby", "formula infantil", "leche infantil",
    "mascota", "mascotas", "perro", "gato", "pienso", "pet", "dog food", "cat food", "comida perro", "comida gato", "arena gato", "cat litter",
    "snack perro", "snack gato", "champu mascota", "collar antiparasitario", "hueso perro", "whiskas", "pedigree", "ultima", "purina",
  ],
  home: [
    "detergente", "lejia", "jabon lavadora", "limpiador", "limpieza", "limpiahogar", "limpia hogar", "desengrasante", "desatascador", "suavizante",
    "papel higienico", "papel cocina", "rollo cocina", "bolsa basura", "bolsas basura", "bolsa plastico", "bolsa de plastico", "bolsa reciclada", "bolsas",
    "lavavajillas", "lavaplatos", "esponja", "estropajo", "bayeta", "servilleta", "panuelos", "tissue", "dish soap", "cleaner", "laundry", "toilet paper", "trash bag",
    "fairy", "higienico", "quitagrasas", "limpiacristales", "limpia cristales", "limpiador bano", "limpiador wc", "limpia wc", "ambientador", "insecticida",
    "film transparente", "papel aluminio", "papel de horno", "guantes limpieza", "pastillas lavavajillas", "capsulas lavadora", "desinfectante", "fregasuelos",
    "escoba", "fregona", "recogedor", "cepillo limpieza", "vela", "cerillas", "pilas", "bombilla", "lanta",
  ],
  personal: [
    "champu", "shampoo", "acondicionador", "mascarilla cabello", "gel ducha", "gel corporal", "jabon manos", "desodorante", "dentifrico", "pasta dental",
    "cepillo dental", "hilo dental", "enjuague bucal", "crema facial", "crema corporal", "compresa", "compresas", "tampon", "tampones", "razor", "maquinilla",
    "toothpaste", "deodorant", "serum", "protector solar", "spf50", "skincare", "vitamina", "vitaminas", "multivitaminico", "suplemento", "suplementos",
    "omega 3", "omega3", "dove", "olay", "desmaquillante", "agua micelar", "algodon", "bastoncillos", "papel facial", "preservativo", "lubricante",
    "tinte cabello", "laca", "espuma pelo", "cuchilla afeitar", "espuma afeitar", "colonia", "perfume", "balsamo labial", "protector labial",
  ],
  snacks: [
    "chocolate", "galleta", "galletas", "dulce", "dulces", "caramelo", "caramelos", "refreshers", "helado", "patatas fritas", "snack", "snacks", "golosina",
    "chuche", "chuches", "cookie", "cookies", "candy", "chips", "ice cream", "biscuit", "crisp", "gominola", "gominolas", "nacho", "nachos", "popcorn",
    "palomitas", "barrita", "barritas", "almendras", "almendra", "almond", "almonds", "nuts", "frutos secos", "pistacho", "pistachos", "cacahuete", "cacahuetes",
    "anacardo", "anacardos", "nuez", "nueces", "avellana", "avellanas", "turron", "bombones", "donut", "donuts", "magdalena", "magdalenas", "bizcocho",
    "barquillo", "regaliz", "oreo", "kitkat", "kinder", "nutella",
  ],
  drinks: [
    "agua", "agua mineral", "agua con gas", "zumo", "jugo", "refresco", "cafe", "te", "infusion", "cerveza", "vino", "cola", "soda", "juice", "coffee",
    "tea", "beer", "wine", "water", "bebida", "bebidas", "leche de avena", "leche almendras", "leche de almendras", "leche soja", "bebida vegetal",
    "oat milk", "almond milk", "soy milk", "tonica", "limonada", "batido", "smoothie", "sidra", "cava", "champan", "ron", "ginebra", "vodka", "whisky",
    "isotonica", "energetica", "energy drink", "coca cola", "cocacola", "pepsi", "fanta", "sprite", "aquarius", "nestea",
  ],
  dairy: [
    "leche", "queso", "yogur", "yogures", "yogurt", "mantequilla", "nata", "milk", "cheese", "butter", "cream", "lacteo", "lacteos", "kefir",
    "requeson", "ricotta", "mozzarella", "parmesano", "manchego", "cheddar", "emmental", "gouda", "queso fresco", "queso crema", "crema de queso",
    "postre lacteo", "cuajada", "flan", "natillas", "petit suisse", "actimel", "danone",
  ],
  pantry: [
    "aceite", "azucar", "sal", "lenteja", "lentejas", "garbanzo", "garbanzos", "alubia", "alubias", "conserva", "conservas", "tomate frito",
    "salsa de tomate", "tomato sauce", "oil", "sugar", "bean", "beans", "lentil", "lentils", "sauce", "salsa", "salsas", "condimento", "condimentos",
    "especias", "atun en lata", "canned tuna", "canned", "aceituna", "aceitunas", "oliva", "olivas", "olives", "gordal", "encurtido", "encurtidos", "vinagre",
    "mayonesa", "ketchup", "mostaza", "caldo", "maiz lata", "guisantes lata", "esparragos lata", "alcachofa lata", "mermelada", "miel", "cacao soluble",
    "levadura", "bicarbonato", "pan rallado",
    "pure patata", "sopa sobre", "crema cacao", "paté", "pate", "hummus", "tabasco", "soja salsa", "salsa soja", "pesto", "alioli",
  ],
  protein: [
    "carne", "pollo", "ternera", "res", "cerdo", "pavo", "cordero", "conejo", "jamon", "salmon", "pescado", "atun", "gamba", "gambas", "langostino",
    "marisco", "calamar", "sepia", "pulpo", "poton", "sardina", "sardinillas", "merluza", "bacalao", "dorada", "lubina", "huevo", "huevos", "tofu",
    "beef", "chicken", "pork", "fish", "egg", "eggs", "meat", "protein", "proteina", "proteinas", "sausage", "salchicha", "salchichas", "bacon",
    "solomillo", "albondigas", "filete", "filetes", "pechuga", "pechugas", "finissimas", "finisimas", "hamburguesa", "hamburguesas", "carne picada",
    "chuleta", "chuletas", "costilla", "costillas", "lomo", "chorizo", "salami", "fuet", "mortadela", "embutido", "embutidos", "fiambre", "surimi",
    "mejillon", "mejillones", "almeja", "almejas", "navajas", "bocaditos mar", "tempeh", "seitan",
  ],
  produce: [
    "fruta", "frutas", "verdura", "verduras", "vegetal", "vegetales", "ensalada", "lechuga", "tomate", "cebolla", "zanahoria", "platano", "banana",
    "manzana", "naranja", "aguacate", "brocoli", "patata", "papa", "fresa", "uva", "limon", "pepino", "espinaca", "fruit", "vegetable", "lettuce",
    "apple", "orange", "potato", "avocado", "onion", "berry", "pepper", "pimiento", "calabacin", "pera", "melon", "sandia", "mandarina", "champiñon",
    "champinon", "champiñones", "champinones", "seta", "setas", "ajo", "puerro", "apio", "col", "repollo", "coliflor", "berenjena", "calabaza", "judias verdes",
    "guisante", "guisantes", "esparrago", "esparragos", "alcachofa", "alcachofas", "remolacha", "rabano", "maiz fresco", "kiwi", "mango", "pina",
    "melocoton", "nectarina", "ciruela", "cereza", "cerezas", "frambuesa", "arandano", "arandanos", "mora", "granada", "pomelo", "coco", "datil", "datiles",
  ],
  bakery: [
    "pan", "baguette", "barra pan", "tostada", "tostadas", "croissant", "bolleria", "tortilla trigo", "tortillas trigo", "tortilla maiz", "tortillas maiz",
    "tortillas mexicanas", "wrap", "wraps", "bread", "bagel", "toast", "muffin", "bun", "arroz", "pasta", "cereal", "cereales", "avena", "rice", "oat", "oats",
    "spaghetti", "espagueti", "espaguetis", "macarrones", "harina", "flour", "fideos", "noodles", "cuscus", "quinoa", "trigo", "cebada", "centeno",
    "pan molde", "pan integral", "pan pita", "pan hamburguesa", "pan perrito", "tortita", "tortitas", "granola", "muesli", "galletas saladas",
  ],
  other: [],
};

/** Receipt lines can use abbreviated shop labels as well as ordinary product names. */
export function groceryGroup(name: string, rules: GroceryRule[] = []): GroceryGroup {
  const text = normalize(name);
  const saved = rules.find((rule) => GROCERY_GROUPS.includes(rule.group) && normalize(rule.match) && match(text, [normalize(rule.match)]));
  if (saved) return saved.group;
  // Specific groups precede broad food words so composite labels remain accurate.
  const precedence: GroceryGroup[] = ["prepared", "babyPets", "home", "personal", "snacks", "drinks", "dairy", "pantry", "protein", "produce", "bakery"];
  for (const group of precedence) {
    if (match(text, GROCERY_VOCABULARY[group].map(normalize))) return group;
  }
  return "other";
}

export type GrocerySummary = {
  groups: { id: GroceryGroup; amount: number; count: number; previousAmount: number; previousCount: number; products: { name: string; amount: number; count: number }[] }[];
  receiptCount: number;
  previousReceiptCount: number;
  total: number;
  previousTotal: number;
};

export function summarizeGroceryReceipts(items: Tx[], previousItems: Tx[] = [], rules: GroceryRule[] = []): GrocerySummary {
  const groups = new Map(GROCERY_GROUPS.map((id) => [id, { id, amount: 0, count: 0, previousAmount: 0, previousCount: 0, products: [] as { name: string; amount: number; count: number }[] }]));
  const counts = [0, 0];
  for (const [period, transactions] of [items, previousItems].entries()) {
    for (const tx of transactions) {
      const lines = receiptItemsFrom(tx.description);
      if (!lines.length) continue;
      counts[period] = (counts[period] ?? 0) + 1;
      // Converted transactions keep their original amount, so use their actual FX ratio.
      const original = Math.abs(tx.original_amount ?? tx.amount);
      // Shared expense lines describe the entire basket, while the transaction
      // contains only this person's share. Scale by that share before FX conversion.
      const lineTotal = lines.reduce((sum, line) => sum + line.amount, 0);
      const ratio = tx.description?.startsWith("shared:") && lineTotal > 0
        ? Math.abs(tx.amount) / lineTotal
        : original > 0 ? Math.abs(tx.amount) / original : 1;
      for (const line of lines) {
        const group = groups.get(groceryGroup(line.name, rules));
        if (!group) continue;
        const amount = line.amount * ratio;
        if (period === 0) {
          group.amount += amount;
          group.count += 1;
          const key = normalize(line.name);
          const product = group.products.find((p) => normalize(p.name) === key);
          if (product) { product.amount += amount; product.count += 1; }
          else group.products.push({ name: line.name, amount, count: 1 });
        } else {
          group.previousAmount += amount;
          group.previousCount += 1;
        }
      }
    }
  }
  const result = [...groups.values()].filter((g) => g.amount > 0).sort((a, b) => b.amount - a.amount);
  for (const group of result) group.products.sort((a, b) => b.amount - a.amount);
  return {
    groups: result,
    receiptCount: counts[0] ?? 0,
    previousReceiptCount: counts[1] ?? 0,
    total: result.reduce((sum, group) => sum + group.amount, 0),
    previousTotal: [...groups.values()].reduce((sum, group) => sum + group.previousAmount, 0),
  };
}
/**
 * Nombres de tienda compartidos: el comparador y el análisis de tickets
 * tienen que llamar «AhorraMas» al mismo comercio, no «SUM*AHORRAMAS SRL».
 */
/** Tiendas que el usuario confirmó que son la misma. */
const STORE_ALIASES: [RegExp, string][] = [
  [/ponzano|supercor/, "ponzano"],
  [/^m?p?dia$|mpdia|^dia/, "dia"],
];

/** Nombre corto y legible para las tiendas unidas por alias. */
const STORE_DISPLAY: Record<string, string> = {
  ponzano: "Super Ponzano",
  dia: "MPDIA",
  ahorramas: "AhorraMas",
};

export const storeDisplayName = (key: string, fallback: string) => STORE_DISPLAY[key] ?? fallback;

/** Quita formas jurídicas, cifras y símbolos del nombre del comercio. */
export const cleanStore = (s: string) =>
  s
    .replace(/\b(s\.?a\.?|s\.?l\.?|sucursal|tienda|madrid|barcelona)\b/gi, "")
    .replace(/[0-9#*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Palabras genéricas que no distinguen una tienda: "SUP.EX. PONZANO" y "Super Express Ponzano" son la misma. */
const GENERIC_STORE_TOKENS = new Set([
  "super", "supermercado", "sup", "ex", "exp", "expreso", "expres", "express", "market", "mercado",
  "tienda", "sucursal", "hiper", "hipermercado", "minimarket", "shop", "store", "sl", "sa",
  "groceries", "grocery", "alimentacion", "comestibles", "food", "foods",
  "de", "la", "el", "los", "las", "del", "y",
]);

const storeTokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !GENERIC_STORE_TOKENS.has(w) && !/^\d+$/.test(w));

/** Clave que une las variantes del mismo comercio ("AHORRA MAS" = "Ahorramas"). */
export const storeKey = (s: string) => {
  const tokens = storeTokens(s);
  // Sin espacios para unir "Ahorramas" y "AHORRA MAS" en la misma tienda
  const key = (tokens.length ? tokens : storeTokens(cleanStore(s))).slice(0, 2).join("");
  const all = storeTokens(s).join("");
  for (const [re, alias] of STORE_ALIASES) if (re.test(key) || re.test(all)) return alias;
  return key;
};
