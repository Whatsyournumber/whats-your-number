import { useState } from "react";
import { Check, MoreVertical, Pencil, Plus, Target, Trash2 } from "lucide-react";
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

type SavingsGoal = { id: string; name: string; target: number; saved: number; monthly: number; targetYear: number };
type Draft = Omit<SavingsGoal, "id"> & { id?: string };
const EMPTY: SavingsGoal[] = [];
const newDraft = (): Draft => ({ name: "", target: 0, saved: 0, monthly: 0, targetYear: new Date().getFullYear() + 1 });

export function SavingsGoals({ fmt }: { fmt: (amount: number) => string }) {
  const t = useT();
  const { value: goals, save, loaded } = useSyncedSetting<SavingsGoal[]>("whatsyournumber:savings-goals", EMPTY);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const completed = (goal: SavingsGoal) => goal.target > 0 && goal.saved >= goal.target;
  const activeCount = goals.filter((goal) => !completed(goal)).length;
  const completedCount = goals.length - activeCount;
  const visible = goals.filter((goal) => filter === "all" || (filter === "completed" ? completed(goal) : !completed(goal)));

  const submit = () => {
    if (!draft || !draft.name.trim() || draft.target <= 0 || !Number.isFinite(draft.target) || !Number.isFinite(draft.saved) || !Number.isFinite(draft.monthly) || !Number.isFinite(draft.targetYear)) return;
    const goal: SavingsGoal = {
      id: draft.id ?? crypto.randomUUID(), name: draft.name.trim(), target: draft.target,
      saved: Math.max(0, draft.saved), monthly: Math.max(0, draft.monthly), targetYear: Math.max(new Date().getFullYear(), Math.floor(draft.targetYear)),
    };
    save(draft.id ? goals.map((item) => item.id === draft.id ? goal : item) : [...goals, goal]);
    setDraft(null);
    toast.success(t("Meta guardada", "Goal saved"));
  };

  return (
    <section className="space-y-4 border-t border-border pt-6" aria-label={t("Tus metas de ahorro", "Your savings goals")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-positive/15 text-positive"><Target className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-semibold">{t("Tus metas de ahorro", "Your savings goals")}</h2>
            <p className="text-xs text-muted-foreground">{t("Sigue el progreso de tus objetivos.", "Track your goals' progress.")}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <TabsList className="max-w-full">
              <TabsTrigger value="all">{t("Todas", "All")} ({goals.length})</TabsTrigger>
              <TabsTrigger value="active">{t("Activas", "Active")} ({activeCount})</TabsTrigger>
              <TabsTrigger value="completed">{t("Completadas", "Completed")} ({completedCount})</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => setDraft(newDraft())}><Plus />{t("Nueva meta", "New goal")}</Button>
        </div>
      </div>

      {loaded && visible.length === 0 ? (
        <div className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          {goals.length === 0 ? t("Todavía no tienes metas de ahorro.", "No savings goals yet.") : t("No hay metas en esta vista.", "No goals in this view.")}
        </div>
      ) : (
        <div className="divide-y divide-border/70 border-t border-border">
          {visible.map((goal) => {
            const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            const remaining = Math.max(0, goal.target - goal.saved);
            const months = goal.monthly > 0 ? Math.ceil(remaining / goal.monthly) : 0;
            return (
              <div key={goal.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(100px,140px)_auto]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md", completed(goal) ? "bg-positive/15 text-positive" : "bg-primary/15 text-primary")}>{completed(goal) ? <Check className="h-4 w-4" /> : <Target className="h-4 w-4" />}</span><p className="min-w-0 break-words text-sm font-semibold">{goal.name}</p></div>
                  <div className="ml-10 mt-1.5 flex items-center gap-3">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={goal.name} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-positive transition-[width]" style={{ width: `${pct}%` }} /></div>
                    <span className="numeric w-10 shrink-0 text-right text-xs font-semibold text-positive">{pct}%</span>
                  </div>
                  <p className="numeric ml-10 mt-1 text-xs text-muted-foreground">{fmt(goal.saved)} {t("de", "of")} {fmt(goal.target)}</p>
                </div>
                <p className="numeric hidden text-xs text-muted-foreground sm:block">{completed(goal) ? t("Completada", "Completed") : <>{fmt(goal.monthly)}{t("/mes", "/mo")}<br />{months > 0 ? `${months} ${t(months === 1 ? "mes restante" : "meses restantes", months === 1 ? "month left" : "months left")}` : `${t("Objetivo", "Target")} ${goal.targetYear}`}</>}</p>
                <div className="relative self-start">
                  <Button variant="ghost" size="icon" aria-label={t(`Opciones de ${goal.name}`, `Options for ${goal.name}`)} aria-expanded={menuId === goal.id} onClick={() => setMenuId(menuId === goal.id ? null : goal.id)}><MoreVertical /></Button>
                  {menuId === goal.id && <div className="absolute right-0 top-full z-10 min-w-36 rounded-md border border-border bg-popover p-1 shadow-lg">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setDraft(goal); setMenuId(null); }}><Pencil />{t("Editar", "Edit")}</Button>
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { save(goals.filter((item) => item.id !== goal.id)); setMenuId(null); }}><Trash2 />{t("Eliminar", "Delete")}</Button>
                  </div>}
                </div>
                {!completed(goal) && <p className="numeric col-start-1 ml-10 text-xs text-muted-foreground sm:hidden">{fmt(goal.monthly)}{t("/mes", "/mo")} · {months > 0 ? `${months} ${t("meses restantes", "months left")}` : `${t("Objetivo", "Target")} ${goal.targetYear}`}</p>}
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
              <div className="space-y-1.5"><Label>{t("Objetivo", "Target")}</Label><NumberInput ariaLabel={t("Objetivo", "Target")} value={draft.target} min={0} onChange={(target) => setDraft({ ...draft, target })} /></div>
              <div className="space-y-1.5"><Label>{t("Ya ahorrado", "Already saved")}</Label><NumberInput ariaLabel={t("Ya ahorrado", "Already saved")} value={draft.saved} min={0} onChange={(saved) => setDraft({ ...draft, saved })} /></div>
              <div className="space-y-1.5"><Label>{t("Aporte mensual", "Monthly contribution")}</Label><NumberInput ariaLabel={t("Aporte mensual", "Monthly contribution")} value={draft.monthly} min={0} onChange={(monthly) => setDraft({ ...draft, monthly })} /></div>
              <div className="space-y-1.5"><Label htmlFor="savings-goal-year">{t("Año objetivo", "Target year")}</Label><Input id="savings-goal-year" type="number" min={new Date().getFullYear()} value={draft.targetYear} onChange={(event) => setDraft({ ...draft, targetYear: Number(event.target.value) })} /></div>
            </div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>{t("Cancelar", "Cancel")}</Button><Button disabled={!draft?.name.trim() || !draft?.target || draft.target <= 0} onClick={submit}>{t("Guardar", "Save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
