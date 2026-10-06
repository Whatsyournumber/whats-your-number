import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import type { BudgetLine } from "@/hooks/use-spend-budgets";
import { DEFAULT_BUDGET_IDS, GROUP_LABELS, findBudgetCategory, type BudgetGroup } from "@/lib/budget-categories";
import { CURRENCIES } from "@/lib/mfn-currencies";


type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lines: BudgetLine[];
  onSave: (lines: BudgetLine[]) => void;
  fmt: (n: number) => string;
  /** Desglose de «Apps/Suscripciones» (app, monto y día de cobro). */
  appSubs?: { id: string; name: string; emoji: string; amount: number; day: number }[];
  /** Abre el editor de apps. */
  onEditApps?: () => void;
};

const isAppsLine = (l: BudgetLine) =>
  l.id === "apps" || /^custom:.*(app|suscrip)/i.test(l.id) || /apps|suscripciones|subscriptions/i.test(l.label ?? "");

/** Pop-up para definir un objetivo de gasto personalizado por categoría. */
export function BudgetDialog({ open, onOpenChange, lines, onSave, fmt, appSubs, onEditApps }: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const { profile } = useProfile();
  const currencyCode = (profile?.currency as string | undefined) ?? "EUR";
  const currencySymbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "";
  const [draft, setDraft] = useState<BudgetLine[]>([]);
  const [adding, setAdding] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState<Exclude<BudgetGroup, "other">>("lifestyle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [appsOpen, setAppsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const addCategoryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let base = lines.length ? lines : DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: 0 }));
    // Salud ya no está entre las iniciales: si estaba sin monto, la sustituimos por Gimnasio.
    if (!base.some((l) => l.id === "gym")) {
      base = base.map((l) => (l.id === "health" && !l.amount ? { ...l, id: "gym" } : l));
    }
    setDraft(base);
    baseline.current = JSON.stringify(base);
    setAdding(false);
    setCustomName("");
    setCustomGroup("lifestyle");
    setEditingId(null);
    setEditingName("");
  }, [open, lines]);

  // Confirmar antes de cerrar si hay cambios sin guardar.
  const baseline = useRef<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const isDirty = baseline.current !== null && JSON.stringify(draft) !== baseline.current;
  const requestOpenChange = (v: boolean) => {
    if (!v && isDirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(v);
  };

  const label = (l: BudgetLine) => {
    const cat = findBudgetCategory(l.id);
    if (cat) return `${cat.emoji} ${l.label ?? (lang === "en" ? cat.en : cat.es)}`;
    return `${l.emoji ?? "📦"} ${l.label ?? l.id}`;
  };

  const total = draft.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);

  const setAmount = (id: string, amount: number) =>
    setDraft((d) => d.map((l) => (l.id === id ? { ...l, amount } : l)));

  /** Día del mes en que se cobra un gasto fijo (1-31). Vacío = sin fecha. */
  const setDueDay = (id: string, raw: string) => {
    const n = Math.round(Number(raw));
    const dueDay = Number.isFinite(n) && n >= 1 ? Math.min(31, n) : undefined;
    setDraft((d) =>
      d.map((l) => {
        if (l.id !== id) return l;
        const { dueDay: _omit, ...rest } = l;
        return dueDay === undefined ? rest : { ...rest, dueDay };
      }),
    );
  };

  const setTotal = (nextTotal: number) => {
    const safeTotal = Math.max(0, Math.round(nextTotal));
    setDraft((current) => {
      if (!current.length) return current;
      const currentTotal = current.reduce(
        (sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0),
        0,
      );
      if (currentTotal <= 0) {
        return current.map((line, index) => ({ ...line, amount: index === 0 ? safeTotal : 0 }));
      }

      let assigned = 0;
      return current.map((line, index) => {
        const amount =
          index === current.length - 1
            ? Math.max(0, safeTotal - assigned)
            : Math.round((Math.max(0, line.amount) / currentTotal) * safeTotal);
        assigned += amount;
        return { ...line, amount };
      });
    });
  };

  const removeLine = (id: string) => setDraft((d) => d.filter((l) => l.id !== id));

  const startEdit = (l: BudgetLine) => {
    setEditingId(l.id);
    const cat = findBudgetCategory(l.id);
    setEditingName(l.label ?? (cat ? (lang === "en" ? cat.en : cat.es) : l.id.replace(/^custom:/, "")));
  };

  const commitEdit = (id: string) => {
    const name = editingName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    setDraft((d) =>
      d.map((l) => (l.id === id ? { ...l, label: name } : l)),
    );
    setEditingId(null);
    setEditingName("");
  };


  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    setDraft((d) => [
      ...d,
      { id: `custom:${name.toLowerCase()}`, amount: 0, label: name, emoji: "📦", group: customGroup },
    ]);
    setCustomName("");
    setCustomGroup("lifestyle");
    setAdding(false);
  };

  const openAddCategory = () => {
    setCustomGroup("lifestyle");
    setAdding(true);
    window.requestAnimationFrame(() =>
      addCategoryRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={requestOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          // Esc mientras se edita el nombre solo sale del modo editar.
          if (editingId) e.preventDefault();
        }}
        className="w-[calc(100vw-1rem)] max-w-2xl max-h-[calc(100dvh-1rem)] min-w-0 overflow-x-hidden overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0 sm:max-h-[88vh] sm:px-6 sm:pb-6"
      >
        {/* Cabecera con el total mensual (no editable; se edita en el pie). */}
        <DialogHeader className="sticky top-0 z-10 -mx-3 min-w-0 space-y-1.5 bg-background/95 px-3 pb-4 pt-6 text-left backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("Tu plan de gasto mensual", "Your monthly spending plan")}
            </DialogTitle>
            {!adding ? (
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={openAddCategory}
                aria-label={t("Añadir otra categoría", "Add another category")}
                title={t("Añadir otra categoría", "Add another category")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="numeric text-3xl font-semibold">
              {new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 0 }).format(total)}
            </span>
            <span className="text-xs text-muted-foreground">{t("/mes", "/mo")}</span>
          </div>
          <DialogDescription className="text-xs leading-4 text-muted-foreground">
            <span className="sm:hidden">
              {t("Cuánto quieres gastar en cada categoría", "What you want to spend per category")}
            </span>
            <span className="hidden sm:inline">
              {t(
                "Cuánto quieres gastar en cada categoría · la IA revisa si te pasas",
                "What you want to spend per category · the AI checks if you go over",
              )}
            </span>
          </DialogDescription>

        </DialogHeader>


        <div className="space-y-4">
          {(["essentials", "lifestyle", "other"] as BudgetGroup[]).map((g) => {
            const groupLines = draft.filter((l) => (findBudgetCategory(l.id)?.group ?? l.group ?? "other") === g);
            if (!groupLines.length) return null;
            return (
              <div key={g} className="space-y-2">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t(GROUP_LABELS[g].es, GROUP_LABELS[g].en)}
                  </p>
                </div>
                {groupLines.map((l) => (
                  <div key={l.id} className="group min-w-0 rounded-xl border border-border/50 px-2 py-2 sm:px-3">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                      {editingId === l.id ? (
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => commitEdit(l.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEdit(l.id);
                            }
                            if (e.key === "Escape") {
                              // Solo sale del modo editar, no cierra el diálogo.
                              e.stopPropagation();
                              setEditingId(null);
                            }
                          }}
                          className="h-9 min-w-0 flex-1 text-sm"
                        />
                      ) : (
                        appSubs && isAppsLine(l) ? (
                          <button
                            type="button"
                            onClick={() => setAppsOpen((v) => !v)}
                            className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm"
                            aria-label={t("Ver apps", "See apps")}
                          >
                            <span className="truncate">{label(l)}</span>
                            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${appsOpen ? "rotate-180" : ""}`} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(l)}
                            className="min-w-0 flex-1 truncate text-left text-sm"
                            title={t("Toca para editar", "Tap to edit")}
                          >
                            {label(l)}
                          </button>
                        )
                      )}
                      {g === "essentials" ? (
                        <div
                          className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-border/60 bg-card/40 px-1.5 sm:gap-1.5 sm:px-2"
                          title={t("Día del mes en que se cobra", "Day of month it is charged")}
                        >
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
                            {t("día", "day")}
                          </span>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            inputMode="numeric"
                            value={l.dueDay ?? ""}
                            placeholder="—"
                            onChange={(e) => setDueDay(l.id, e.target.value)}
                            aria-label={t("Día del mes en que se cobra", "Day of month it is charged")}
                            className="h-7 w-8 border-0 bg-transparent p-0 text-center text-sm sm:w-9"
                          />
                        </div>
                      ) : null}
                      <div className="relative shrink-0">
                        <NumberInput
                          value={l.amount}
                          onChange={(v) => setAmount(l.id, v)}
                          format
                          suffix={currencySymbol || undefined}
                          ariaLabel={t("Monto objetivo mensual", "Monthly target amount")}
                          className="h-9 w-24 text-sm sm:w-28"
                        />
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(l.id)}
                          // Evita que el mousedown dispare el blur del input y desmonte este botón.
                          onMouseDown={(e) => e.preventDefault()}
                          className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm opacity-100 transition hover:text-negative [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:focus-visible:opacity-100"
                          aria-label={t("Eliminar gasto", "Delete expense")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {appSubs && isAppsLine(l) && appsOpen && (
                      <div className="mt-2 space-y-1.5 border-t border-border/40 pt-2">
                        {[...appSubs].sort((a, b) => a.day - b.day).map((a) => (
                          <div key={a.id} className="flex items-center gap-2 pl-1 text-sm">
                            <span className="w-5 shrink-0 text-center">{a.emoji}</span>
                            <span className="min-w-0 flex-1 truncate">{a.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{t(`día ${a.day}`, `day ${a.day}`)}</span>
                            <span className="numeric w-20 shrink-0 text-right text-muted-foreground">{fmt(a.amount)}</span>
                          </div>
                        ))}
                        {onEditApps && (
                          <button
                            type="button"
                            onClick={onEditApps}
                            className="flex items-center gap-1.5 pl-1 pt-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Pencil className="h-3 w-3" />
                            {t("Editar apps", "Edit apps")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Total de la sección (fijos / variables) */}
                <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t("Total", "Total")}
                  </span>
                  <span className="numeric text-sm font-semibold">
                    {fmt(groupLines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0))}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">{t("/mes", "/mo")}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {adding ? (
          <div ref={addCategoryRef} className="scroll-mt-24 space-y-4 rounded-xl border border-border/60 bg-card/40 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t("¿Qué tipo de gasto es?", "What type of expense is it?")}</p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setAdding(false);
                  setCustomName("");
                }}
                aria-label={t("Cerrar", "Close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("Tipo de gasto", "Expense type")}>
              {(["essentials", "lifestyle"] as const).map((group) => {
                const selected = customGroup === group;
                return (
                  <Button
                    key={group}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className="h-12 whitespace-nowrap px-2 text-sm"
                    onClick={() => setCustomGroup(group)}
                    aria-pressed={selected}
                  >
                    {group === "essentials"
                      ? t("Gastos fijos", "Fixed expenses")
                      : t("Gastos variables", "Variable expenses")}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t("Otra categoría", "Another category")}
                className="h-9 text-sm"
              />
              <Button type="button" size="sm" variant="secondary" onClick={addCustom} disabled={!customName.trim()}>
                {t("Añadir", "Add")}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
          {!adding ? <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("Total", "Total")}
            </span>
            <NumberInput
              value={total}
              onChange={setTotal}
              format
              min={0}
              aria-label={t("Editar gastos totales", "Edit total expenses")}
              className="numeric h-9 w-28 text-sm sm:w-32"
            />
            <span className="text-xs text-muted-foreground">{t("/mes", "/mo")}</span>
          </div> : <span />}
          <Button
            type="button"
            className="mx-1 min-w-0 w-auto self-stretch sm:mx-0 sm:w-auto sm:self-auto"
            onClick={() => {
              onSave(draft.filter((l) => Number.isFinite(l.amount)));
              onOpenChange(false);
            }}
          >
            <Check className="mr-1 h-4 w-4" />
            {t("Guardar plan", "Save plan")}
          </Button>
        </div>

      </DialogContent>
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("¿Salir sin guardar?", "Leave without saving?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Tienes cambios sin guardar. Si sales ahora, se perderán.", "You have unsaved changes. If you leave now, they will be lost.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Seguir editando", "Keep editing")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false);
                onOpenChange(false);
              }}
            >
              {t("Descartar cambios", "Discard changes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar antes de eliminar una categoría del plan. */}
      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(v) => {
          if (!v) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("¿Eliminar este gasto?", "Delete this expense?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Esta categoría saldrá de tu plan de gasto mensual.",
                "This category will be removed from your monthly spending plan.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancelar", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) removeLine(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              {t("Eliminar", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
