import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { StatementImporter } from "@/components/statement-importer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories, excludedTypes, fmt, topMerchants } from "@/lib/data";
import { useCategoryRules } from "@/hooks/use-category-rules";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Importar gastos — Finance OS" },
      { name: "description", content: "Importa estados de cuenta PDF/CSV, gestiona cuentas, categorías y reglas automáticas." },
      { property: "og:title", content: "Importar gastos — Finance OS" },
      { property: "og:description", content: "Importa tus estados de cuenta y deja que la IA los clasifique." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Configuracion,
});

function Configuracion() {
  const t = useT();
  return (
    <PageShell>
      <PageHeader eyebrow={t("Sistema", "System")} title={t("Importar gastos", "Import expenses")} subtitle={t("Importa tus estados de cuenta, cuentas y reglas de clasificación.", "Upload your statements, accounts and classification rules.")} />

      <Tabs defaultValue="importacion">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="importacion">{t("Importación", "Import")}</TabsTrigger>
          <TabsTrigger value="categorias">{t("Categorías", "Categories")}</TabsTrigger>
          <TabsTrigger value="reglas">{t("Reglas", "Rules")}</TabsTrigger>
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
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((c) => (
                <div key={c.key} className="rounded-xl bg-elevated/60 p-4">
                  <div className="flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <p className="text-sm font-medium">{c.name}</p>
                    <span className="numeric ml-auto text-xs text-muted-foreground">{t("Presupuesto", "Budget")} {fmt(c.budget)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.subcategories.map((s) => (
                      <span key={s.name} className="rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={t("Comercios conocidos", "Known merchants")}>
            <div className="flex flex-wrap gap-2">
              {topMerchants.map((m) => (
                <Badge key={m.name} variant="outline" className="rounded-full">
                  {m.name}
                </Badge>
              ))}
            </div>
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
            {learned.rules.length === 0 ? (
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
                {learned.rules.map((r) => (
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
