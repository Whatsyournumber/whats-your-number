import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-16 pt-4 md:px-8"
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  descriptionClassName,
  actions,
  icon,
  className,
  variant = "default",
  children,
}: {
  title?: ReactNode;
  description?: string;
  descriptionClassName?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "minimal";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "p-5",
        variant === "default" && "surface",
        variant === "minimal" && "rounded-2xl border border-border/60 bg-card/40",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary [&_svg]:h-5 [&_svg]:w-5">
                {icon}
              </span>
            )}
            <div>
              {title && (
                <h2 className={cn(icon ? "text-xl font-semibold tracking-tight" : "text-sm font-semibold")}>{title}</h2>
              )}
              {description && (
                <p title={description} className={cn("mt-0.5 text-muted-foreground", icon ? "text-sm" : "text-[0.8125rem]", descriptionClassName)}>{description}</p>
              )}

            </div>
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}


export function Delta({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0;
  return (
    <span className={cn("text-xs font-medium", good ? "text-positive" : "text-negative")}>
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
