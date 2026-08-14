import { useEffect, useRef, useState } from "react";
import { CURRENCIES } from "@/lib/mfn-currencies";
import { useI18n } from "@/lib/mfn-i18n";
import { useUpdateMember } from "@/hooks/use-mfn";
import { useFx } from "@/lib/mfn-fx";

/** Selector compacto de moneda; la tasa del día aparece en un pop-up que se desvanece solo. */
export function CurrencySelect({
  memberId,
  currency,
  baseCurrency,
  className = "",
}: {
  memberId: string;
  currency: string;
  baseCurrency?: string | undefined;
  className?: string;
}) {
  const { lang } = useI18n();
  const update = useUpdateMember();
  const fx = useFx(baseCurrency || currency, currency);
  const converted = fx.from !== fx.to;
  const locale = lang === "en" ? "en-US" : "es-ES";

  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = () => {
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 2600);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const rateLine = fx.isLoading
    ? "…"
    : `1 ${fx.from} = ${fx.factor.toLocaleString(locale, {
        maximumFractionDigits: fx.factor > 100 ? 2 : 4,
      })} ${fx.to}`;

  return (
    <span className="relative flex items-center gap-1">
      <select
        aria-label={lang === "en" ? "Currency" : "Moneda"}
        value={currency}
        onChange={(e) => {
          update.mutate({ id: memberId, patch: { currency: e.target.value } });
          flash();
        }}
        className={`rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-[11px] font-bold text-foreground outline-none ${className}`}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.symbol}
          </option>
        ))}
      </select>

      <span
        role="status"
        className={`pointer-events-none absolute right-0 top-[calc(100%+8px)] z-50 w-max max-w-[220px] rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-left shadow-lg backdrop-blur transition-all duration-300 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
        }`}
      >
        <span className="block text-[11px] font-bold text-foreground">
          {converted
            ? rateLine
            : lang === "en"
              ? `${currency} · base currency`
              : `${currency} · moneda base`}
        </span>
        {converted ? (
          <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
            {lang === "en" ? "Daily market rate" : "Tasa de mercado del día"}
            {fx.updatedAt ? ` · ${fx.updatedAt}` : ""}
          </span>
        ) : null}
      </span>
    </span>
  );
}
