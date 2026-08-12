import { useState } from "react";
import { motion } from "motion/react";
import { Banknote, Check, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

/** Ingreso mensual total editable: ajusta el salario para cuadrar con el total escrito. */
export function useEditableIncome() {
  const { profile, save, saving } = useProfile();
  const t = useT();
  const others =
    (profile.income_bonus || 0) + (profile.income_rent || 0) + (profile.income_other || 0);
  const total = (profile.income_salary || 0) + others;

  const setTotal = async (next: number) => {
    await save({ income_salary: Math.max(0, Math.round(next - others)) });
    toast.success(t("Ingreso actualizado", "Income updated"));
  };

  return { total, setTotal, saving };
}

/** Campo compacto para editar el ingreso mensual. */
export function IncomeInline({ className }: { className?: string }) {
  const t = useT();
  const { total, setTotal, saving } = useEditableIncome();
  const [draft, setDraft] = useState<number | null>(null);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <NumberInput
        value={draft ?? total}
        onChange={setDraft}
        format
        className="h-10 w-36 text-base font-semibold"
      />
      <span className="text-xs text-muted-foreground">{t("/mes", "/mo")}</span>
      {draft !== null && draft !== total && (
        <Button
          size="sm"
          className="h-8 rounded-full"
          disabled={saving}
          onClick={async () => {
            await setTotal(draft);
            setDraft(null);
          }}
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          {t("Guardar", "Save")}
        </Button>
      )}
    </div>
  );
}

/** Tarjeta KPI de ingresos con edición en línea. */
export function IncomeKpiCard({
  value,
  delta,
  index = 0,
}: {
  value: string;
  delta?: number;
  index?: number;
}) {
  const t = useT();
  const { total, setTotal, saving } = useEditableIncome();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="surface relative overflow-hidden p-5"
    >
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t("Ingresos", "Income")}
        </p>
        <div className="flex items-center gap-1">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <button
            type="button"
            aria-label={t("Editar ingresos", "Edit income")}
            className="text-muted-foreground transition hover:text-foreground"
            onClick={() => {
              setDraft(total);
              setEditing((v) => !v);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="relative mt-3 flex items-center gap-2">
          <NumberInput value={draft} onChange={setDraft} format className="h-9 w-32 text-base font-semibold" />
          <Button
            size="sm"
            className="h-8 rounded-full"
            disabled={saving}
            onClick={async () => {
              await setTotal(draft);
              setEditing(false);
            }}
          >
            {t("Guardar", "Save")}
          </Button>
        </div>
      ) : (
        <p className="numeric relative mt-3 truncate text-2xl font-semibold leading-tight md:text-3xl" title={value}>
          {value}
        </p>
      )}

      <div className="relative mt-2 flex items-center gap-2">
        {delta !== undefined && !editing && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              delta > 0 ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
        <span className="text-xs text-muted-foreground">{t("editable", "editable")}</span>
      </div>
    </motion.div>
  );
}
