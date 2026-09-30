import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { StatementImporter } from "@/components/statement-importer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { excludedTypes } from "@/lib/data";
import { useCategoryRules } from "@/hooks/use-category-rules";
import { useGroceryRules } from "@/hooks/use-grocery-rules";
import { useCategories } from "@/hooks/use-categories";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { useProfile } from "@/hooks/use-profile";
import { useLanguage, useT } from "@/hooks/use-language";
import { findBudgetCategory } from "@/lib/budget-categories";
import { money } from "@/lib/onboarding";
import { GROCERY_GROUPS, GROCERY_LABELS, type GroceryGroup } from "@/lib/receipt-insights";

const GROCERY_EXAMPLES: Record<GroceryGroup, { es: string; en: string }> = {
  protein: { es: "Salmón, huevos, pechuga, atún, ternera, tofu", en: "Salmon, eggs, chicken breast, tuna, beef, tofu" },
  produce: { es: "Plátano, manzana, tomate, lechuga, zanahoria", en: "Banana, apple, tomato, lettuce, carrots" },
  dairy: { es: "Yogur, queso, leche, kéfir, mantequilla", en: "Yogurt, cheese, milk, kefir, butter" },
  bakery: { es: "Pan, arroz, pasta, avena, cereales", en: "Bread, rice, pasta, oats, cereal" },
  pantry: { es: "Aceitunas, aceite, legumbres, salsas, conservas", en: "Olives, oil, beans, sauces, canned goods" },
  snacks: { es: "Chocolate, galletas, almendras, palomitas, caramelos", en: "Chocolate, cookies, almonds, popcorn, candy" },
  drinks: { es: "Agua, café, té, zumo, refrescos", en: "Water, coffee, tea, juice, soft drinks" },
  prepared: { es: "Pizza, croquetas, platos preparados, congelados", en: "Pizza, croquettes, ready meals, frozen foods" },
  personal: { es: "Champú, sérum, protector solar, vitaminas", en: "Shampoo, serum, sunscreen, vitamins" },
  home: { es: "Detergente, papel higiénico, bolsas de basura", en: "Detergent, toilet paper, trash bags" },
  babyPets: { es: "Pañales, comida infantil, pienso para mascotas", en: "Diapers, baby food, pet food" },
  other: { es: "Productos que todavía no encajan en otro rubro", en: "Products that don't yet fit another group" },
};

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Importar gastos — Finance OS" },
      { name: "description", content: "Importa estados de cuenta PDF/CSV, gestiona cuentas, categorías y reglas automáticas." },
      { property: "og:title", content: "Importar gastos — Finance OS" },
      { property: "og:description", content: "Importa tus estados de cuenta y deja que la IA los clasifique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Configuracion,
});

function Configuracion() {
  const t = useT();
  const { lang } = useLanguage();
  const learned = useCategoryRules();
  const groceryRules = useGroceryRules();
  const [productMatch, setProductMatch] = useState("");
  const [productGroup, setProductGroup] = useState<GroceryGroup>("pantry");
  const [groupItems, setGroupItems] = useState<Partial<Record<GroceryGroup, string>>>({});
  const custom = useCategories();
  const budgets = useSpendBudgets();
  const profile = useProfile();
  const currency = profile.profile?.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);

  /** Las categorías del propio usuario: su plan mensual + las que creó a mano. */
  const myCategories = [
    ...budgets.lines.map((line) => {
      const base = findBudgetCategory(line.id);
      const label = line.label?.trim() || (base ? (lang === "en" ? base.en : base.es) : line.id.replace(/^custom:(fixed:)?/, ""));
      return {
        key: line.id,
        emoji: line.emoji || base?.emoji || "📦",
        name: label,
        budget: Number(line.amount) || 0,
        chips: (line.keywords ?? []).filter(Boolean),
      };
    }),
    ...custom.items
      .filter((i) => i.name.trim())
      .map((i) => ({
        key: `cat:${i.id}`,
        emoji: "✨",
        name: i.name.trim(),
        budget: 0,
        chips: i.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      })),
  ];

  /** Nombres propios + etiquetas del catálogo en ambos idiomas + alias internos
   *  (las reglas guardan el nombre canónico de categorize, p. ej. "Supermercado"). */
  const myCategoryNames = new Set(myCategories.map((c) => c.name.toLowerCase()));
  for (const line of budgets.lines) {
    const base = findBudgetCategory(line.id);
    if (!base) continue;
    myCategoryNames.add(base.es.toLowerCase());
    myCategoryNames.add(base.en.toLowerCase());
    base.aliases.forEach((a) => myCategoryNames.add(a.toLowerCase()));
  }
  /** Solo reglas que apuntan a categorías que existen en esta cuenta. */
  const myRules = learned.rules.filter(
    (r) => myCategoryNames.size === 0 || myCategoryNames.has(r.category.trim().toLowerCase()),
  );

  return (
    <PageShell>
      <PageHeader eyebrow={t("Sistema", "System")} title={t("Importar gastos", "Import expenses")} subtitle={t("Importa tus estados de cuenta, cuentas y reglas de clasificación.", "Upload your statements, accounts and classification rules.")} />

      <Tabs defaultValue="importacion">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="importacion">{t("Importación", "Import")}</TabsTrigger>
          <TabsTrigger value="categorias">{t("Categorías", "Categories")}</TabsTrigger>
          <TabsTrigger value="reglas">{t("Reglas", "Rules")}</TabsTrigger>
          <TabsTrigger value="reglas-super">{t("Reglas del súper", "Grocery rules")}</TabsTrigger>
          <TabsTrigger value="preferencias">{t("Preferencias", "Preferences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="importacion" className="space-y-4">
          <StatementImporter />

          <Panel title={t("No se consideran gasto", "Not considered expenses")} description={t("Estos movimientos van únicamente al módulo Patrimonio", "These transactions go only to the Net Worth module")}>
            <div className="flex flex-wrap gap-2">
              {excludedTypes.map((e) => (
                <Badge key={e} variant="secondary" className="rounded-full">
                  {e}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {t(
                "Compras de activos, traspasos y pagos de tarjeta afectan tu balance, no tu gasto. Así tu tasa de ahorro nunca queda distorsionada.",
                "Asset purchases, transfers and card payments affect your balance, not your expenses. That way your savings rate is never distorted.",
              )}
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Panel title={t("Categorías, subcategorías y presupuestos", "Categories, subcategories and budgets")}>
            {myCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("Aún no tienes categorías. Crea tu plan mensual en Registro de gastos.", "No categories yet. Create your monthly plan in Expense log.")}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3 rounded-full">
                  <Link to="/registro-gastos">{t("Ir a Registro de gastos", "Go to Expense log")}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {myCategories.map((c) => (
                  <div key={c.key} className="rounded-xl bg-elevated/60 p-4">
                    <div className="flex items-center gap-2">
                      <span>{c.emoji}</span>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.budget > 0 ? (
                        <span className="numeric ml-auto text-xs text-muted-foreground">
                          {t("Presupuesto", "Budget")} {fmt(c.budget)}
                        </span>
                      ) : null}
                    </div>
                    {c.chips.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.chips.map((s) => (
                          <span key={s} className="rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="reglas">
          <Panel
            title={t("Reglas automáticas", "Automatic rules")}
            description={t(
              "Se crean desde Gastos: cuando mueves un movimiento a otra categoría, se guarda aquí y se aplica la próxima vez.",
              "Created from Expenses: when you move a transaction to another category, it's saved here and applied next time.",
            )}
          >
            {myRules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("Aún no tienes reglas. Arrastra un movimiento a otra categoría en Gastos para crear la primera.", "No rules yet. Drag a transaction to another category in Expenses to create the first one.")}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3 rounded-full">
                  <Link to="/gastos">{t("Ir a Gastos", "Go to Expenses")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myRules.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-elevated/60 px-3 py-2.5 sm:gap-3">
                    <code className="max-w-[55%] truncate rounded-md bg-muted px-2 py-1 text-xs">{r.match}</code>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm font-medium">{r.category}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label={t("Eliminar regla", "Delete rule")}
                      onClick={() => learned.remove(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="reglas-super">
          <Panel title={t("Reglas del súper", "Grocery rules")} description={t("Qué productos van en cada rubro. Solo tus cambios se guardan como reglas para los próximos tickets.", "What belongs in each group. Only your changes are saved as rules for future receipts.")}>
            <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); if (!productMatch.trim()) return; groceryRules.learn(productMatch, productGroup); setProductMatch(""); }}>
              <div className="min-w-40 flex-1"><Label htmlFor="grocery-match">{t("Producto o palabra del ticket", "Receipt product or keyword")}</Label><Input id="grocery-match" value={productMatch} onChange={(event) => setProductMatch(event.target.value)} maxLength={120} placeholder={t("Ej. aceitunas", "E.g. olives")} className="mt-1.5" /></div>
              <div className="min-w-40 flex-1"><Label htmlFor="grocery-group">{t("Rubro", "Group")}</Label><select id="grocery-group" value={productGroup} onChange={(event) => setProductGroup(event.target.value as GroceryGroup)} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{GROCERY_GROUPS.map((id) => <option key={id} value={id}>{GROCERY_LABELS[id].icon} {t(GROCERY_LABELS[id].es, GROCERY_LABELS[id].en)}</option>)}</select></div>
              <Button type="submit" disabled={!productMatch.trim()}>{t("Guardar regla", "Save rule")}</Button>
            </form>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{GROCERY_GROUPS.map((g, index) => { const rules = groceryRules.rules.filter((rule) => rule.group === g).sort((a, b) => a.match.localeCompare(b.match)); return (
              <div key={g} className="rounded-lg border border-border bg-elevated/40 p-3">
                <div className="mb-2 flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">{index + 1}.</span><span className="text-base">{GROCERY_LABELS[g].icon}</span><span className="text-sm font-medium">{t(GROCERY_LABELS[g].es, GROCERY_LABELS[g].en)}</span></div>
                <p className="text-xs text-muted-foreground">{t(GROCERY_LABELS[g].detailEs, GROCERY_LABELS[g].detailEn)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("Ejemplos", "Examples")}: {t(GROCERY_EXAMPLES[g].es, GROCERY_EXAMPLES[g].en)}</p>
                <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); const name = groupItems[g]?.trim(); if (!name) return; groceryRules.learn(name, g); setGroupItems((current) => ({ ...current, [g]: "" })); }}>
                  <Input aria-label={t(`Añadir producto a ${GROCERY_LABELS[g].es}`, `Add product to ${GROCERY_LABELS[g].en}`)} value={groupItems[g] ?? ""} onChange={(event) => setGroupItems((current) => ({ ...current, [g]: event.target.value }))} maxLength={120} placeholder={t("Añadir producto o palabra", "Add product or keyword")} className="min-w-0 flex-1" />
                  <Button type="submit" size="sm" variant="outline" disabled={!groupItems[g]?.trim()}>{t("Añadir", "Add")}</Button>
                </form>
                {rules.length > 0 && <div className="mt-3 border-t border-border pt-2"><p className="mb-2 text-xs text-muted-foreground">{t("Reglas nuevas", "New rules")} · {rules.length}</p><div className="space-y-1">{rules.map((rule) => <div key={rule.id} className="flex items-center gap-2 rounded-md bg-background/50 px-2 py-1.5"><span className="min-w-0 flex-1 break-words text-sm">{rule.match}</span><select aria-label={t(`Rubro de ${rule.match}`, `Group for ${rule.match}`)} value={rule.group} onChange={(e) => groceryRules.learn(rule.match, e.target.value as GroceryGroup)} className="h-8 max-w-32 shrink-0 rounded-md border border-input bg-background px-1 text-xs text-foreground">{GROCERY_GROUPS.map((id) => <option key={id} value={id}>{t(GROCERY_LABELS[id].es, GROCERY_LABELS[id].en)}</option>)}</select><Button type="button" size="icon" variant="ghost" className="size-8 shrink-0 text-muted-foreground" aria-label={t(`Eliminar regla de ${rule.match}`, `Delete rule for ${rule.match}`)} onClick={() => groceryRules.remove(rule.id)}><Trash2 className="size-3.5" /></Button></div>)}</div></div>}
              </div>); })}</div>
          </Panel>
        </TabsContent>

        <TabsContent value="preferencias" className="space-y-4">
          <Panel title={t("Preferencias generales", "General preferences")}>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="currency">{t("Moneda principal", "Main currency")}</Label>
                  <Input id="currency" defaultValue={t("USD — Dólar estadounidense", "USD — US Dollar")} className="mt-1.5" readOnly />
                </div>
                <div>
                  <Label htmlFor="locale">{t("Formato regional", "Regional format")}</Label>
                  <Input id="locale" defaultValue={t("Español (es) · en-US números", "Spanish (es) · en-US numbers")} className="mt-1.5" readOnly />
                </div>
              </div>
              {[
                { label: t("Modo oscuro", "Dark mode"), desc: t("Interfaz optimizada para lectura nocturna", "Interface optimized for night reading"), on: true },
                { label: t("Notificaciones de gasto inusual", "Unusual spending alerts"), desc: t("Alerta cuando un cargo supera 3× tu ticket habitual", "Alert when a charge exceeds 3× your usual ticket"), on: true },
                { label: t("Resumen semanal por email", "Weekly email summary"), desc: t("Cada lunes con KPIs e insights", "Every Monday with KPIs and insights"), on: false },
                { label: t("Exportación automática", "Automatic export"), desc: t("CSV mensual a tu almacenamiento", "Monthly CSV to your storage"), on: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-4 rounded-xl bg-elevated/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <Switch defaultChecked={s.on} className="ml-auto" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={t("Usuarios del hogar", "Household users")}>
            <div className="flex flex-wrap gap-3">
              {[t("Tú (Owner)", "You (Owner)"), t("Pareja (Editor)", "Partner (Editor)"), t("Contador (Lectura)", "Accountant (Read)")].map((u) => (
                <div key={u} className="rounded-xl bg-elevated/60 px-4 py-3 text-sm">
                  {u}
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
