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
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || document.activeElement !== ref.current) {
      setText(value === 0 ? "" : String(value));
    }
  }, [value]);

  return (
    <Input
      ref={ref}
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={cn("numeric", className)}
      value={text}
      onFocus={() => {
        if (text === "0") setText("");
      }}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        onChange(next === "" ? 0 : Number(next));
      }}
      onBlur={() => {
        if (text === "") {
          setText("0");
          onChange(0);
        } else {
          setText(String(Number(text)));
        }
      }}
    />
  );
}
