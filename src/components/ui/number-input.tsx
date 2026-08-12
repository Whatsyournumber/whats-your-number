import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
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
}) {
  const pretty = (v: number) => (v === 0 ? "" : format ? v.toLocaleString("es-ES") : String(v));
  const [text, setText] = useState(pretty(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || document.activeElement !== ref.current) {
      setText(pretty(value));
    }
  }, [value]);

  return (
    <Input
      ref={ref}
      type={format ? "text" : "number"}
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      style={style}
      className={cn("numeric", className)}
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
          setText(pretty(Number(text)));
        }
      }}
    />
  );
}
