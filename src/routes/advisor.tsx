import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, Sparkles, TrendingUp } from "lucide-react";

import { PageHeader, PageShell, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/hooks/use-language";
import { fmt, insights, lifestyle, topMerchants, totalExpenses } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "AI Advisor — Finance OS" },
      { name: "description", content: "Insights automáticos, detección de gastos inusuales y respuestas en lenguaje natural sobre tus finanzas." },
      { property: "og:title", content: "AI Advisor — Finance OS" },
      { property: "og:description", content: "Tu CFO personal: pregúntale a tus datos financieros en lenguaje natural." },
    ],
  }),
  component: Advisor,
});

type Msg = { role: "user" | "assistant"; content: string };

function useSuggestions(t: (es: string, en: string) => string) {
  return [
    t("¿En qué gasté más este año?", "What did I spend the most on this year?"),
    t("¿Cuánto gasté en restaurantes en Barcelona?", "How much did I spend on restaurants in Barcelona?"),
    t("¿Cuánto he invertido en IA?", "How much have I invested in AI?"),
    t("¿Puedo permitirme un viaje de $4.000?", "Can I afford a $4,000 trip?"),
  ];
}

function answer(q: string, t: (es: string, en: string) => string): string {
  const lower = q.toLowerCase();
  if (lower.includes("restaurante") || lower.includes("restaurant")) {
    return t(
      `En restaurantes llevas ${fmt(1180)} este mes, un 37% sobre tu presupuesto de ${fmt(900)}. En Barcelona (etiqueta "España 2026") gastaste ${fmt(374)} en 3 salidas, con Sushi Kaito como principal comercio.`,
      `You've spent ${fmt(1180)} on restaurants this month, 37% over your ${fmt(900)} budget. In Barcelona (tag "Spain 2026") you spent ${fmt(374)} across 3 outings, with Sushi Kaito as the top merchant.`,
    );
  }
  if (lower.includes("ia") || lower.includes("ai")) {
    return t(
      `Tienes ${fmt(48)}/mes en suscripciones de IA (OpenAI). En el año suman ${fmt(576)}. En inversión temática ligada a IA (NVDA, MSFT) tienes ${fmt(51400)} a valor de mercado, con una ganancia de ${fmt(21230)}.`,
      `You have ${fmt(48)}/month in AI subscriptions (OpenAI). That's ${fmt(576)} for the year. In AI-themed investments (NVDA, MSFT) you have ${fmt(51400)} at market value, with a gain of ${fmt(21230)}.`,
    );
  }
  if (lower.includes("viaje") || lower.includes("trip") || lower.includes("4.000") || lower.includes("4000")) {
    return t(
      `Sí, con matices. Tu flujo libre mensual es ${fmt(2760)} y tienes ${fmt(42600)} en efectivo. Un viaje de ${fmt(4000)} equivale a 1.4 meses de flujo libre y no afecta tu fondo de emergencia (85% completo). Recomiendo financiarlo en 2 meses sin tocar inversiones.`,
      `Yes, with some nuance. Your monthly free cash flow is ${fmt(2760)} and you have ${fmt(42600)} in cash. A ${fmt(4000)} trip equals 1.4 months of free cash flow and doesn't affect your emergency fund (85% complete). I recommend financing it over 2 months without touching investments.`,
    );
  }
  if (lower.includes("más") || lower.includes("mas") || lower.includes("año") || lower.includes("year") || lower.includes("most")) {
    return t(
      `Tu mayor gasto del año es Vivienda (${fmt(2480)}/mes, 28% del total). Le siguen Viajes (${fmt(2050)}) y Restaurantes (${fmt(1180)}). El gasto total de agosto fue ${fmt(totalExpenses)}.`,
      `Your biggest expense this year is Housing (${fmt(2480)}/month, 28% of total). Followed by Travel (${fmt(2050)}) and Restaurants (${fmt(1180)}). Total spending in August was ${fmt(totalExpenses)}.`,
    );
  }
  return t(
    `Este mes gastaste ${fmt(totalExpenses)} y ahorraste el 45% de tus ingresos — tu mejor tasa del año. Tu principal comercio fue ${topMerchants[0]!.name} con ${fmt(topMerchants[0]!.amount)}. Si quieres, puedo profundizar por categoría, comercio o etiqueta de viaje.`,
    `This month you spent ${fmt(totalExpenses)} and saved 45% of your income — your best rate of the year. Your top merchant was ${topMerchants[0]!.name} with ${fmt(topMerchants[0]!.amount)}. If you want, I can dig deeper by category, merchant, or travel tag.`,
  );
}

function Advisor() {
  const t = useT();
  const suggestions = useSuggestions(t);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: t(
        "Soy tu CFO personal. Analicé tus 12 últimos meses: tu patrimonio creció 3.5% y tu tasa de ahorro llegó a 45%. Pregúntame lo que quieras sobre tus finanzas.",
        "I'm your personal CFO. I analyzed your last 12 months: your net worth grew 3.5% and your savings rate reached 45%. Ask me anything about your finances.",
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: answer(q, t) }]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("Inteligencia", "Intelligence")}
        title="AI Advisor"
        subtitle={t(
          "Insights automáticos y respuestas en lenguaje natural sobre tu vida financiera.",
          "Automatic insights and natural language answers about your financial life.",
        )}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("Conversación", "Conversation")} className="flex flex-col lg:col-span-2">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 420 }}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-elevated/80",
                  )}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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

          <form
            className="mt-3 flex items-end gap-2"
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
              placeholder={t("Pregunta sobre tus gastos, inversiones o metas…", "Ask about your spending, investments or goals…")}
              className="min-h-[52px] resize-none rounded-2xl"
            />
            <Button type="submit" size="icon" className="h-[52px] w-[52px] rounded-2xl">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel title={t("Insights generados", "Generated insights")}>
            <ul className="space-y-2.5">
              {insights.slice(0, 5).map((i) => (
                <li key={i.title} className="rounded-xl bg-elevated/60 p-3">
                  <div className="flex items-center gap-2">
                    {i.type === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    ) : i.type === "positive" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-positive" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">{i.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{i.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t("Anomalías detectadas", "Detected anomalies")}>
            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-warning/30 bg-warning/8 p-3">
                <p className="font-medium text-warning">{t("Cobro duplicado", "Duplicate charge")}</p>
                <p className="mt-1 text-muted-foreground">{t(`Uber ${fmt(38)} × 2 el 22 de agosto.`, `Uber ${fmt(38)} × 2 on August 22.`)}</p>
              </div>
              <div className="rounded-xl border border-warning/30 bg-warning/8 p-3">
                <p className="font-medium text-warning">{t("Suscripción nueva", "New subscription")}</p>
                <p className="mt-1 text-muted-foreground">
                  {t(
                    `${lifestyle.subscriptions[0]!.name} ${fmt(lifestyle.subscriptions[0]!.amount)}/mes.`,
                    `${lifestyle.subscriptions[0]!.name} ${fmt(lifestyle.subscriptions[0]!.amount)}/month.`,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="font-medium">{t("Gasto inusual", "Unusual expense")}</p>
                <p className="mt-1 text-muted-foreground">{t(`Hotel Casa Bonay ${fmt(760)}: 4.2× tu ticket habitual.`, `Hotel Casa Bonay ${fmt(760)}: 4.2× your usual ticket.`)}</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
