import { useState } from "react";
import { toast } from "sonner";

import { convertStoredFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/hooks/use-language";
import { convertProfileCurrency } from "@/lib/fx";
import { currencies } from "@/lib/onboarding";

/** Selector de moneda: reconvierte todos los importes del perfil a la divisa elegida. */
export function CurrencyToggle({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const { profile, save } = useProfile();
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const current = profile.currency || "EUR";

  const onChange = async (next: string) => {
    if (!next || next === current) return;
    setBusy(true);
    try {
      convertStoredFixedExpenses(current, next);
      const { completed: _c, ...rest } = convertProfileCurrency(profile, current, next);
      await save({ ...rest, currency: next });
      toast.success(t(`Moneda cambiada a ${next}`, `Currency switched to ${next}`), {
        description: t("Convertimos todos tus importes con la tasa del día.", "We converted every amount using today's rate."),
      });
    } catch {
      toast.error(t("No pudimos cambiar la moneda", "We couldn't change the currency"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <select
      aria-label={t("Moneda", "Currency")}
      disabled={busy}
      value={current}
      onChange={(e) => void onChange(e.target.value)}
      className={`h-7 rounded-full border border-border bg-transparent px-2 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:opacity-50 ${className}`}
    >
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code}
        </option>
      ))}
    </select>
  );
}
