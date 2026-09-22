import { useCallback } from "react";
import { sameMerchant } from "@/hooks/use-transactions";
import { useSyncedSetting } from "@/hooks/use-synced-setting";

export type LearnedRule = { id: string; match: string; category: string; createdAt: string };

const KEY = "whatsyournumber:learned-rules";
const EMPTY: LearnedRule[] = [];

/**
 * Reglas aprendidas: cuando el usuario mueve un movimiento a otra categoría en Gastos,
 * se guarda "comercio → categoría" y se aplica automáticamente la próxima vez.
 * Se sincroniza con la cuenta para que sea igual en móvil, tablet y ordenador.
 */
export function useCategoryRules() {
  // Sin migración de la clave antigua sin cuenta: esas reglas eran compartidas
  // entre cuentas del mismo navegador y contaminaban categorías de otra persona.
  const { value: rules, save: persist } = useSyncedSetting<LearnedRule[]>(KEY, EMPTY);

  const learn = useCallback(
    (match: string | null | undefined, category: string) => {
      const m = (match ?? "").trim();
      if (!m || !category) return;
      const rest = rules.filter((r) => !sameMerchant(r.match, m));
      persist([{ id: crypto.randomUUID(), match: m, category, createdAt: new Date().toISOString() }, ...rest]);
    },
    [rules, persist],
  );

  const remove = useCallback((id: string) => persist(rules.filter((r) => r.id !== id)), [rules, persist]);

  const resolve = useCallback(
    (merchant: string | null | undefined, description?: string | null) => {
      const hit = rules.find(
        (r) => sameMerchant(r.match, merchant) || (description && sameMerchant(r.match, description)),
      );
      return hit?.category ?? null;
    },
    [rules],
  );

  return { rules, learn, remove, resolve };
}
