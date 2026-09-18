import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { AlertTriangle, Camera, Loader2, Mic, PencilLine, Square } from "lucide-react";
import { toast } from "sonner";

import { BudgetDialog } from "@/components/budget-dialog";
import { ManualExpenseDialog } from "@/components/manual-expense-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useFixedExpenses } from "@/hooks/use-fixed-expenses";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { BUDGET_CATEGORIES, findBudgetCategory } from "@/lib/budget-categories";
import { BASE_CATEGORIES, categorizeTx } from "@/lib/categorize";
import { captureExpense } from "@/lib/expense-capture.functions";
import { translateCategory } from "@/lib/i18n-data";
import { saveExpense } from "@/lib/manual-expense";
import { SPEND_PLAN_FIELDS, money } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type Draft = { merchant: string; amount: number; date: string; category: string };

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });

/** Registro de gastos: captura rápida (manual, voz, recibo) y control contra tu plan. */
export function ExpenseLog() {
  const t = useT();
  const { lang } = useLanguage();
  const locale = lang === "es" ? es : enUS;
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const { transactions } = useTransactions();
  const fixed = useFixedExpenses();
  const budgets = useSpendBudgets();
  const categories = useCategories();

  const currency = profile.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysLeft = Math.max(1, monthEnd.getDate() - now.getDate() + 1);

  const categoryNames = useMemo(
    () => [...new Set([...BASE_CATEGORIES, ...categories.rules.map((r) => r.name)])],
    [categories.rules],
  );

  const monthTx = useMemo(
    () =>
      transactions
        .filter((x) => x.amount < 0 && x.tx_date)
        .filter((x) => {
          const d = parseISO(x.tx_date!);
          return d >= monthStart && d <= monthEnd;
        })
        .sort((a, b) => (a.tx_date! < b.tx_date! ? 1 : -1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, monthStart.getTime(), monthEnd.getTime()],
  );

  const variableSpend = monthTx.reduce((s, x) => s + Math.abs(x.amount), 0);
  const spent = variableSpend + fixed.total;
  const plan = budgets.hasBudget
    ? budgets.total
    : SPEND_PLAN_FIELDS.reduce((s, f) => s + (Number(profile[f.key]) || 0), 0);
  const pct = plan > 0 ? (spent / plan) * 100 : 0;
  const remaining = plan - spent;
  const perDay = remaining > 0 ? remaining / daysLeft : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of monthTx) {
      const k = categorizeTx(x as Tx, categories.rules);
      map.set(k, (map.get(k) ?? 0) + Math.abs(x.amount));
    }
    return map;
  }, [monthTx, categories.rules]);

  /** Plan del onboarding: las categorías y montos que la persona declaró al registrarse. */
  const onboardingLines = useMemo(
    () =>
      SPEND_PLAN_FIELDS.filter((f) => (Number(profile[f.key]) || 0) > 0).map((f) => ({
        id: f.budgetId,
        amount: Number(profile[f.key]) || 0,
      })),
    [profile],
  );

  // Si la cuenta todavía no tiene plan guardado, se copia el del onboarding
  // para que Registro de gastos y Análisis de gastos muestren el mismo objetivo.
  useEffect(() => {
    if (!budgets.loaded || budgets.hasBudget || onboardingLines.length === 0) return;
    budgets.save(onboardingLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets.loaded, budgets.hasBudget, onboardingLines]);

  const planLines = budgets.hasBudget ? budgets.lines : onboardingLines;

  const customLines = useMemo(
    () =>
      planLines
        .filter((l) => l.id.startsWith("custom:"))
        .map((l) => ({
          id: l.id,
          aliases: [l.label ?? l.id.slice(7), ...(l.keywords ?? [])]
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k.length > 2),
        }))
        .filter((l) => l.aliases.length > 0),
    [planLines],
  );

  const rows = useMemo(() => {
    const match = (name: string) => {
      const n = name.trim().toLowerCase();
      const custom = customLines.find((c) => c.aliases.some((a) => n === a || n.includes(a) || a.includes(n)));
      if (custom) return custom.id;
      return BUDGET_CATEGORIES.find((c) => c.aliases.some((a) => n === a || n.includes(a)))?.id ?? null;
    };
    const actual = new Map<string, number>();
    for (const [name, amount] of byCategory) {
      const id = match(name);
      if (id) actual.set(id, (actual.get(id) ?? 0) + amount);
    }
    for (const item of fixed.items) {
      const amount = Number(item.amount) || 0;
      if (amount <= 0) continue;
      const id = match(item.name);
      if (id) actual.set(id, (actual.get(id) ?? 0) + amount);
    }
    return planLines
      .filter((l) => l.amount > 0)
      .map((l) => {
        const cat = findBudgetCategory(l.id);
        const spentCat = actual.get(l.id) ?? 0;
        return {
          id: l.id,
          name: cat ? t(cat.es, cat.en) : (l.label ?? l.id),
          emoji: cat?.emoji ?? l.emoji ?? "📦",
          planned: l.amount,
          actual: spentCat,
          pct: l.amount > 0 ? (spentCat / l.amount) * 100 : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [planLines, byCategory, fixed.items, customLines, t]);

  const alerts = rows.filter((r) => r.pct >= 80).slice(0, 2);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<"voice" | "receipt" | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const openDraft = (parsed: { merchant: string; amount: number; date: string | null; category: string }) => {
    const valid = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date);
    setDraft({
      merchant: parsed.merchant || t("Gasto", "Expense"),
      amount: Math.abs(Number(parsed.amount) || 0),
      date: valid ? parsed.date! : format(now, "yyyy-MM-dd"),
      category: categoryNames.includes(parsed.category) ? parsed.category : "Otros",
    });
  };

  const send = async (kind: "voice" | "receipt", blob: Blob) => {
    setBusy(kind);
    try {
      const data = await blobToBase64(blob);
      const result = await captureExpense({
        data: {
          kind,
          data,
          mimeType: blob.type,
          categories: categoryNames,
          currency,
          today: format(now, "yyyy-MM-dd"),
        },
      });
      setTranscript(result.transcript ?? "");
      openDraft(result);
    } catch (error) {
      toast.error(
        t("No pudimos leer el gasto. Inténtalo de nuevo.", "We couldn't read the expense. Please try again."),
        { description: error instanceof Error ? error.message : undefined },
      );
    } finally {
      setBusy(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setRecording(false);
        if (blob.size < 2048) {
          toast.error(t("La nota quedó vacía. Vuelve a grabar.", "That recording was empty. Try again."));
          return;
        }
        void send("voice", blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error(t("Necesitamos permiso del micrófono.", "We need microphone access."));
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const onSaveDraft = async () => {
    if (!draft || !user?.id) return;
    if (draft.amount <= 0) {
      toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero"));
      return;
    }
    setSaving(true);
    try {
      await saveExpense({
        userId: user.id,
        date: draft.date,
        merchant: draft.merchant,
        category: draft.category,
        amount: draft.amount,
        currency,
        description: t("Registro rápido", "Quick log"),
      });
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      toast.success(t("Gasto guardado", "Expense saved"), {
        description: `${draft.merchant} · ${fmt(draft.amount)}`,
      });
      setDraft(null);
      setTranscript("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const ringPct = Math.min(100, Math.max(0, pct));
  const circumference = 2 * Math.PI * 52;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("Registro de gastos", "Expense log")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("Anota cada gasto y mantente dentro de tu plan.", "Log every expense and stay within your plan.")}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {format(now, "LLLL yyyy", { locale })}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">{t("Agrega un gasto", "Add an expense")}</p>
            <div className="grid grid-cols-3 gap-2">
              <ManualExpenseDialog
                categories={categoryNames}
                onAddCategory={(name) => categories.add(name)}
                trigger={
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-2 py-4 text-xs font-medium transition hover:bg-emerald-500/10"
                  >
                    <PencilLine className="h-5 w-5 text-emerald-400" />
                    {t("Manual", "Manual")}
                  </button>
                }
              />
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={busy === "voice"}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 px-2 py-4 text-xs font-medium transition hover:bg-white/5",
                  recording && "border-rose-500/60 bg-rose-500/10",
                )}
              >
                {busy === "voice" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                ) : recording ? (
                  <Square className="h-5 w-5 text-rose-400" />
                ) : (
                  <Mic className="h-5 w-5 text-emerald-400" />
                )}
                {recording ? t("Detener", "Stop") : t("Por voz", "By voice")}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy === "receipt"}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 px-2 py-4 text-xs font-medium transition hover:bg-white/5"
              >
                {busy === "receipt" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                ) : (
                  <Camera className="h-5 w-5 text-emerald-400" />
                )}
                {t("Foto de recibo", "Receipt photo")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void send("receipt", file);
                }}
              />
            </div>
            {recording && (
              <p className="mt-3 text-xs text-rose-300">
                {t(
                  "Grabando: di por ejemplo «45 euros en el super de hoy».",
                  "Recording: say e.g. \u201c45 euros at the supermarket today\u201d.",
                )}
              </p>
            )}
          </div>

          {alerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                a.pct >= 100
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200",
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {a.pct >= 100
                  ? t(
                      `Te pasaste del plan en ${a.name}: ${Math.round(a.pct)}% de ${fmt(a.planned)}.`,
                      `You went over plan in ${a.name}: ${Math.round(a.pct)}% of ${fmt(a.planned)}.`,
                    )
                  : t(
                      `Vas por el ${Math.round(a.pct)}% de tu plan en ${a.name}.`,
                      `You're at ${Math.round(a.pct)}% of your plan in ${a.name}.`,
                    )}
              </span>
            </div>
          ))}

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">{t("Gastos vs plan", "Spending vs plan")}</p>
            {plan > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">{fmt(spent)}</p>
                    <p className="text-sm text-muted-foreground">{t("de", "of")} {fmt(plan)}</p>
                  </div>
                  <div className="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r="52" className="stroke-white/10" strokeWidth="12" fill="none" />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        className={pct > 100 ? "stroke-rose-400" : "stroke-emerald-400"}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - ringPct / 100)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-semibold">{Math.round(pct)}%</span>
                      <span className="text-[11px] text-muted-foreground">{t("del plan", "of plan")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-3 text-center sm:text-left">
                  <div>
                    <p className={cn("text-base font-semibold", remaining >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {fmt(Math.abs(remaining))}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {remaining >= 0 ? t("Te quedan", "Left") : t("Excedido", "Over")}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-semibold">{daysLeft}</p>
                    <p className="text-[11px] text-muted-foreground">{t("días en el mes", "days left")}</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-emerald-400">{fmt(perDay)}/{t("día", "day")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("para mantener el plan", "to stay on plan")}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(
                  "Aún no tienes plan de gastos. Créalo abajo en Gasto objetivo mensual.",
                  "You don't have a spending plan yet. Create it below in Monthly spending goal.",
                )}
              </p>
            )}
          </div>

          {rows.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("Gastos por categoría", "Spending by category")}</p>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPlanOpen(true)}>
                  {t("Editar plan", "Edit plan")}
                </Button>
              </div>
              <div className="space-y-3">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-base">
                      {r.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {fmt(r.actual)} / {fmt(r.planned)}
                      </p>
                    </div>
                    <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-white/10 sm:block md:w-40">
                      <div
                        className={cn("h-full rounded-full", r.pct > 100 ? "bg-rose-400" : "bg-emerald-400")}
                        style={{ width: `${Math.min(100, r.pct)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-12 shrink-0 text-right text-sm font-semibold",
                        r.pct > 100 ? "text-rose-400" : "text-emerald-400",
                      )}
                    >
                      {Math.round(r.pct)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("Últimos gastos", "Latest expenses")}</p>
          {monthTx.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("Aún no registras gastos este mes.", "No expenses logged this month yet.")}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {monthTx.slice(0, 6).map((x) => (
                <li key={x.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{x.merchant}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {translateCategory(categorizeTx(x as Tx, categories.rules), lang)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {x.tx_date ? format(parseISO(x.tx_date), "d MMM", { locale }) : ""}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-rose-300">-{fmt(Math.abs(x.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Confirma el gasto", "Confirm the expense")}</DialogTitle>
            <DialogDescription>
              {transcript
                ? `"${transcript}"`
                : t("Revisa lo que leyó la IA y guárdalo.", "Check what the AI read and save it.")}
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>{t("Comercio", "Merchant")}</Label>
                <Input value={draft.merchant} onChange={(e) => setDraft({ ...draft, merchant: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>{`${t("Monto", "Amount")} (${currency})`}</Label>
                <NumberInput value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v || 0 })} min={0} format />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("Fecha", "Date")}</Label>
                <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("Categoría", "Category")}</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {translateCategory(name, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={onSaveDraft} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Guardar gasto", "Save expense")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
