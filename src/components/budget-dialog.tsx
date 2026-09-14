import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lines: BudgetLine[];
  onSave: (lines: BudgetLine[]) => void;
  fmt: (n: number) => string;
};

/** Pop-up para definir un objetivo de gasto personalizado por categoría. */
export function BudgetDialog({ open, onOpenChange, lines, onSave, fmt }: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const [draft, setDraft] = useState<BudgetLine[]>([]);
  const [adding, setAdding] = useState(false);
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(lines.length ? lines : DEFAULT_BUDGET_IDS.map((id) => ({ id, amount: 0 })));
    setAdding(false);
    setCustomName("");
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

  const removeLine = (id: string) => setDraft((d) => d.filter((l) => l.id !== id));

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
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Objetivo de gasto personalizado", "Custom spending plan")}</DialogTitle>
          <DialogDescription>
            {t(
              "Define cuánto quieres gastar al mes en cada categoría. La IA revisará si te pasaste de tu plan.",
              "Set how much you want to spend each month per category. The AI will check if you went over your plan.",
            )}
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
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{label(l)}</span>
                    <NumberInput value={l.amount} onChange={(v) => setAmount(l.id, v)} format className="h-9 w-28 text-sm" />
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      className="text-muted-foreground transition hover:text-negative"
                      aria-label={t("Quitar", "Remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                placeholder={t("Otra categoría...", "Another category...")}
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

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("Total del plan", "Plan total")}</p>
            <p className="numeric text-lg font-semibold">
              {fmt(total)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{t("/mes", "/mo")}</span>
            </p>
          </div>
          <Button
            type="button"
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
