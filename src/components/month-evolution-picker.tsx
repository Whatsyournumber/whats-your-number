import { useEffect, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage, useT } from "@/hooks/use-language";

/**
 * Selector de mes (año + cuadrícula de 12 meses) para ver la evolución
 * mes a mes en las gráficas. `value = null` significa "evolución completa".
 */
export function MonthEvolutionPicker({
  availableKeys,
  value,
  onChange,
}: {
  /** Meses con datos, en formato "YYYY-MM". */
  availableKeys: string[];
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const fallbackKey = availableKeys[availableKeys.length - 1] ?? null;
  const activeKey = value && availableKeys.includes(value) ? value : fallbackKey;
  const activeDate = activeKey
    ? new Date(Number(activeKey.slice(0, 4)), Number(activeKey.slice(5, 7)) - 1, 1)
    : new Date();

  const [year, setYear] = useState(activeDate.getFullYear());
  useEffect(() => {
    if (open) setYear(activeDate.getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = activeKey
    ? activeDate.toLocaleDateString(lang, { month: "short", year: "numeric" }).replace(/\./g, "")
    : t("Evolución", "Evolution");

  if (!availableKeys.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-xs capitalize md:text-sm">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} className="w-[min(92vw,20rem)] p-3">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{year}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, m) => {
            const key = `${year}-${String(m + 1).padStart(2, "0")}`;
            const available = availableKeys.includes(key);
            return (
              <Button
                key={key}
                size="sm"
                variant={key === activeKey && value !== null ? "default" : "ghost"}
                disabled={!available}
                className="rounded-lg capitalize"
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
              >
                {new Date(year, m, 1).toLocaleDateString(lang, { month: "short" }).replace(/\./g, "")}
              </Button>
            );
          })}
        </div>
        {value !== null && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
          >
            {t("Ver evolución completa", "View full evolution")}
          </button>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {t("Solo meses con datos disponibles.", "Only months with available data.")}
        </p>
      </PopoverContent>
    </Popover>
  );
}
