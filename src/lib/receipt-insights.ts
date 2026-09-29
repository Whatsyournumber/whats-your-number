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

export type GroceryGroup = "protein" | "produce" | "snacks" | "home" | "other";
export const GROCERY_GROUPS: GroceryGroup[] = ["protein", "produce", "snacks", "home", "other"];

const match = (text: string, words: string[]) => words.some((word) => text.includes(word));

function groceryGroup(name: string): GroceryGroup {
  const text = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (match(text, ["carne", "pollo", "ternera", "res ", "cerdo", "pavo", "jamon", "salmon", "pescado", "atun", "gamba", "huevo", "tofu", "beef", "chicken", "pork", "fish", "egg", "meat", "protein"])) return "protein";
  if (match(text, ["fruta", "verdura", "vegetal", "lechuga", "tomate", "cebolla", "zanahoria", "platano", "banana", "manzana", "naranja", "aguacate", "brocoli", "patata", "papa ", "fresa", "uva", "limon", "pepino", "espinaca", "fruit", "vegetable", "lettuce", "apple", "orange", "potato", "avocado", "onion", "berry"])) return "produce";
  if (match(text, ["detergente", "lejia", "jabon", "limpi", "suavizante", "papel higienico", "bolsa basura", "lavavajillas", "esponja", "servilleta", "dish soap", "clean", "laundry", "toilet paper", "trash bag", "tissue"])) return "home";
  if (match(text, ["chocolate", "galleta", "dulce", "caramelo", "helado", "patata frita", "snack", "golosina", "chuche", "cookie", "candy", "chips", "ice cream", "biscuit", "crisp"])) return "snacks";
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
          const key = line.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
          const product = group.products.find((p) => p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() === key);
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