import type { LucideIcon } from "lucide-react";
import { Pencil } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";

export function EditableKpiCard({
  label,
  value,
  rawValue = 0,
  onChange = () => {},
  valueFormatter = (n: number) => String(n),
  delta,
  hint,
  icon: Icon,
  accent = false,
  inverse = false,
  index = 0,
  variant = "default",
  editHref,
}: {
  label: string;
  value: string;
  rawValue?: number;
  onChange?: (v: number) => void;
  valueFormatter?: (n: number) => string;
  delta?: number;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
  inverse?: boolean;
  index?: number;
  variant?: "default" | "flat";
  editHref?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rawValue);

  const commit = () => {
    setEditing(false);
    if (draft !== rawValue) onChange(draft);
  };

  const startEdit = () => {
    setDraft(rawValue);
    setEditing(true);
  };

  const good = delta === undefined ? true : inverse ? delta < 0 : delta > 0;

  const EditButton = editHref ? (
    <Link
      to={editHref}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Edit"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={startEdit}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Edit"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden p-5",
        variant === "default" && "surface",
        variant === "flat" && "rounded-2xl border border-border/60 bg-card/40",
        accent && "glow",
      )}
    >
      {accent && <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />}
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {EditButton}
        </div>
      </div>

      {!editHref && editing ? (
        <div className="mt-3">
          <NumberInput
            value={draft}
            onChange={setDraft}
            format
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(rawValue);
                setEditing(false);
              }
            }}
            className="h-10 text-lg font-semibold"
          />
        </div>
      ) : (
        <p
          className={cn(
            "numeric relative mt-3 truncate text-ellipsis whitespace-nowrap font-semibold leading-tight",
            value.length > 22
              ? "text-base md:text-lg"
              : value.length > 16
                ? "text-lg md:text-xl"
                : value.length > 11
                  ? "text-xl md:text-2xl"
                  : "text-2xl md:text-3xl",
          )}
          title={value}
        >
          {value}
        </p>
      )}

      <div className="relative mt-2 flex items-center gap-2">
        {delta !== undefined && !editing && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              good ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
        {hint && !editing && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}
