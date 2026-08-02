import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Upload } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accounts, categories, excludedTypes, fmt, rules, topMerchants, transactions } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — Finance OS" },
      { name: "description", content: "Cuentas, categorías, reglas automáticas, presupuestos, importación de PDF/CSV y preferencias." },
      { property: "og:title", content: "Configuración — Finance OS" },
      { property: "og:description", content: "Gestiona cuentas, reglas de clasificación e importación con IA." },
    ],
  }),
  component: Configuracion,
});

function Configuracion() {
  return (
    <PageShell>
      <PageHeader eyebrow="Sistema" title="Configuración" subtitle="El motor detrás de tu Finance OS: reglas, cuentas e importación." />

      <Tabs defaultValue="importacion">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="importacion">Importación</TabsTrigger>
          <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="reglas">Reglas</TabsTrigger>
          <TabsTrigger value="preferencias">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="importacion" className="space-y-4">
          <StatementImporter />

          <Panel title="No se consideran gasto" description="Estos movimientos van únicamente al módulo Patrimonio">
            <div className="flex flex-wrap gap-2">
              {excludedTypes.map((e) => (
                <Badge key={e} variant="secondary" className="rounded-full">
                  {e}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Compras de activos, traspasos y pagos de tarjeta afectan tu balance, no tu gasto. Así tu tasa de ahorro nunca queda distorsionada.
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="cuentas" className="space-y-4">
          <Panel title="Cuentas y tarjetas">
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
          <Panel title="Ingresos recurrentes">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Salario", amount: 12400 },
                { name: "Consultoría", amount: 2800 },
                { name: "Dividendos", amount: 1200 },
              ].map((i) => (
                <div key={i.name} className="rounded-xl bg-elevated/60 p-4">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="numeric mt-1 text-lg font-semibold">{fmt(i.amount)}</p>
                  <p className="text-xs text-muted-foreground">mensual</p>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Panel title="Categorías, subcategorías y presupuestos">
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((c) => (
                <div key={c.key} className="rounded-xl bg-elevated/60 p-4">
                  <div className="flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <p className="text-sm font-medium">{c.name}</p>
                    <span className="numeric ml-auto text-xs text-muted-foreground">Presupuesto {fmt(c.budget)}</span>
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
          <Panel title="Comercios conocidos">
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
          <Panel title="Reglas automáticas" description="Cuando corriges una categoría, la IA aprende y la aplica la próxima vez">
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.match} className="flex flex-wrap items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2.5">
                  <code className="rounded-md bg-muted px-2 py-1 text-xs">{r.match}</code>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm font-medium">{r.category}</span>
                  <span className="text-xs text-muted-foreground">/ {r.sub}</span>
                  {r.learned && (
                    <Badge className="ml-auto rounded-full text-[10px]" variant="secondary">
                      Aprendida por IA
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="preferencias" className="space-y-4">
          <Panel title="Preferencias generales">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="currency">Moneda principal</Label>
                  <Input id="currency" defaultValue="USD — Dólar estadounidense" className="mt-1.5" readOnly />
                </div>
                <div>
                  <Label htmlFor="locale">Formato regional</Label>
                  <Input id="locale" defaultValue="Español (es) · en-US números" className="mt-1.5" readOnly />
                </div>
              </div>
              {[
                { label: "Modo oscuro", desc: "Interfaz optimizada para lectura nocturna", on: true },
                { label: "Notificaciones de gasto inusual", desc: "Alerta cuando un cargo supera 3× tu ticket habitual", on: true },
                { label: "Resumen semanal por email", desc: "Cada lunes con KPIs e insights", on: false },
                { label: "Exportación automática", desc: "CSV mensual a tu almacenamiento", on: false },
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
          <Panel title="Usuarios del hogar">
            <div className="flex flex-wrap gap-3">
              {["Tú (Owner)", "Pareja (Editor)", "Contador (Lectura)"].map((u) => (
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
