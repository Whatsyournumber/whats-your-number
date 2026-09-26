import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUp, Mic, MicOff, Sparkles, Volume2, VolumeX } from "lucide-react";

import { Rich, ThinkingIndicator } from "@/components/ask-ai-search";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { findBudgetCategory } from "@/lib/budget-categories";
import { askAdvisor } from "@/lib/ask-advisor.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { buildDataset } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

/** Consejos con IA: pregunta (por voz o texto) si puedes permitirte una decisión según tu presupuesto. */
export function BudgetVoiceAdvisor({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const { lang } = useLanguage();
  const { profile } = useProfile();
  const { transactions } = useTransactions();
  const { lines: budgetLines } = useSpendBudgets();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<AnyRecognition>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const stopSpeaking = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  };

  const speak = async (text: string) => {
    if (!voiceOn) return;
    stopSpeaking();
    setSpeaking(true);
    try {
      const plain = text.replace(/[*_#`>]/g, "").slice(0, 1200);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain, lang: lang === "en" ? "en" : "es" }),
      });
      if (!res.ok) throw new Error("tts");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  };

  const d = buildDataset(profile);

  const buildContext = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const day = now.getDate();
    const rows = (transactions ?? []).filter((tx) => !tx.excluded && (tx.tx_date ?? "").startsWith(ym));
    const hasNeg = rows.some((tx) => Number(tx.amount) < 0);
    const spent = rows
      .filter((tx) => (hasNeg ? Number(tx.amount) < 0 : true))
      .reduce((s, tx) => s + Math.abs(Number(tx.amount) || 0), 0);
    const budget = d.expenses;
    const daily = day > 0 ? spent / day : 0;
    const projected = daily * daysInMonth;
    const left = budget - spent;
    const overDay = daily > 0 && budget > spent ? Math.ceil(budget / daily) : null;
    const overDate =
      overDay && overDay <= daysInMonth ? `día ${overDay} de este mes` : spent >= budget ? "ya superado" : "no se pasaría este mes";
    const catLines =
      budgetLines
        .filter((l) => Number(l.amount) > 0)
        .map((l) => {
          const cat = findBudgetCategory(l.id);
          const label = cat ? (lang === "en" ? cat.en : cat.es) : (l.label ?? l.id);
          return `${cat?.emoji ?? l.emoji ?? ""} ${label}: ${Number(l.amount).toFixed(0)}`.trim();
        })
        .join(", ") || "sin datos";

    return `MODO: Consejos de presupuesto. El usuario pregunta si puede tomar una decisión de gasto.
Responde en máximo ~90 palabras: 1) veredicto claro al inicio en negrita (Sí puedes / Con cuidado / Mejor no), 2) cuánto le queda del presupuesto del mes tras esa decisión, 3) si va bien o no al ritmo actual y en qué fecha se pasaría del presupuesto (recalcula con el nuevo gasto), 4) una alternativa concreta. Usa solo estas cifras.
REGLA DE CATEGORÍA: identifica a qué categoría del plan de gasto pertenece lo que el usuario menciona (por lo que dice, no por costumbre) y analiza el gasto DENTRO de esa categoría, con su presupuesto y su alternativa. No repitas siempre la misma categoría: cada pregunta usa la categoría que corresponda.
Fecha de hoy: ${now.toISOString().slice(0, 10)} (día ${day} de ${daysInMonth})
Moneda: ${d.currency}
Ingresos mensuales: ${d.income.toFixed(0)}
Presupuesto de gasto mensual: ${budget.toFixed(0)}
Gastado este mes hasta hoy: ${spent.toFixed(0)}
Le queda del presupuesto: ${left.toFixed(0)}
Ritmo diario actual: ${daily.toFixed(0)} — proyección fin de mes: ${projected.toFixed(0)}
Al ritmo actual se pasaría: ${overDate}
Categorías del plan de gasto (presupuesto mensual de cada una): ${catLines}
Ahorro mensual previsto: ${d.savings.toFixed(0)} (tasa ${d.savingsRate.toFixed(0)}%)
Patrimonio neto: ${d.netWorth.toFixed(0)}
Metas: ${d.goals.map((g) => `${g.name} ${g.current.toFixed(0)}/${g.target.toFixed(0)}`).join(", ") || "sin datos"}`;
  };

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const history = messages.slice(-6);
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
          content: e instanceof Error ? e.message : t("No pude responder ahora. Inténtalo de nuevo.", "I couldn't answer right now. Try again."),
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

  const stopListening = () => {
    recRef.current?.stop?.();
    setListening(false);
  };

  const startListening = () => {
    const w = window as unknown as { SpeechRecognition?: AnyRecognition; webkitSpeechRecognition?: AnyRecognition };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("Tu navegador no permite dictado por voz. Escribe tu pregunta.", "Your browser doesn't support voice. Type your question.") },
      ]);
      return;
    }
    const rec = new SR();
    rec.lang = lang === "en" ? "en-US" : "es-ES";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: AnyRecognition) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      finalText = text;
      setInput(text);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) send(finalText);
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => {
    if (!open) stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  const suggestions = [
    t("¿Puedo gastar 150 en una cena este finde?", "Can I spend 150 on dinner this weekend?"),
    t("¿Voy bien con mi presupuesto este mes?", "Am I on track with my budget this month?"),
    t("¿Puedo comprar un móvil de 800?", "Can I buy an 800 phone?"),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("Consejos con IA", "AI advice")}
          </DialogTitle>
          <DialogDescription>
            {t("Pregunta si puedes gastar y te digo si vas bien", "Ask if you can spend and I'll tell you if you're on track")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xl border border-border px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                m.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {m.role === "user" ? m.content : <Rich text={m.content} />}
            </div>
          ))}
          {ask.isPending && <ThinkingIndicator txCount={transactions?.length ?? 0} />}
          <div ref={endRef} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? t("Parar", "Stop") : t("Hablar", "Speak")}
            className={cn(
              "grid h-16 w-16 place-items-center rounded-full bg-positive text-background shadow-lg shadow-positive/40 transition-transform active:scale-95",
              listening && "animate-pulse",
            )}
          >
            {listening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </button>
          <span className="text-xs text-muted-foreground">
            {listening ? t("Te escucho…", "Listening…") : t("Toca y pregunta en voz alta", "Tap and ask out loud")}
          </span>
        </div>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder={t("O escribe: ¿puedo gastar 200 en…?", "Or type: can I spend 200 on…?")}
            className="min-h-11 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || ask.isPending}>
            <ArrowUp className="h-5 w-5" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
