import type { Tx } from "@/hooks/use-transactions";

export type ReceiptItem = { name: string; amount: number; category: string };

const PREFIX = "wyn-receipt:";

/** A receipt's line amounts are in the transaction's original currency. */
export function receiptItemsFrom(description: string | null | undefined): ReceiptItem[] {
  if (!description?.startsWith(PREFIX)) return [];
  try {
    const parsed: unknown = JSON.parse(description.slice(PREFIX.length));
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

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const match = (text: string, words: string[]) => words.some((word) => ` ${text} `.includes(` ${word} `));

/** Receipt lines can use abbreviated shop labels as well as ordinary product names. */
export function groceryGroup(name: string): GroceryGroup {
  const text = normalize(name);
  // Specific prepared food, baby and household products take precedence over shared food words.
  if (match(text, ["congelado", "congelados", "frozen", "pizza", "plato preparado", "platos preparados", "comida preparada", "ready meal", "ready meals", "precocinado", "precocinados", "lasana", "lasaña", "croquetas", "nuggets", "empanada", "sopa preparada"])) return "prepared";
  if (match(text, ["bebe", "infantil", "papilla", "potito", "panal", "panales", "diaper", "diapers", "baby", "mascota", "mascotas", "perro", "gato", "pienso", "pet", "dog food", "cat food", "formula infantil"])) return "babyPets";
  if (match(text, ["detergente", "lejia", "jabon lavadora", "limpiador", "limpieza", "suavizante", "papel higienico", "papel cocina", "bolsa basura", "bolsas basura", "bolsas", "lavavajillas", "esponja", "servilleta", "dish soap", "cleaner", "laundry", "toilet paper", "trash bag", "tissue", "fairy", "higienico"])) return "home";
  if (match(text, ["champu", "shampoo", "gel ducha", "gel corporal", "desodorante", "dentifrico", "pasta dental", "cepillo dental", "crema facial", "crema corporal", "compresa", "tampon", "razor", "toothpaste", "deodorant", "serum", "protector solar", "spf50", "skincare", "vitamina", "vitaminas", "multivitaminico", "multivitaminicos", "suplemento", "suplementos", "omega 3", "omega3", "dove", "olay"])) return "personal";
  if (match(text, ["chocolate", "galleta", "galletas", "dulce", "dulces", "caramelo", "helado", "patatas fritas", "snack", "snacks", "golosina", "chuche", "cookie", "cookies", "candy", "chips", "ice cream", "biscuit", "crisp", "gominola", "nacho", "popcorn", "palomitas", "barrita", "barritas", "almendras", "frutos secos", "salted microwave popcorn", "tostad almonds"])) return "snacks";
  if (match(text, ["agua", "zumo", "jugo", "refresco", "cafe", "te", "cerveza", "vino", "cola", "soda", "juice", "coffee", "tea", "beer", "wine", "water", "bebida", "bebidas", "leche de avena", "oat milk"])) return "drinks";
  if (match(text, ["leche", "queso", "yogur", "yogures", "yogurt", "mantequilla", "nata", "milk", "cheese", "butter", "cream", "lacteo", "lacteos", "kefir"])) return "dairy";
  if (match(text, ["carne", "pollo", "ternera", "res", "cerdo", "pavo", "jamon", "salmon", "pescado", "atun", "gamba", "huevo", "huevos", "tofu", "beef", "chicken", "pork", "fish", "egg", "eggs", "meat", "protein", "proteina", "proteinas", "sausage", "salchicha", "bacon", "solomillo", "albondigas", "filete", "filetes", "ic ajojo solomillo", "sup exp albondigas", "el pozo"])) return "protein";
  if (match(text, ["fruta", "frutas", "verdura", "verduras", "vegetal", "vegetales", "ensalada", "lechuga", "tomate", "cebolla", "zanahoria", "platano", "banana", "manzana", "naranja", "aguacate", "brocoli", "patata", "papa", "fresa", "uva", "limon", "pepino", "espinaca", "fruit", "vegetable", "lettuce", "apple", "orange", "potato", "avocado", "onion", "berry", "pepper", "pimiento", "calabacin", "pera", "melon", "sandia", "mandarina"])) return "produce";
  if (match(text, ["pan", "baguette", "barra pan", "tostada", "croissant", "bolleria", "tortilla", "bread", "bagel", "toast", "muffin", "bun", "arroz", "pasta", "cereal", "cereales", "avena", "rice", "oat", "oats", "spaghetti", "macarrones", "harina", "flour"])) return "bakery";
  if (match(text, ["aceite", "azucar", "sal", "lenteja", "lentejas", "garbanzo", "garbanzos", "alubia", "conserva", "conservas", "tomate frito", "oil", "sugar", "bean", "beans", "lentil", "lentils", "sauce", "salsa", "salsas", "condimento", "condimentos", "especias", "atun en lata", "canned"])) return "pantry";
  return "other";
}

export type GrocerySummary = {
  groups: { id: GroceryGroup; amount: number; count: number; previousAmount: number; previousCount: number; products: { name: string; amount: number; count: number }[] }[];
  receiptCount: number;
  previousReceiptCount: number;
  total: number;
  previousTotal: number;
};

export function summarizeGroceryReceipts(items: Tx[], previousItems: Tx[] = []): GrocerySummary {
  const groups = new Map(GROCERY_GROUPS.map((id) => [id, { id, amount: 0, count: 0, previousAmount: 0, previousCount: 0, products: [] as { name: string; amount: number; count: number }[] }]));
  const counts = [0, 0];
  for (const [period, transactions] of [items, previousItems].entries()) {
    for (const tx of transactions) {
      const lines = receiptItemsFrom(tx.description);
      if (!lines.length) continue;
      counts[period] = (counts[period] ?? 0) + 1;
      // Converted transactions keep their original amount, so use their actual FX ratio.
      const original = Math.abs(tx.original_amount ?? tx.amount);
      const ratio = original > 0 ? Math.abs(tx.amount) / original : 1;
      for (const line of lines) {
        const group = groups.get(groceryGroup(line.name));
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