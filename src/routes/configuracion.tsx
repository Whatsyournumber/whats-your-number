import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { StatementImporter } from "@/components/statement-importer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories, excludedTypes, fmt, rules, topMerchants } from "@/lib/data";
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

        <TabsContent value="cuentas" className="space-y-4">
          <Panel title={t("Cuentas y tarjetas", "Accounts and cards")}>
            <div className="grid gap-3 md:grid-cols-2">
              {accounts.map((a) => (
                <div key={a.last4} className="surface relative overflow-hidden p-4">
                  <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.06]" />
                  <div className="relative">
                    <p className="text-xs text-muted-foreground">{a.bank}</p>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="numeric mt-3 text-xl font-semibold">{fmt(a.balance)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.type} ···· {a.last4}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={t("Ingresos recurrentes", "Recurring income")}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: t("Salario", "Salary"), amount: 12400 },
                { name: t("Consultoría", "Consulting"), amount: 2800 },
                { name: t("Dividendos", "Dividends"), amount: 1200 },
              ].map((i) => (
                <div key={i.name} className="rounded-xl bg-elevated/60 p-4">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="numeric mt-1 text-lg font-semibold">{fmt(i.amount)}</p>
                  <p className="text-xs text-muted-foreground">{t("mensual", "monthly")}</p>
                </div>
              ))}
            </div>
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
          <Panel title={t("Reglas automáticas", "Automatic rules")} description={t("Cuando corriges una categoría, la IA aprende y la aplica la próxima vez", "When you correct a category, the AI learns and applies it next time")}>
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.match} className="flex flex-wrap items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2.5">
                  <code className="rounded-md bg-muted px-2 py-1 text-xs">{r.match}</code>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm font-medium">{r.category}</span>
                  <span className="text-xs text-muted-foreground">/ {r.sub}</span>
                  {r.learned && (
                    <Badge className="ml-auto rounded-full text-[10px]" variant="secondary">
                      {t("Aprendida por IA", "Learned by AI")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
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
