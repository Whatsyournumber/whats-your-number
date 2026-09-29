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
export type GroceryRule = { id: string; match: string; group: GroceryGroup };
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

/** Receipt lines can use abbreviated shop labels as well as ordinary product names. */
export function groceryGroup(name: string, rules: GroceryRule[] = []): GroceryGroup {
  const text = normalize(name);
  const saved = rules.find((rule) => GROCERY_GROUPS.includes(rule.group) && normalize(rule.match) && match(text, [normalize(rule.match)]));
  if (saved) return saved.group;
  // Specific prepared food, baby and household products take precedence over shared food words.
  if (match(text, ["congelado", "congelados", "frozen", "pizza", "plato preparado", "platos preparados", "comida preparada", "ready meal", "ready meals", "precocinado", "precocinados", "lasana", "lasaña", "croquetas", "nuggets", "empanada", "sopa preparada"])) return "prepared";
  if (match(text, ["bebe", "infantil", "papilla", "potito", "panal", "panales", "diaper", "diapers", "baby", "mascota", "mascotas", "perro", "gato", "pienso", "pet", "dog food", "cat food", "formula infantil"])) return "babyPets";
  if (match(text, ["detergente", "lejia", "jabon lavadora", "limpiador", "limpieza", "suavizante", "papel higienico", "papel cocina", "bolsa basura", "bolsas basura", "bolsas", "lavavajillas", "esponja", "servilleta", "dish soap", "cleaner", "laundry", "toilet paper", "trash bag", "tissue", "fairy", "higienico"])) return "home";
  if (match(text, ["champu", "shampoo", "gel ducha", "gel corporal", "desodorante", "dentifrico", "pasta dental", "cepillo dental", "crema facial", "crema corporal", "compresa", "tampon", "razor", "toothpaste", "deodorant", "serum", "protector solar", "spf50", "skincare", "vitamina", "vitaminas", "multivitaminico", "multivitaminicos", "suplemento", "suplementos", "omega 3", "omega3", "dove", "olay"])) return "personal";
  if (match(text, ["chocolate", "galleta", "galletas", "dulce", "dulces", "caramelo", "caramelos", "refreshers", "helado", "patatas fritas", "snack", "snacks", "golosina", "chuche", "cookie", "cookies", "candy", "chips", "ice cream", "biscuit", "crisp", "gominola", "nacho", "popcorn", "palomitas", "barrita", "barritas", "almendras", "almond", "almonds", "nuts", "frutos secos"])) return "snacks";
  if (match(text, ["agua", "zumo", "jugo", "refresco", "cafe", "te", "cerveza", "vino", "cola", "soda", "juice", "coffee", "tea", "beer", "wine", "water", "bebida", "bebidas", "leche de avena", "oat milk"])) return "drinks";
  if (match(text, ["leche", "queso", "yogur", "yogures", "yogurt", "mantequilla", "nata", "milk", "cheese", "butter", "cream", "lacteo", "lacteos", "kefir"])) return "dairy";
  if (match(text, ["salsa de tomate", "tomate frito", "tomato sauce", "atun en lata", "canned tuna"])) return "pantry";
  if (match(text, ["carne", "pollo", "ternera", "res", "cerdo", "pavo", "jamon", "salmon", "pescado", "atun", "gamba", "huevo", "huevos", "tofu", "beef", "chicken", "pork", "fish", "egg", "eggs", "meat", "protein", "proteina", "proteinas", "sausage", "salchicha", "bacon", "solomillo", "albondigas", "filete", "filetes", "pechuga", "pechugas", "finissimas", "finisimas"])) return "protein";
  if (match(text, ["fruta", "frutas", "verdura", "verduras", "vegetal", "vegetales", "ensalada", "lechuga", "tomate", "cebolla", "zanahoria", "platano", "banana", "manzana", "naranja", "aguacate", "brocoli", "patata", "papa", "fresa", "uva", "limon", "pepino", "espinaca", "fruit", "vegetable", "lettuce", "apple", "orange", "potato", "avocado", "onion", "berry", "pepper", "pimiento", "calabacin", "pera", "melon", "sandia", "mandarina"])) return "produce";
  if (match(text, ["pan", "baguette", "barra pan", "tostada", "croissant", "bolleria", "tortilla", "bread", "bagel", "toast", "muffin", "bun", "arroz", "pasta", "cereal", "cereales", "avena", "rice", "oat", "oats", "spaghetti", "macarrones", "harina", "flour"])) return "bakery";
  if (match(text, ["aceite", "azucar", "sal", "lenteja", "lentejas", "garbanzo", "garbanzos", "alubia", "conserva", "conservas", "tomate frito", "oil", "sugar", "bean", "beans", "lentil", "lentils", "sauce", "salsa", "salsas", "condimento", "condimentos", "especias", "atun en lata", "canned", "aceituna", "aceitunas", "oliva", "olivas", "olives", "gordal", "encurtido", "encurtidos", "vinagre", "mayonesa", "ketchup", "mostaza", "caldo"])) return "pantry";
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