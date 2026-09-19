import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

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
import type { BudgetLine } from "@/hooks/use-spend-budgets";
import { BUDGET_CATEGORIES, DEFAULT_BUDGET_IDS, GROUP_LABELS, findBudgetCategory, type BudgetGroup } from "@/lib/budget-categories";


type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lines: BudgetLine[];
  onSave: (lines: BudgetLine[]) => void;
  fmt: (n: number) => string;
  /** Importes que vienen de los gastos fijos y no se editan dos veces. */
  automaticAmounts?: Record<string, number>;
};

/** Pop-up para definir un objetivo de gasto personalizado por categoría. */
export function BudgetDialog({ open, onOpenChange, lines, onSave, fmt, automaticAmounts = {} }: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const [draft, setDraft] = useState<BudgetLine[]>([]);
  const [adding, setAdding] = useState(false);
  const [customName, setCustomName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (!open) return;
    let base = lines.length ? lines : DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: 0 }));
    // Salud ya no está entre las iniciales: si estaba sin monto, la sustituimos por Gimnasio.
    if (!base.some((l) => l.id === "gym")) {
      base = base.map((l) => (l.id === "health" && !l.amount ? { ...l, id: "gym" } : l));
    }
    setDraft(base);
    setAdding(false);
    setCustomName("");
    setEditingId(null);
    setEditingName("");
  }, [open, lines]);

  const label = (l: BudgetLine) => {
    const cat = findBudgetCategory(l.id);
    if (cat) return `${cat.emoji} ${lang === "en" ? cat.en : cat.es}`;
    return `${l.emoji ?? "📦"} ${l.label ?? l.id}`;
  };

  const total = draft.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);

  const available = useMemo(() => {
    const used = new Set(draft.map((l) => l.id));
    const groups: Record<BudgetGroup, typeof BUDGET_CATEGORIES> = { essentials: [], lifestyle: [], other: [] };
    for (const c of BUDGET_CATEGORIES) if (!used.has(c.id)) groups[c.group].push(c);
    return groups;
  }, [draft]);

  const setAmount = (id: string, amount: number) =>
    setDraft((d) => d.map((l) => (l.id === id ? { ...l, amount } : l)));

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

  const isCustom = (id: string) => id.startsWith("custom:");

  const startEdit = (l: BudgetLine) => {
    setEditingId(l.id);
    setEditingName(l.label ?? l.id.replace(/^custom:/, ""));
  };

  const commitEdit = (id: string) => {
    const name = editingName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    const nextId = `custom:${name.toLowerCase()}`;
    setDraft((d) =>
      d.map((l) =>
        l.id === id
          ? { ...l, id: d.some((o) => o.id === nextId && o.id !== id) ? l.id : nextId, label: name }
          : l,
      ),
    );
    setEditingId(null);
    setEditingName("");
  };


  const addCategory = (id: string) => {
    setDraft((d) => [...d, { id, amount: 0 }]);
    setAdding(false);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    setDraft((d) => [...d, { id: `custom:${name.toLowerCase()}`, amount: 0, label: name, emoji: "📦" }]);
    setCustomName("");
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto pt-0">
        {/* Cabecera con el total mensual (no editable; se edita en el pie). */}
        <DialogHeader className="sticky top-0 z-10 -mx-6 space-y-1.5 bg-background/95 px-6 pb-4 pt-6 text-left backdrop-blur-sm">
          <DialogTitle className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">

            {t("Tu plan de gasto mensual", "Your monthly spending plan")}
          </DialogTitle>
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
            const groupLines = draft.filter((l) => (findBudgetCategory(l.id)?.group ?? "other") === g);
            if (!groupLines.length) return null;
            return (
              <div key={g} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {t(GROUP_LABELS[g].es, GROUP_LABELS[g].en)}
                </p>
                {groupLines.map((l) => (
                  <div key={l.id} className="rounded-xl border border-border/50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      {editingId === l.id ? (
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => commitEdit(l.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(l.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-9 min-w-0 flex-1 text-sm"
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-sm">{label(l)}</span>
                      )}
                      {isCustom(l.id) && editingId !== l.id ? (
                        <button
                          type="button"
                          onClick={() => startEdit(l)}
                          className="text-muted-foreground transition hover:text-primary"
                          aria-label={t("Editar", "Edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                       <div className="flex shrink-0 flex-col items-end gap-0.5">
                         <NumberInput
                           value={l.amount}
                           onChange={(v) => setAmount(l.id, v)}
                           format
                           disabled={automaticAmounts[l.id] !== undefined}
                           ariaLabel={t("Monto objetivo mensual", "Monthly target amount")}
                           className="h-9 w-28 text-sm"
                         />
                         {automaticAmounts[l.id] !== undefined ? (
                           <span className="text-[10px] leading-none text-positive">
                             {t("Automático", "Automatic")}
                           </span>
                         ) : null}
                       </div>
                      <button
                        type="button"
                        onClick={() => removeLine(l.id)}
                        className="text-muted-foreground transition hover:text-negative"
                        aria-label={t("Quitar", "Remove")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {adding ? (
          <div className="space-y-3 rounded-xl border border-border/50 p-3">
            {(Object.keys(available) as BudgetGroup[]).map((g) =>
              available[g].length ? (
                <div key={g}>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t(GROUP_LABELS[g].es, GROUP_LABELS[g].en)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {available[g].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => addCategory(c.id)}
                        className="rounded-full border border-border/60 px-2.5 py-1 text-xs transition hover:border-primary/50"
                      >
                        {c.emoji} {lang === "en" ? c.en : c.es}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
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
        ) : (
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setAdding(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("Añadir categoría", "Add category")}
          </Button>
        )}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
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
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
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
    </Dialog>
  );
}
