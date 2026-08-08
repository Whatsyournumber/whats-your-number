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

function answer(q: string, t: (es: string, en: string) => string, d: Dataset): string {
  const lower = q.toLowerCase();
  const fmt = d.fmt;
  const free = Math.max(0, d.income - d.expenses);
  const emergency = d.goals[1];
  if (lower.includes("ahorro") || lower.includes("saving")) {
    return t(
      `Ahorras ${fmt(d.savings)} al mes, un ${d.savingsRate.toFixed(0)}% de tus ingresos de ${fmt(d.income)}. A ese ritmo llegas a Your Number (${d.fmtCompact(d.plan.targetCapital)}) a los ${d.plan.freedomAge} años.`,
      `You save ${fmt(d.savings)} per month, ${d.savingsRate.toFixed(0)}% of your ${fmt(d.income)} income. At that pace you reach Your Number (${d.fmtCompact(d.plan.targetCapital)}) at age ${d.plan.freedomAge}.`,
    );
  }
  if (lower.includes("patrimonio") || lower.includes("net worth") || lower.includes("número") || lower.includes("number")) {
    return t(
      `Tu patrimonio neto es ${fmt(d.netWorth)} (activos ${fmt(d.totalAssets)} − deudas ${fmt(d.totalLiabilities)}). Tu número para vivir de tus rentas es ${d.fmtCompact(d.plan.targetCapital)}: llevas ${d.plan.targetCapital > 0 ? ((Math.max(0, d.netWorth) / d.plan.targetCapital) * 100).toFixed(1) : "0"}% del camino.`,
      `Your net worth is ${fmt(d.netWorth)} (assets ${fmt(d.totalAssets)} − debt ${fmt(d.totalLiabilities)}). Your number to live off returns is ${d.fmtCompact(d.plan.targetCapital)}: you're ${d.plan.targetCapital > 0 ? ((Math.max(0, d.netWorth) / d.plan.targetCapital) * 100).toFixed(1) : "0"}% of the way there.`,
    );
  }
  if (lower.includes("emergencia") || lower.includes("emergency")) {
    return t(
      `Tu colchón líquido es ${fmt(emergency?.current ?? 0)} y necesitas ${fmt(emergency?.target ?? 0)} para cubrir 6 meses de gastos (${fmt(d.expenses)}/mes).`,
      `Your liquid buffer is ${fmt(emergency?.current ?? 0)} and you need ${fmt(emergency?.target ?? 0)} to cover 6 months of expenses (${fmt(d.expenses)}/month).`,
    );
  }
  const trip = Number((lower.match(/(\d[\d.,]{2,})/)?.[1] ?? "").replace(/[.,]/g, "")) || 0;
  if (lower.includes("viaje") || lower.includes("trip") || lower.includes("puedo") || lower.includes("afford")) {
    const amount = trip || Math.round(d.savings * 2);
    const months = d.savings > 0 ? amount / d.savings : 0;
    return t(
      `Un gasto de ${fmt(amount)} equivale a ${months.toFixed(1)} meses de tu ahorro (${fmt(d.savings)}/mes) y a ${d.expenses > 0 ? (amount / d.expenses).toFixed(1) : "0"} meses de gastos. Con ${fmt(free)} de flujo libre mensual, puedes financiarlo sin tocar inversiones si lo repartes en ${Math.max(1, Math.ceil(months))} meses.`,
      `Spending ${fmt(amount)} equals ${months.toFixed(1)} months of your savings (${fmt(d.savings)}/month) and ${d.expenses > 0 ? (amount / d.expenses).toFixed(1) : "0"} months of expenses. With ${fmt(free)} in monthly free cash flow, you can fund it without touching investments if you spread it over ${Math.max(1, Math.ceil(months))} months.`,
    );
  }
  if (lower.includes("gast") || lower.includes("spend") || lower.includes("más") || lower.includes("most")) {
    const top = [...d.cashFlow.buckets].sort((a, b) => b.amount - a.amount)[0];
    return t(
      `Gastas ${fmt(d.expenses)} al mes. El bloque más pesado es ${top?.name ?? "Gastos fijos"} con ${fmt(top?.amount ?? 0)}. Bajarlo un 10% te daría ${fmt(Math.round((top?.amount ?? 0) * 0.1))} extra de ahorro cada mes.`,
      `You spend ${fmt(d.expenses)} per month. The heaviest block is ${top?.name ?? "Fixed costs"} at ${fmt(top?.amount ?? 0)}. Cutting it 10% would free up ${fmt(Math.round((top?.amount ?? 0) * 0.1))} of extra savings each month.`,
    );
  }
  return t(
    `Con tus datos: ingresos ${fmt(d.income)}, gastos ${fmt(d.expenses)}, ahorro ${fmt(d.savings)} (${d.savingsRate.toFixed(0)}%) y patrimonio ${fmt(d.netWorth)}. Pregúntame por ahorro, patrimonio, fondo de emergencia o si puedes permitirte una compra.`,
    `From your data: income ${fmt(d.income)}, expenses ${fmt(d.expenses)}, savings ${fmt(d.savings)} (${d.savingsRate.toFixed(0)}%) and net worth ${fmt(d.netWorth)}. Ask me about savings, net worth, emergency fund, or whether you can afford a purchase.`,
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
