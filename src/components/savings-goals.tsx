import { useState } from "react";
import { Calendar, Car, Check, Clock, Home, MoreVertical, Pencil, Plane, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { useT } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export type SavingsGoal = { id: string; name: string; target: number; saved: number; monthly: number; targetYear: number };
type Draft = Omit<SavingsGoal, "id"> & { id?: string };
const EMPTY: { items: SavingsGoal[] } = { items: [] };
const newDraft = (): Draft => ({ name: "", target: 0, saved: 0, monthly: 0, targetYear: new Date().getFullYear() + 1 });

function goalIcon(name: string) {
  const n = name.toLowerCase();
  if (/(casa|apart|depto|piso|home|house|apartm|vivienda|hipoteca)/.test(n)) return Home;
  if (/(carro|coche|auto|car|moto|veh[ií]culo)/.test(n)) return Car;
  if (/(viaje|viajar|trip|travel|vacac|vuelo|munich|paris|playa)/.test(n)) return Plane;
  return Target;
}

export function SavingsGoals({ fmt }: { fmt: (amount: number) => string }) {
  const t = useT();
  const { value, save, loaded } = useSyncedSetting<{ items: SavingsGoal[] }>("whatsyournumber:savings-goals", EMPTY);
  const goals = Array.isArray(value?.items) ? value.items : EMPTY.items;
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [draftState, setDraft] = useState<Draft | null>(null);
  const draft = draftState;
  const [menuId, setMenuId] = useState<string | null>(null);
  const completed = (goal: SavingsGoal) => goal.target > 0 && goal.saved >= goal.target;
  const activeCount = goals.filter((goal) => !completed(goal)).length;
  const completedCount = goals.length - activeCount;
  const visible = goals.filter((goal) => filter === "all" || (filter === "completed" ? completed(goal) : !completed(goal)));

  const submit = () => {
    let draft = draftState;
    if (!draft) return;
    if (!draft.name.trim()) { toast.error(t("Escribe un nombre para la meta", "Enter a goal name")); return; }
    if (!Number.isFinite(draft.target) || draft.target <= 0) { toast.error(t("Indica cuánto quieres ahorrar en Objetivo", "Enter a target amount")); return; }
    const year = Number.isFinite(draft.targetYear) && draft.targetYear > 0 ? draft.targetYear : new Date().getFullYear() + 1;
    draft = { ...draft, saved: Number.isFinite(draft.saved) ? draft.saved : 0, monthly: Number.isFinite(draft.monthly) ? draft.monthly : 0, targetYear: year };
    const goal: SavingsGoal = {
      id: draft.id ?? crypto.randomUUID(), name: draft.name.trim(), target: draft.target,
      saved: Math.max(0, draft.saved), monthly: Math.max(0, draft.monthly), targetYear: Math.max(new Date().getFullYear(), Math.floor(draft.targetYear)),
    };
    save({ items: draft.id ? goals.map((item) => item.id === draft.id ? goal : item) : [...goals, goal] });
    setDraft(null);
    toast.success(t("Meta guardada", "Goal saved"));
  };

  return (
    <section className="space-y-4 border-t border-border pt-6" aria-label={t("Tus metas de ahorro", "Your savings goals")}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/15 text-positive"><Target className="h-4 w-4" /></span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight">{t("Tus metas de ahorro", "Your savings goals")}</h2>
              <p className="truncate text-[11px] text-muted-foreground">{t("Sigue el progreso de tus objetivos.", "Track your goals' progress.")}</p>
            </div>
          </div>
          <Button size="sm" className="h-8 shrink-0 gap-1 px-2.5 text-xs" onClick={() => setDraft(newDraft())}><Plus className="h-3.5 w-3.5" />{t("Nueva meta", "New goal")}</Button>
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all">{t("Todas", "All")} ({goals.length})</TabsTrigger>
            <TabsTrigger value="active">{t("Activas", "Active")} ({activeCount})</TabsTrigger>
            <TabsTrigger value="completed">{t("Completadas", "Completed")} ({completedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loaded && visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 py-8 text-center text-sm text-muted-foreground">
          {goals.length === 0 ? t("Todavía no tienes metas de ahorro.", "No savings goals yet.") : t("No hay metas en esta vista.", "No goals in this view.")}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((goal) => {
            const done = completed(goal);
            const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            const remaining = Math.max(0, goal.target - goal.saved);
            const months = goal.monthly > 0 ? Math.ceil(remaining / goal.monthly) : 0;
            const Icon = goalIcon(goal.name);
            return (
              <div
                key={goal.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors sm:p-3.5",
                  done ? "border-positive/25 bg-positive/5" : "border-border bg-card/40 hover:border-positive/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", done ? "bg-positive/20 text-positive" : "bg-primary/10 text-primary")}>
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 break-words text-sm font-semibold">{goal.name}</p>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <span className="numeric text-sm font-bold text-positive">{pct}%</span>
                        <div className="relative">
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={t(`Opciones de ${goal.name}`, `Options for ${goal.name}`)} aria-expanded={menuId === goal.id} onClick={() => setMenuId(menuId === goal.id ? null : goal.id)}><MoreVertical className="h-4 w-4" /></Button>
                          {menuId === goal.id && <div className="absolute right-0 top-full z-10 min-w-36 rounded-md border border-border bg-popover p-1 shadow-lg">
                            <Button variant="ghost" className="w-full justify-start" onClick={() => { setDraft(goal); setMenuId(null); }}><Pencil />{t("Editar", "Edit")}</Button>
                            <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { save({ items: goals.filter((item) => item.id !== goal.id) }); setMenuId(null); }}><Trash2 />{t("Eliminar", "Delete")}</Button>
                          </div>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={goal.name} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full bg-positive transition-[width]" style={{ width: `${Math.max(pct, 3)}%` }} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-muted-foreground">
                      {done ? (
                        <span className="inline-flex items-center gap-1.5 text-positive"><Check className="h-3 w-3" />{t("Completada · ¡Buen trabajo!", "Completed · Nice work!")}</span>
                      ) : (
                        <>
                          <span className="numeric inline-flex items-center gap-1.5"><Calendar className="h-3 w-3 text-positive" />{fmt(goal.monthly)}{t("/mes", "/mo")}</span>
                          {months > 0 && (
                            <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3 text-positive" />{t("Llegas en", "You get there in")} {months} {t(months === 1 ? "mes" : "meses", months === 1 ? "month" : "months")}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => { if (!open) setDraft(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{draft?.id ? t("Editar meta de ahorro", "Edit savings goal") : t("Nueva meta de ahorro", "New savings goal")}</DialogTitle></DialogHeader>
          {draft && <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label htmlFor="savings-goal-name">{t("Nombre", "Name")}</Label><Input id="savings-goal-name" value={draft.name} maxLength={80} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("Objetivo", "Target")}</Label><NumberInput ariaLabel={t("Objetivo", "Target")} value={draft.target} min={0} format onChange={(target) => setDraft({ ...draft, target })} /></div>
              <div className="space-y-1.5"><Label>{t("Ya ahorrado", "Already saved")}</Label><NumberInput ariaLabel={t("Ya ahorrado", "Already saved")} value={draft.saved} min={0} format onChange={(saved) => setDraft({ ...draft, saved })} /></div>
              <div className="space-y-1.5"><Label>{t("Aporte mensual", "Monthly contribution")}</Label><NumberInput ariaLabel={t("Aporte mensual", "Monthly contribution")} value={draft.monthly} min={0} format onChange={(monthly) => setDraft({ ...draft, monthly })} /></div>
              <div className="space-y-1.5"><Label htmlFor="savings-goal-year">{t("Año objetivo", "Target year")}</Label><Input id="savings-goal-year" type="number" min={new Date().getFullYear()} value={draft.targetYear} onChange={(event) => setDraft({ ...draft, targetYear: Number(event.target.value) })} /></div>
            </div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>{t("Cancelar", "Cancel")}</Button><Button onClick={submit}>{t("Guardar", "Save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
