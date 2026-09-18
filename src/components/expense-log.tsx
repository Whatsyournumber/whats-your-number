import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { Camera, ChevronRight, Loader2, Mic, Pencil, PencilLine, Plus, Repeat, Square, Wallet } from "lucide-react";
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
import { useFixedExpenses, useSpendTarget } from "@/hooks/use-fixed-expenses";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets, type BudgetLine } from "@/hooks/use-spend-budgets";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { BUDGET_CATEGORIES, findBudgetCategory } from "@/lib/budget-categories";
import { BASE_CATEGORIES, categorizeTx } from "@/lib/categorize";
import { captureExpense } from "@/lib/expense-capture.functions";
import { translateCategory } from "@/lib/i18n-data";
import { saveExpense } from "@/lib/manual-expense";
import { SPEND_PLAN_FIELDS, getWynMoneyLocale, money } from "@/lib/onboarding";
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

  const [planOpen, setPlanOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState(0);
  const [recDay, setRecDay] = useState(1);
  const { target: savedTarget, setTarget, hasTarget } = useSpendTarget();

  const onSaveRecurring = () => {
    const name = recName.trim();
    if (!name || recAmount <= 0) {
      toast.error(t("Escribe nombre y monto mayor que cero", "Enter a name and an amount above zero"));
      return;
    }
    fixed.add(name, Math.round(recAmount), recDay);
    toast.success(t("Gasto recurrente guardado", "Recurring expense saved"), {
      description: `${name} · ${fmt(recAmount)}/${t("mes", "mo")} · ${t("día", "day")} ${recDay}`,
    });
    setRecOpen(false);
    setRecName("");
    setRecAmount(0);
    setRecDay(1);
  };

  const currency = profile.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);
  const currencySymbol = useMemo(() => {
    try {
      return (
        new Intl.NumberFormat(getWynMoneyLocale(), { style: "currency", currency })
          .formatToParts(0)
          .find((p) => p.type === "currency")?.value ?? "$"
      );
    } catch {
      return "$";
    }
  }, [currency]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Periodo de la vista: hoy, última semana o mes completo. El objetivo y los
  // gastos fijos se prorratean para que la comparación siga siendo justa.
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const daysInMonth = monthEnd.getDate();
  const periodDays = period === "day" ? 1 : period === "week" ? 7 : daysInMonth;
  const periodFactor = periodDays / daysInMonth;
  const periodStart =
    period === "day" ? startOfDay(now) : period === "week" ? startOfDay(subDays(now, 6)) : monthStart;
  const elapsedDays = Math.min(periodDays, differenceInCalendarDays(now, periodStart) + 1);
  const daysLeft = Math.max(1, periodDays - elapsedDays + 1);

  const categoryNames = useMemo(
    () => [...new Set([...BASE_CATEGORIES, ...categories.rules.map((r) => r.name)])],
    [categories.rules],
  );

  const periodTx = useMemo(
    () =>
      transactions
        .filter((x) => x.amount < 0 && x.tx_date)
        .filter((x) => {
          const d = parseISO(x.tx_date!);
          return d >= periodStart && d <= monthEnd;
        })
        .sort((a, b) => (a.tx_date! < b.tx_date! ? 1 : -1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, periodStart.getTime(), monthEnd.getTime()],
  );

  const variableSpend = periodTx.reduce((s, x) => s + Math.abs(x.amount), 0);
  const spent = variableSpend + fixed.total * periodFactor;
  const onboardingTotal = SPEND_PLAN_FIELDS.reduce((s, f) => s + (Number(profile[f.key]) || 0), 0);
  const plan = budgets.hasBudget ? budgets.total : onboardingTotal;
  const target = hasTarget && savedTarget > 0 ? savedTarget : plan > 0 ? plan : onboardingTotal;
  const periodTarget = target * periodFactor;
  const pct = periodTarget > 0 ? (spent / periodTarget) * 100 : 0;
  const remaining = periodTarget - spent;
  const perDay = remaining > 0 ? remaining / daysLeft : 0;

  // Gasto real por día del mes actual (para el gráfico diario).
  const daily = useMemo(() => {
    const arr = Array.from({ length: daysInMonth }, () => 0);
    for (const x of transactions) {
      if (x.amount >= 0 || !x.tx_date) continue;
      const d = parseISO(x.tx_date);
      if (d >= monthStart && d <= monthEnd) {
        const idx = d.getDate() - 1;
        arr[idx] = (arr[idx] ?? 0) + Math.abs(x.amount);
      }
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, daysInMonth, monthStart.getTime(), monthEnd.getTime()]);

  const todayDay = now.getDate();
  const monthVariable = daily.reduce((s, v) => s + v, 0);

  // Próximos pagos recurrentes ordenados por la fecha en que caen.
  const upcoming = useMemo(() => {
    const base = startOfDay(now);
    return fixed.items
      .filter((i) => i.amount > 0)
      .map((i) => {
        const day = Math.min(Math.max(1, i.dayOfMonth ?? 1), daysInMonth);
        let next = new Date(now.getFullYear(), now.getMonth(), day);
        if (next < base) next = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(day, 28));
        return { ...i, next };
      })
      .sort((a, b) => a.next.getTime() - b.next.getTime())
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixed.items, daysInMonth]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of periodTx) {
      const k = categorizeTx(x as Tx, categories.rules);
      map.set(k, (map.get(k) ?? 0) + Math.abs(x.amount));
    }
    return map;
  }, [periodTx, categories.rules]);

  /** Plan del onboarding: las categorías y montos que la persona declaró al registrarse. */
  const onboardingLines = useMemo<BudgetLine[]>(
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

  // Se muestran siempre las categorías del onboarding; el plan guardado tiene prioridad en el importe.
  const planLines: BudgetLine[] = useMemo(() => {
    const merged = new Map<string, BudgetLine>();
    for (const l of onboardingLines) merged.set(l.id, l);
    for (const l of budgets.lines) {
      if (l.amount > 0) merged.set(l.id, l);
    }
    return [...merged.values()].filter((l) => l.amount > 0);
  }, [onboardingLines, budgets.lines]);

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
      const amount = (Number(item.amount) || 0) * periodFactor;
      if (amount <= 0) continue;
      const id = match(item.name);
      if (id) actual.set(id, (actual.get(id) ?? 0) + amount);
    }
    return planLines
      .filter((l) => l.amount > 0)
      .map((l) => {
        const cat = findBudgetCategory(l.id);
        const spentCat = actual.get(l.id) ?? 0;
        const planned = l.amount * periodFactor;
        return {
          id: l.id,
          name: cat ? t(cat.es, cat.en) : (l.label ?? l.id),
          emoji: cat?.emoji ?? l.emoji ?? "📦",
          planned,
          actual: spentCat,
          pct: planned > 0 ? (spentCat / planned) * 100 : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [planLines, byCategory, fixed.items, customLines, periodFactor, t]);

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

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("Registro de gastos", "Expense log")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Controla tus gastos del día a día y mantente dentro de tu plan.", "Track your daily expenses and stay within your plan.")}
          </p>
        </div>
        <ManualExpenseDialog
          categories={categoryNames}
          onAddCategory={(name) => categories.add(name)}
          trigger={
            <Button className="h-11 shrink-0 px-3 sm:px-5">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Añadir gasto", "Add expense")}</span>
            </Button>
          }
        />
      </div>

      <div className="flex w-full rounded-lg border border-border bg-card p-1 sm:w-80">
        {(
          [
            { id: "month", es: "Mes", en: "Month" },
            { id: "week", es: "Semana", en: "Week" },
            { id: "day", es: "Hoy", en: "Today" },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              period === p.id ? "bg-positive text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(p.es, p.en)}
          </button>
        ))}
      </div>


      <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/10">
                <Wallet className="h-4 w-4 text-positive" />
              </span>
              <p className="text-sm font-semibold">{t("Gastos vs plan", "Spending vs plan")}</p>
              {period === "month" && (
                <button
                  type="button"
                  onClick={() => setPlanOpen(true)}
                  aria-label={t("Editar el plan", "Edit plan")}
                  className="ml-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="numeric text-3xl font-bold leading-none tracking-tight sm:text-4xl">
                  {fmt(spent)}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <span className="whitespace-nowrap">
                    {t("de", "of")} <span className="numeric">{fmt(periodTarget)}</span>
                  </span>
                  <span className="numeric whitespace-nowrap">{currency.toUpperCase() === "USD" ? "US$" : currencySymbol}</span>
                  {period === "month" && (
                    <button
                      type="button"
                      onClick={() => setPlanOpen(true)}
                      aria-label={t("Editar el plan", "Edit plan")}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-border/30" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(pct, 100) / 100)}
                    className={pct > 100 ? "stroke-negative" : "stroke-positive"}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p
                    className={cn(
                      "numeric text-base font-bold leading-none sm:text-lg",
                      pct > 100 ? "text-negative" : "text-positive",
                    )}
                  >
                    {pct.toFixed(0)}%
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
                    {t("del plan", "of plan")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border/60 pt-2 sm:mt-2.5 sm:gap-4 sm:pt-2.5">
              <div className="min-w-0">
                <p
                  style={{ letterSpacing: "-0.01em" }}
                  className={cn(
                    "numeric truncate text-xl font-bold sm:text-[1.75rem]",
                    remaining < 0 ? "text-negative" : "text-positive",
                  )}
                >
                  {fmt(Math.abs(remaining))}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-[13px]">
                  {remaining < 0 ? t("De más", "Over") : t("Te quedan", "Left")}
                </p>
              </div>
              <div className="min-w-0">
                <p style={{ letterSpacing: "-0.01em" }} className="numeric truncate text-xl font-bold text-positive sm:text-[1.75rem]">{daysLeft}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-[13px]">
                  {t("días quedan", "days left")}
                </p>
              </div>
              <div className="min-w-0">
                <p style={{ letterSpacing: "-0.01em" }} className="numeric truncate text-xl font-bold text-positive sm:text-[1.75rem]">
                  {fmt(perDay)}/{t("día", "day")}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-[13px]">
                  {t("para el plan", "to stay on plan")}
                </p>
              </div>
            </div>
          </div>



          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">{t("Agrega un gasto", "Add an expense")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              <button
                type="button"
                onClick={() => setRecOpen(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 px-2 py-4 text-xs font-medium transition hover:bg-white/5"
              >
                <Repeat className="h-5 w-5 text-emerald-400" />
                {t("Recurrente", "Recurring")}
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
            <button
              key={a.id}
              type="button"
              onClick={() => setPlanOpen(true)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[0.8125rem] transition-colors",
                a.pct >= 100
                  ? "border-negative/25 bg-negative/5 text-negative/90 hover:bg-negative/10"
                  : "border-amber-500/25 bg-amber-500/5 text-amber-200/90 hover:bg-amber-500/10",
              )}
            >
              <span className="shrink-0 text-sm leading-none">{a.emoji}</span>
              <span className="min-w-0 flex-1 truncate">
                {a.pct >= 100
                  ? t(
                      `Te pasaste del plan en ${a.name}: ${Math.round(a.pct)}%`,
                      `You went over plan in ${a.name}: ${Math.round(a.pct)}%`,
                    )
                  : t(
                      `Llevas ${Math.round(a.pct)}% de tu presupuesto en ${a.name.toLowerCase()}`,
                      `You've used ${Math.round(a.pct)}% of your ${a.name.toLowerCase()} budget`,
                    )}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </button>
          ))}

          {(target > 0 || monthVariable > 0) && (
            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <h3 className="text-base font-semibold">
                  {t("Gasto diario vs. presupuesto esperado", "Daily spend vs. expected budget")}
                </h3>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {t("Gasto real", "Actual spend")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dotted border-muted-foreground" />
                    {t("Presupuesto esperado", "Expected budget")}
                  </span>
                </div>
                <div className="mt-4 min-w-0">
                    {(() => {
                      const W = 560;
                      const H = 190;
                      const left = 38;
                      const top = 16;
                      const plotW = W - left - 8;
                      const plotH = H - top - 22;
                      const maxDaily = Math.max(...daily, 0);
                      const yMax = Math.max(target, maxDaily, 1) * 1.1;
                      const step = plotW / daysInMonth;
                      const barW = step * 0.62;
                      const yOf = (v: number) => top + plotH - (v / yMax) * plotH;
                      const yTicks = [0, 0.5, 1].map((f) => yMax * f);
                      const xTicks = [...new Set([1, 5, 10, 15, 20, 25, daysInMonth])].filter((d) => d <= daysInMonth);
                      const expectedPts = Array.from({ length: daysInMonth }, (_, i) => {
                        const x = left + (i + 0.5) * step;
                        const y = yOf((target * (i + 1)) / daysInMonth);
                        return { x, y };
                      });
                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
                          {yTicks.map((v) => (
                            <g key={v}>
                              <line x1={left} x2={W - 8} y1={yOf(v)} y2={yOf(v)} className="stroke-border" strokeWidth="1" />
                              <text x={left - 6} y={yOf(v) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                                {v === 0 ? `${currencySymbol}0` : `${currencySymbol}${Math.round(v)}`}
                              </text>
                            </g>
                          ))}
                          {target > 0 && (
                            <>
                              <polyline
                                points={expectedPts.map((p) => `${p.x},${p.y}`).join(" ")}
                                fill="none"
                                className="stroke-muted-foreground"
                                strokeWidth="1.5"
                                strokeDasharray="1 5"
                                strokeLinecap="round"
                              />
                              {expectedPts.map((p, i) =>
                                (i + 1) % 5 === 0 || i === daysInMonth - 1 ? (
                                  <circle key={i} cx={p.x} cy={p.y} r="2" className="fill-muted-foreground" />
                                ) : null,
                              )}
                            </>
                          )}
                          {daily.map((v, i) => {
                            if (v <= 0) return null;
                            const x = left + (i + 0.19) * step;
                            const y = yOf(v);
                            const isToday = i + 1 === todayDay;
                            return (
                              <rect
                                key={i}
                                x={x}
                                y={y}
                                width={barW}
                                height={top + plotH - y}
                                rx="2"
                                className={isToday ? "fill-emerald-300" : i + 1 <= todayDay ? "fill-emerald-500/80" : "fill-muted-foreground/25"}
                              />
                            );
                          })}
                          <line
                            x1={left + (todayDay - 0.5) * step}
                            x2={left + (todayDay - 0.5) * step}
                            y1={top}
                            y2={top + plotH}
                            className="stroke-emerald-400"
                            strokeWidth="1.5"
                          />
                          <text
                            x={left + (todayDay - 0.5) * step}
                            y={top - 4}
                            textAnchor="middle"
                            className="fill-foreground text-[9px] font-medium"
                          >
                            {t("Hoy", "Today")}
                          </text>
                          {xTicks.map((d) => (
                            <text
                              key={d}
                              x={left + (d - 0.5) * step}
                              y={H - 6}
                              textAnchor="middle"
                              className="fill-muted-foreground text-[9px]"
                            >
                              {d}
                            </text>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{t("Próximos pagos", "Upcoming payments")}</h3>
                  <button
                    type="button"
                    onClick={() => setRecOpen(true)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={t("Añadir gasto recurrente", "Add recurring expense")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {upcoming.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("Añade gastos recurrentes para verlos aquí.", "Add recurring expenses to see them here.")}
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3.5">
                    {upcoming.map((i, idx) => {
                      const emoji = i.name.match(/^\p{Extended_Pictographic}+/u)?.[0];
                      const colors = [
                        "bg-emerald-500/15 text-emerald-300",
                        "bg-sky-500/15 text-sky-300",
                        "bg-violet-500/15 text-violet-300",
                        "bg-amber-500/15 text-amber-300",
                        "bg-rose-500/15 text-rose-300",
                      ];
                      return (
                        <li key={i.id} className="flex items-center gap-3">
                          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-base", colors[idx % colors.length])}>
                            {emoji ?? <Repeat className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm leading-5">{emoji ? i.name.slice(emoji.length).trim() : i.name}</p>
                            <p className="text-[0.6875rem] leading-4 text-muted-foreground">
                              {format(i.next, "d MMM", { locale })}
                            </p>
                          </div>
                          <span className="numeric shrink-0 text-sm font-semibold">{fmt(i.amount)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{t("Gastos por categoría", "Spending by category")}</h3>
                <button
                  type="button"
                  onClick={() => setPlanOpen(true)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t("Editar plan de gastos", "Edit spending plan")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="mt-4 space-y-3.5">
                {rows.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-base sm:h-10 sm:w-10",
                        r.actual > r.planned ? "bg-negative/20" : "bg-positive/15",
                      )}
                    >
                      {r.emoji}
                    </span>
                    <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
                      <div className="min-w-0 lg:w-44 lg:shrink-0">
                        <p className="truncate text-sm leading-5">{r.name}</p>
                        <p className="numeric text-[0.6875rem] leading-4 text-muted-foreground">
                          {fmt(r.actual)} / {fmt(r.planned)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted lg:mt-0 lg:min-w-0 lg:flex-1">
                        <div
                          className={cn("h-full rounded-full", r.actual > r.planned ? "bg-negative" : "bg-positive")}
                          style={{ width: `${Math.min(100, r.pct)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "numeric w-11 shrink-0 text-right text-sm sm:w-12",
                        r.actual > r.planned ? "text-negative" : "text-foreground",
                      )}
                    >
                      {Math.round(r.pct)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>

          )}


        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("Últimos gastos", "Latest expenses")}</p>
          {periodTx.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("Aún no registras gastos en este periodo.", "No expenses logged in this period yet.")}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {periodTx.slice(0, 6).map((x) => (
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

      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Gasto recurrente", "Recurring expense")}</DialogTitle>
            <DialogDescription>
              {t("Se repite cada mes y cuenta en tu plan.", "It repeats every month and counts toward your plan.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>{t("Nombre", "Name")}</Label>
              <Input
                value={recName}
                onChange={(e) => setRecName(e.target.value)}
                placeholder={t("Netflix, gimnasio, alquiler", "Netflix, gym, rent")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{`${t("Monto mensual", "Monthly amount")} (${currency})`}</Label>
              <NumberInput value={recAmount} onChange={(v) => setRecAmount(v || 0)} min={0} format />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("Día del mes en que se cobra", "Day of the month it's charged")}</Label>
              <Select value={String(recDay)} onValueChange={(v) => setRecDay(Number(v) || 1)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onSaveRecurring}>{t("Guardar", "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BudgetDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        lines={planLines}
        onSave={(next) => {
          budgets.save(next);
          const totalPlan = next.reduce((s, l) => s + (l.amount || 0), 0);
          if (totalPlan > 0) setTarget(Math.round(totalPlan));
        }}
        fmt={fmt}
      />
    </section>
  );
}
