import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { shortenMoneyString } from "@/lib/onboarding";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  accent = false,
  inverse = false,
  index = 0,
  variant = "default",
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: boolean;
  inverse?: boolean;
  index?: number;
  variant?: "default" | "flat";
}) {
  const display = value.length > 13 ? shortenMoneyString(value) : value;

  const good = delta === undefined ? true : inverse ? delta < 0 : delta > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={cn(
        "relative flex h-full flex-col overflow-hidden p-5",
        variant === "default" && "surface",
        variant === "flat" && "rounded-2xl border border-border/60 bg-card/40",
        accent && "glow",
      )}
    >
      {accent && (
        <div className="wealth-gradient pointer-events-none absolute inset-0 opacity-[0.08]" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p
        className={cn(
          "numeric relative mt-3 truncate text-ellipsis whitespace-nowrap font-semibold leading-tight",
          display.length > 22
            ? "text-base md:text-lg"
            : display.length > 16
              ? "text-lg md:text-xl"
              : display.length > 11
                ? "text-xl md:text-2xl"
                : "text-2xl md:text-3xl",
        )}
        title={value}
      >
        {display}
      </p>
      <div className="relative mt-auto flex items-center gap-2 pt-2">
        {delta !== undefined && (
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
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}
