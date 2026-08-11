import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUp, Loader2, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions } from "@/hooks/use-transactions";
import { askAdvisor } from "@/lib/ask-advisor.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

/** Renderizado mínimo de markdown (negritas, viñetas y títulos). */
function Rich({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const bullet = /^\s*[-*]\s+/.test(line);
        const heading = /^#{1,6}\s+/.test(line);
        const clean = line.replace(/^\s*[-*]\s+/, "").replace(/^#{1,6}\s+/, "");
        const parts = clean.split(/(\*\*[^*]+\*\*)/g);
        const body = parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} className="font-semibold text-foreground">
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        );
        if (heading)
          return (
            <p key={i} className="pt-1 text-sm font-semibold text-foreground">
              {body}
            </p>
          );
        return (
          <p key={i} className={cn("text-sm leading-relaxed", bullet && "pl-4 -indent-3")}>
            {bullet ? <span className="text-primary">• </span> : null}
            {body}
          </p>
        );
      })}
    </div>
  );
}

export function AskAiSearch() {
  const t = useT();
  const { lang } = useLanguage();
  const { profile } = useProfile();
  const { transactions } = useTransactions();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const d = buildDataset(profile);

  const buildContext = () => {
    const byCat = new Map<string, number>();
    for (const tx of transactions ?? []) {
      const amount = Math.abs(Number(tx.amount) || 0);
      const key = (tx.category as string | undefined) ?? "Otros";
      byCat.set(key, (byCat.get(key) ?? 0) + amount);
    }
    const cats = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, amount]) => `- ${name}: ${amount.toFixed(0)} ${d.currency}`)
      .join("\n");

    return `Moneda: ${d.currency}
Ingresos mensuales: ${d.income.toFixed(0)}
Gastos mensuales: ${d.expenses.toFixed(0)}
Ahorro mensual: ${d.savings.toFixed(0)} (tasa ${d.savingsRate.toFixed(0)}%)
Patrimonio neto: ${d.netWorth.toFixed(0)} (activos ${d.totalAssets.toFixed(0)}, deudas ${d.totalLiabilities.toFixed(0)})
Objetivo de capital (Your Number): ${d.plan.targetCapital.toFixed(0)}
Edad de libertad estimada: ${d.plan.freedomAge}
Activos: ${d.assets.map((a) => `${a.name} ${a.value.toFixed(0)}`).join(", ") || "sin datos"}
Deudas: ${d.liabilities.map((l) => `${l.name} ${l.value.toFixed(0)}`).join(", ") || "sin datos"}
Metas: ${d.goals.map((g) => `${g.name} ${g.current.toFixed(0)}/${g.target.toFixed(0)}`).join(", ") || "sin datos"}
Gasto por categoría (histórico importado):
${cats || "- sin datos"}`;
  };

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await askAdvisor({
        data: { question, lang: lang === "en" ? "en" : "es", context: buildContext(), environment: getPaddleEnvironment(), history },
      });
      return res.answer;
    },
    onSuccess: (answer) => setMessages((m) => [...m, { role: "assistant", content: answer }]),
    onError: (e: unknown) =>
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error
              ? e.message
              : t("No pude responder ahora mismo. Inténtalo de nuevo.", "I couldn't answer right now. Please try again."),
        },
      ]),
  });

  const send = (text: string) => {
    const q = text.trim();
    if (!q || ask.isPending) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    ask.mutate(q);
  };

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  const suggestions = [
    t("¿Me conviene amortizar hipoteca o invertir?", "Should I prepay my mortgage or invest?"),
    t("¿Cuánto debo tener en fondo de emergencia?", "How much emergency fund do I need?"),
    t("¿Cómo bajo mis gastos un 15%?", "How do I cut my expenses by 15%?"),
    t("¿En qué invierto mi ahorro mensual?", "Where should I invest my monthly savings?"),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="ml-2 hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{t("Pregúntale al AI Advisor…", "Ask the AI Advisor…")}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("Pregúntale al AI Advisor", "Ask the AI Advisor")}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[45vh] min-h-[140px] space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t(
                "Pregúntame cualquier cosa de finanzas personales: presupuesto, deudas, hipoteca, inversión, retiro… Uso tus números cuando aplican.",
                "Ask me anything about personal finance: budgeting, debt, mortgage, investing, retirement… I use your numbers when relevant.",
              )}
            </p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-elevated/80",
                  )}
                >
                  {m.role === "user" ? m.content : <Rich text={m.content} />}
                </div>
              </div>
            ))
          )}
          {ask.isPending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("Pensando…", "Thinking…")}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={t("Escribe tu pregunta…", "Type your question…")}
            className="min-h-[52px] resize-none rounded-2xl"
          />
          <Button type="submit" size="icon" disabled={ask.isPending} className="h-[52px] w-[52px] rounded-2xl">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
