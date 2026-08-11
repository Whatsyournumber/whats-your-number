import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage, useT } from "@/hooks/use-language";
import { planCategories } from "@/lib/category-ai.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import type { CustomCategory } from "@/hooks/use-categories";

type Msg = { role: "user" | "ai"; text: string; ops?: string[] };

type Props = {
  categories: string[];
  items: CustomCategory[];
  customRules: { name: string; keywords: string[] }[];
  merchants: { name: string; category: string; amount: number }[];
  onCreate: (name: string, keywords: string) => void;
  onUpdate: (id: string, patch: Partial<CustomCategory>) => void;
  onRemove: (id: string) => void;
};

/** Chat para que el usuario ordene sus categorías hablando en lenguaje natural. */
export function CategoryChat({
  categories,
  items,
  customRules,
  merchants,
  onCreate,
  onUpdate,
  onRemove,
}: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);

  const examples = [
    t("Pon Fandango en Nightlife", "Move Fandango to Nightlife"),
    t("Crea Mascotas", "Create Pets"),
    t("Los de ropa a Compras", "Clothing to Shopping"),
  ];

  const apply = (ops: NonNullable<Awaited<ReturnType<typeof planCategories>>["ops"]>) => {
    const notes: string[] = [];
    for (const op of ops) {
      const name = op.category.trim();
      if (!name) continue;
      const existing = items.find((i) => i.name.trim().toLowerCase() === name.toLowerCase());

      if (op.type === "remove") {
        if (existing) {
          onRemove(existing.id);
          notes.push(`${t("Eliminada", "Removed")}: ${name}`);
        }
        continue;
      }

      const keywords = op.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
      if (existing) {
        const merged = Array.from(
          new Set([
            ...existing.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean),
            ...keywords,
          ]),
        );
        onUpdate(existing.id, { keywords: merged.join(", ") });
      } else {
        onCreate(name, keywords.join(", "));
      }
      notes.push(op.note || `${name}: ${keywords.join(", ")}`);
    }
    return notes;
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const plan = await planCategories({
        data: { message, lang, environment: getPaddleEnvironment(), categories, customRules, merchants },
      });
      const notes = apply(plan.ops);
      setMsgs((m) => [...m, { role: "ai", text: plan.reply, ops: notes }]);
      if (notes.length) toast.success(t("Categorías actualizadas", "Categories updated"));
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "ai", text: t("No pude procesar eso, inténtalo de nuevo.", "I couldn't process that, please try again.") },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {t("Ordena tus gastos con IA", "Organize your spending with AI")}
      </p>

      {msgs.length > 0 && (
        <div className="max-h-[200px] space-y-1.5 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 px-3 py-1.5 text-sm"
                  : "w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-muted/60 px-3 py-1.5 text-sm"
              }
            >
              <p>{m.text}</p>
              {m.ops && m.ops.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 border-t border-border/60 pt-1.5 text-xs text-muted-foreground">
                  {m.ops.map((o, j) => (
                    <li key={j} className="flex gap-1.5">
                      <span className="text-primary">·</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {msgs.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {examples.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => void send(e)}
              className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("Ordena tus categorías hablando...", "Organize your categories by chatting...")}
          className="h-8 flex-1 border-transparent bg-muted/50 text-sm focus-visible:bg-background"
        />
        <Button type="submit" size="icon" className="h-8 w-8" disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
