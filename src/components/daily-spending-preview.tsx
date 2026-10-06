import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, ChevronDown, Mic, PencilLine, Plus, ShoppingBasket, Users, Utensils, Upload, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function DailySpendingPreview() {
  const t = useT();
  const [tab, setTab] = useState<"all" | "mine" | "shared">("all");
  const [fixedOpen, setFixedOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const expenses = [
    { name: "Ahorramas", category: t("Supermercado", "Groceries"), date: t("Hoy", "Today"), amount: "€32.40", icon: ShoppingBasket, shared: true, detail: t("Con Carlos · 50%", "With Carlos · 50%") },
    { name: t("Café y desayuno", "Coffee & breakfast"), category: t("Restaurantes", "Restaurants"), date: t("Hoy", "Today"), amount: "€6.50", icon: Utensils, shared: false, detail: t("Por voz", "By voice") },
    { name: t("Cena con Carlos", "Dinner with Carlos"), category: t("Restaurantes", "Restaurants"), date: t("Ayer", "Yesterday"), amount: "€24.00", icon: Utensils, shared: true, detail: t("Con Carlos · 50%", "With Carlos · 50%") },
    { name: t("Metro", "Metro"), category: t("Transporte", "Transport"), date: t("Ayer", "Yesterday"), amount: "€12.00", icon: Wallet, shared: false, detail: t("Manual", "Manual") },
  ];
  const visible = expenses.filter((expense) => tab === "all" || (tab === "shared" ? expense.shared : !expense.shared));

  return (
    <div className="relative mt-5 min-w-0" data-daily-spending-preview>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-foreground">{t("Mis gastos diarios", "My daily spending")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("Controla tu dinero día a día", "Control your money daily")}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{t("Octubre 2026", "October 2026")}</span>
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold">{t("Tu plan de gasto mensual", "Monthly spending plan")}</h4>
            <Button asChild variant="ghost" size="icon" className="shrink-0 text-positive" aria-label={t("Editar el plan", "Edit plan")} title={t("Editar el plan", "Edit plan")}>
              <Link to="/auth" search={{ mode: "signup" }}><PencilLine /></Link>
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="numeric text-3xl font-semibold">€1.8K <span className="text-base font-medium text-muted-foreground">{t("de", "of")} €3K</span></p>
            <Button size="icon" onClick={() => setAddOpen(!addOpen)} aria-expanded={addOpen} aria-label={t("Agregar gasto", "Add expense")} title={t("Agregar gasto", "Add expense")} className="h-11 w-11 shrink-0 rounded-full bg-positive text-background hover:bg-positive/85"><Plus /></Button>
          </div>
          {addOpen && (
            <div className="mt-3 grid grid-cols-2 gap-1 border-y border-border py-2">
              {[
                { icon: PencilLine, label: t("Manual", "Manual") },
                { icon: Mic, label: t("Por voz", "By voice") },
                { icon: Camera, label: t("Tomar foto", "Take photo") },
                { icon: Upload, label: t("Subir archivo", "Upload file") },
                { icon: Users, label: t("Compartido", "Shared expense") },
              ].map((method) => <Button key={method.label} asChild variant="ghost" size="sm" className="justify-start"><Link to="/auth" search={{ mode: "signup" }}><method.icon className="text-positive" />{method.label}</Link></Button>)}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div role="progressbar" aria-label={t("Plan gastado", "Plan spent")} aria-valuenow={60} aria-valuemin={0} aria-valuemax={100} className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border"><div className="h-full w-3/5 rounded-full bg-positive" /></div>
            <span className="numeric text-sm font-semibold text-positive">60%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("Te quedan €1.2K este mes", "€1.2K left this month")}</p>
          <div className="mt-5 border-t border-border pt-3">
            <Button variant="ghost" className="w-full justify-between px-0" aria-expanded={fixedOpen} onClick={() => setFixedOpen(!fixedOpen)}>
              {t("Gastos fijos", "Fixed expenses")}<ChevronDown className={cn("transition-transform", fixedOpen && "rotate-180")} />
            </Button>
            {fixedOpen && <div className="space-y-2 pb-3 text-sm">
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("Alquiler", "Rent")}</span><span className="numeric">€850</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("Apps y suscripciones", "Apps & subscriptions")}</span><span className="numeric">€50</span></div>
              <div className="flex justify-between gap-2 border-t border-border pt-2 font-semibold"><span>Total</span><span className="numeric">€900</span></div>
            </div>}
          </div>
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold">{t("Gastos variables", "Variable expenses")}</h4>
            {[
              { label: t("Supermercado", "Groceries"), amount: "€320", progress: "w-4/5", color: "bg-primary" },
              { label: t("Restaurantes", "Restaurants"), amount: "€240", progress: "w-3/5", color: "bg-chart-2" },
              { label: t("Otros gastos", "Other spending"), amount: "€340", progress: "w-1/2", color: "bg-chart-4" },
            ].map((category) => <div key={category.label} className="mt-3">
              <div className="flex justify-between gap-2 text-xs"><span className="text-muted-foreground">{category.label}</span><span className="numeric">{category.amount}</span></div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", category.progress, category.color)} /></div>
            </div>)}
          </div>
        </div>
        <div className="min-w-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h4 className="mb-3 text-base font-semibold">{t("Últimos gastos", "Latest expenses")}</h4>
          <div className="grid grid-cols-3 gap-1 border-b border-border pb-2">
            {([{ id: "all", label: t("Todos", "All") }, { id: "mine", label: t("Míos", "Mine") }, { id: "shared", label: t("Compartidos", "Shared") }] as const).map((item) => <Button key={item.id} size="sm" variant="ghost" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={cn("px-1", tab === item.id ? "bg-positive/10 text-positive hover:bg-positive/15 hover:text-positive" : "text-muted-foreground")}>{item.label}</Button>)}
          </div>
          {tab === "shared" && <div className="mt-3 flex items-center justify-between gap-3 border-b border-border pb-3">
            <div><p className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-positive" />Carlos</p><p className="mt-1 text-xs text-muted-foreground">{t("Te debe", "Owes you")}</p></div><span className="numeric text-lg font-semibold text-positive">€32.40</span>
          </div>}
          <ul className="divide-y divide-border">
            {visible.map((expense) => <li key={expense.name} className="flex min-w-0 items-center gap-3 py-4">
              <expense.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{expense.name}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">{expense.shared && <Users className="h-3 w-3 shrink-0 text-positive" />}{expense.category} · {expense.shared ? expense.detail : expense.date}</p></div>
              <span className="numeric shrink-0 text-sm font-semibold">{expense.amount}</span>
            </li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}