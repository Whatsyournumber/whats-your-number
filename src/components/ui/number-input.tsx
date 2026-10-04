import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { getWynMoneyLocale } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export function NumberInput({
  value,
  onChange,
  className,
  min,
  max,
  step,
  placeholder,
  format,
  autoFocus,
  onKeyDown,
  style,
  ariaLabel,
  disabled,
  /** Texto dentro del campo, a la derecha (p. ej. el símbolo de la moneda). */
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  /** Muestra separadores de miles mientras no se está editando. */
  format?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  ariaLabel?: string;
  disabled?: boolean;
  suffix?: string;
}) {
  const pretty = (v: number) =>
    v === 0 ? "" : format ? v.toLocaleString(getWynMoneyLocale(), { useGrouping: "always" as unknown as boolean }) : String(v);
  const [text, setText] = useState(pretty(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || document.activeElement !== ref.current) {
      setText(pretty(value));
    }
  }, [value]);

  const input = (
    <Input
      ref={ref}
      aria-label={ariaLabel}
      disabled={disabled}
      type={format ? "text" : "number"}
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      style={style}
      className={cn("numeric", suffix && "pr-8", className)}
      value={text}
      onFocus={() => {
        if (text === "0") setText("");
      }}
      onChange={(e) => {
        const raw = e.target.value;
        const next = format ? raw.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(/,/g, "") : raw;
        setText(next);
        onChange(next === "" ? 0 : Number(next));
      }}
      onBlur={() => {
        if (text === "") {
          setText("0");
          onChange(0);
        } else {
          const num = Number(text.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(/,/g, ""));
          const next = Number.isFinite(num) ? num : value;
          setText(pretty(next));
          if (num !== next) onChange(next);
        }
      }}
    />
  );
  if (!suffix) return input;
  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}
