import { useState } from "react";
import { Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";
import { planCategories } from "@/lib/category-ai.functions";
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
  const { t, lang } = useLanguage();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);

  const examples = [
    t("Pon Fandango en Nightlife", "Move Fandango to Nightlife"),
    t("Crea una categoría Mascotas con veterinario y petshop", "Create a Pets category with vet and petshop"),
    t("Los de Otros que sean de ropa mándalos a Compras", "Send the clothing ones in Other to Shopping"),
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
        data: { message, lang, categories, customRules, merchants },
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
    <div className="rounded-2xl border border-border/60 bg-elevated/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-medium">{t("Ordena tus categorías hablando", "Organize your categories by chatting")}</p>
      </div>

      {msgs.length > 0 && (
        <div className="mb-3 max-h-[260px] space-y-2 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 px-3 py-2 text-sm"
                  : "w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-muted/60 px-3 py-2 text-sm"
              }
            >
              <p>{m.text}</p>
              {m.ops && m.ops.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 border-t border-border/60 pt-1.5 text-xs text-muted-foreground">
                  {m.ops.map((o, j) => (
                    <li key={j} className="flex gap-1.5">
                      <Wand2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
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
        <div className="mb-2 flex flex-wrap gap-1.5">
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
          placeholder={t("Ej. pon todos los cafés en Restaurantes", "E.g. put all coffee shops in Restaurants")}
          className="h-9 flex-1 text-sm"
        />
        <Button type="submit" size="icon" className="h-9 w-9" disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
