import { storeKey } from "@/components/price-comparator-dialog";
import { receiptItemsFrom } from "@/lib/receipt-insights";

const fs = require("fs");
const lines = fs.readFileSync("/tmp/grocery-txs.tsv", "utf8").split("\n").filter(Boolean);

const stores = new Map<string, { name: string; names: Map<string, number>; total: number; count: number }>();
const products = new Map<string, { name: string; prices: Map<string, number[]> }>();
// basicOf copied inline to avoid importing private logic (basicOf not exported)
const BASICS: { id: string; label: string; re: RegExp }[] = [
  { id: "leche", label: "🥛 Leche", re: /\bleche\b(?!.*(avena|almendra|coco|soja|condensada))/ },
  { id: "huevos", label: "🥚 Huevos", re: /\bhuevo/ },
  { id: "pollo", label: "🍗 Pollo", re: /pollo|pechuga|contramuslo|muslo/ },
  { id: "vacuno", label: "🥩 Vacuno/picada", re: /vacuno|ternera|picada|burger|hamburguesa|filete(?!.*pollo)/ },
  { id: "atun", label: "🐟 Atún", re: /\batun/ },
  { id: "pescado", label: "🐟 Pescado", re: /salmon|merluza|bacalao|dorada|lubina|pescado|sardin|boqueron|gamba|langostino|calamar|poton/ },
  { id: "arroz", label: "🍚 Arroz", re: /\barroz/ },
  { id: "pasta", label: "🍝 Pasta", re: /pasta|espagueti|spaghetti|macarron|tallarin|fideo|penne|lasana/ },
  { id: "pan", label: "🍞 Pan", re: /\bpan\b|baguette|barra|hogaza|pan de molde|tortilla de trigo|tortillas/ },
  { id: "patatas", label: "🥔 Patatas", re: /patata/ },
  { id: "legumbres", label: "🫘 Legumbres", re: /lenteja|garbanzo|alubia|judia|legumbre/ },
  { id: "aceite", label: "🫒 Aceite", re: /aceite/ },
  { id: "tomate", label: "🍅 Tomate", re: /tomate(?!.*(frito|salsa|ketchup))/ },
  { id: "lechuga", label: "🥬 Lechuga", re: /lechuga|espinaca|rucula|canonigo|ensalada|brote/ },
  { id: "cebolla", label: "🧅 Cebolla", re: /cebolla/ },
  { id: "zanahoria", label: "🥕 Zanahoria", re: /zanahoria/ },
  { id: "platano", label: "🍌 Plátano", re: /platano|banana/ },
  { id: "manzana", label: "🍎 Manzana", re: /manzana/ },
  { id: "yogur", label: "🥣 Yogur", re: /yogur|yogourt|skyr|kefir/ },
  { id: "cafe", label: "☕ Café", re: /\bcafe\b|capsula|nespresso|dolce gusto/ },
];
const ALLOWED = new Set(["ponzano", "dia", "ahorramas"]);
const basicOf = (n: string) => {
  const x = n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return BASICS.find((b) => b.re.test(x));
};
const cleanStore = (s: string) => s.replace(/\b(s\.?a\.?|s\.?l\.?|sucursal|tienda|madrid|barcelona)\b/gi, "").replace(/[0-9#*]+/g, "").replace(/\s+/g, " ").trim();
const productKey = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\d+([.,]\d+)?\s*(g|gr|kg|ml|l|cl|ud|uds|x|pack)?\b/g, "")
    .replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 3).join(" ");

for (const line of lines) {
  const [merchant, date, amount, description] = line.split("\t");
  const raw = merchant || description || "";
  const realKey = storeKey(raw);
  const key = realKey || "otros";
  const amt = Math.abs(Number(amount) || 0);
  if (realKey) {
    const s = stores.get(key) ?? { name: cleanStore(raw) || raw, names: new Map(), total: 0, count: 0 };
    const variant = cleanStore(raw) || raw;
    s.names.set(variant, (s.names.get(variant) ?? 0) + 1);
    s.name = [...s.names.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]![0];
    s.total += amt; s.count += 1;
    stores.set(key, s);
  }
  for (const item of receiptItemsFrom(description)) {
    const basic = basicOf(item.name);
    const pk = basic ? `basic:${basic.id}` : productKey(item.name);
    if (pk.length < 3) continue;
    const p = products.get(pk) ?? { name: basic ? basic.label : item.name, prices: new Map() };
    p.prices.set(key, [...(p.prices.get(key) ?? []), item.amount]);
    products.set(pk, p);
  }
}

console.log("== TIENDAS (todas, antes de filtrar) ==");
for (const [k, s] of [...stores.entries()].sort((a, b) => b[1].total - a[1].total))
  console.log(k, "|", s.name, "| total", s.total.toFixed(2), "| compras", s.count, "| ¿permitida?", ALLOWED.has(k));

console.log("\n== PRODUCTOS con precios (tras filtrar tiendas permitidas + otros) ==");
const storeKeys = new Set(["ponzano", "dia", "ahorramas"]);
let shown = 0;
for (const [pk, p] of products) {
  const entries = [...p.prices.entries()].filter(([k]) => k === "otros" || storeKeys.has(k)).map(([k, v]) => ({ store: k, n: v.length }));
  if (!entries.length) continue;
  if (shown++ < 40) console.log(p.name, "→", entries.map((e) => `${e.store} x${e.n}`).join(", "));
}
console.log("\ntotal productos mostrables:", shown);
