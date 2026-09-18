import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ArrowDown, ArrowUp, CalendarDays, Camera, ChevronRight, Loader2, Mic, Pencil, PencilLine, Plus, Repeat, Square, TrendingUp, Wallet, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { supabase } from "@/integrations/supabase/client";
import { SPEND_PLAN_FIELDS, getWynMoneyLocale, money } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type Draft = { merchant: string; amount: number; date: string; category: string };

const ALERTS_KEY = "whatsyournumber:expense-alerts";

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
  const [manualOpen, setManualOpen] = useState(false);
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState(0);
  const [recDay, setRecDay] = useState(1);
  const [recEditId, setRecEditId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Tx | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const { target: savedTarget, setTarget, hasTarget } = useSpendTarget();

  const openNewRecurring = () => {
    setRecEditId(null);
    setRecName("");
    setRecAmount(0);
    setRecDay(1);
    setRecOpen(true);
  };

  const openEditRecurring = (item: { id: string; name: string; amount: number; dayOfMonth?: number }) => {
    setRecEditId(item.id);
    setRecName(item.name);
    setRecAmount(item.amount);
    setRecDay(item.dayOfMonth ?? 1);
    setRecOpen(true);
  };

  const onSaveRecurring = () => {
    const name = recName.trim();
    if (!name || recAmount <= 0) {
      toast.error(t("Escribe nombre y monto mayor que cero", "Enter a name and an amount above zero"));
      return;
    }
    if (recEditId) {
      fixed.update(recEditId, { name, amount: Math.round(recAmount), dayOfMonth: recDay });
      toast.success(t("Gasto recurrente actualizado", "Recurring expense updated"));
    } else {
      fixed.add(name, Math.round(recAmount), recDay);
      toast.success(t("Gasto recurrente guardado", "Recurring expense saved"), {
        description: `${name} · ${fmt(recAmount)}/${t("mes", "mo")} · ${t("día", "day")} ${recDay}`,
      });
    }
    setRecOpen(false);
    setRecEditId(null);
    setRecName("");
    setRecAmount(0);
    setRecDay(1);
  };

  const onDeleteRecurring = () => {
    if (!recEditId) return;
    fixed.remove(recEditId);
    toast.success(t("Gasto recurrente eliminado", "Recurring expense deleted"));
    setRecOpen(false);
    setRecEditId(null);
  };

  const openEditTx = (x: Tx) => {
    setEditTx(x);
    setEditMerchant(x.merchant ?? "");
    setEditAmount(Math.abs(x.amount));
    setEditDate(x.tx_date ?? format(new Date(), "yyyy-MM-dd"));
    setEditCategory(categorizeTx(x, categories.rules));
  };

  const onSaveEditTx = async () => {
    if (!editTx) return;
    if (!editAmount || editAmount <= 0) {
      toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("imported_transactions")
        .update({
          merchant: editMerchant.trim() || translateCategory(editCategory, lang),
          amount: -Math.abs(editAmount),
          tx_date: editDate,
          category: editCategory,
        })
        .eq("id", editTx.id);
      if (error) throw new Error(error.message);
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      toast.success(t("Gasto actualizado", "Expense updated"));
      setEditTx(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEditTx = async () => {
    if (!editTx) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("imported_transactions").delete().eq("id", editTx.id);
      if (error) throw new Error(error.message);
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      toast.success(t("Gasto eliminado", "Expense deleted"));
      setEditTx(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
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
  // Día de la columna del gráfico diario que el usuario está mirando (hover o toque).
  const [hoverDay, setHoverDay] = useState<number | null>(null);

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
  const expectedPacePct = periodDays > 0 ? (elapsedDays / periodDays) * 100 : 0;
  const paceDifference = Math.abs(pct - expectedPacePct);
  const isOnPace = pct <= expectedPacePct;
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

  /**
   * Al editar el objetivo mensual se reparte el nuevo total entre las categorías
   * del plan de forma proporcional, para que el popup muestre el mismo importe.
   */
  const applyTarget = (value: number) => {
    const safeTotal = Math.max(0, Math.round(value || 0));
    setTarget(safeTotal);
    const base = planLines;
    if (!base.length) return;
    const currentTotal = base.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);
    if (currentTotal <= 0) {
      budgets.save(base.map((l, i) => ({ ...l, amount: i === 0 ? safeTotal : 0 })));
      return;
    }
    let assigned = 0;
    const next = base.map((line, index) => {
      const amount =
        index === base.length - 1
          ? Math.max(0, safeTotal - assigned)
          : Math.round((Math.max(0, line.amount) / currentTotal) * safeTotal);
      assigned += amount;
      return { ...line, amount };
    });
    budgets.save(next);
  };


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

  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${ALERTS_KEY}:${user?.id ?? "anon"}`);
      setDismissed(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDismissed([]);
    }
  }, [user?.id]);

  const dismissAlert = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(`${ALERTS_KEY}:${user?.id ?? "anon"}`, JSON.stringify(next));
    } catch {
      /* storage unavailable: the alert just comes back on next visit */
    }
  };

  const alerts = rows.filter((r) => r.pct >= 80 && !dismissed.includes(r.id)).slice(0, 2);

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("Registro de gastos", "Expense Tracker")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:hidden">
            {t("Controla tus gastos del día a día", "Track your daily expenses")}
          </p>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            {t("Controla tus gastos del día a día y mantente dentro de tu plan.", "Track your daily expenses and stay within your plan.")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("Añadir gasto", "Add expense")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-positive text-background sm:hidden"
            >
              <Plus className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => setManualOpen(true)}>
              <PencilLine className="mr-2 h-4 w-4 text-positive" />
              {t("Manual", "Manual")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => (recording ? stopRecording() : startRecording())}>
              {recording ? <Square className="mr-2 h-4 w-4 text-negative" /> : <Mic className="mr-2 h-4 w-4 text-positive" />}
              {recording ? t("Detener", "Stop") : t("Por voz", "By voice")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4 text-positive" />
              {t("Foto de recibo", "Receipt photo")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openNewRecurring}>
              <Repeat className="mr-2 h-4 w-4 text-positive" />
              {t("Recurrente", "Recurring")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hidden h-11 shrink-0 px-5 sm:flex sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t("Añadir gasto", "Add expense")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => setManualOpen(true)}>
              <PencilLine className="mr-2 h-4 w-4 text-positive" />
              {t("Manual", "Manual")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => (recording ? stopRecording() : startRecording())}>
              {recording ? <Square className="mr-2 h-4 w-4 text-negative" /> : <Mic className="mr-2 h-4 w-4 text-positive" />}
              {recording ? t("Detener", "Stop") : t("Por voz", "By voice")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4 text-positive" />
              {t("Foto de recibo", "Receipt photo")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openNewRecurring}>
              <Repeat className="mr-2 h-4 w-4 text-positive" />
              {t("Recurrente", "Recurring")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ManualExpenseDialog
        categories={categoryNames}
        onAddCategory={(name) => categories.add(name)}
        open={manualOpen}
        onOpenChange={setManualOpen}
      />



      <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-positive/10 sm:h-11 sm:w-11">
                <Wallet className="h-4 w-4 text-positive sm:h-5 sm:w-5" />
              </span>
              <h3 className="min-w-0 whitespace-nowrap text-lg font-semibold sm:text-xl lg:text-2xl">
                {t("Gasto objetivo mensual", "Monthly spending target")}
              </h3>
              {period === "month" && (
                <button type="button" onClick={() => setPlanOpen(true)} aria-label={t("Editar el plan", "Edit plan")} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 md:hidden">
              <div className="min-w-0">
                <p className="numeric whitespace-nowrap text-4xl font-bold">{fmt(spent)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("de", "of")} {fmt(periodTarget)}
                </p>
              </div>
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="9" className="stroke-border/30" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(pct, 100) / 100)}
                    className={pct > 100 ? "stroke-negative" : "stroke-positive"}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={cn("numeric text-2xl font-bold leading-none", pct > 100 ? "text-negative" : "text-positive")}>
                    {pct.toFixed(0)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("del plan", "of plan")}</p>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 md:hidden",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  isOnPace ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative",
                )}
              >
                {isOnPace ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold", isOnPace ? "text-positive" : "text-negative")}>
                  {isOnPace ? t("Vas bien", "On track") : t("Vas por encima", "Above pace")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {isOnPace
                    ? t(
                        `Estás ${Math.round(paceDifference)}% por debajo del ritmo esperado`,
                        `You're ${Math.round(paceDifference)}% below the expected pace`,
                      )
                    : t(
                        `Estás ${Math.round(paceDifference)}% por encima del ritmo esperado`,
                        `You're ${Math.round(paceDifference)}% above the expected pace`,
                      )}
                </p>
              </div>
            </div>

             <div className="mt-3 hidden items-center gap-6 lg:flex">
               <div className="min-w-0 shrink-0">
                 <p className="text-sm text-muted-foreground">{t("Limita tus gastos mensuales", "Set a limit for your monthly spending")}</p>
                 <div className="mt-2 inline-flex min-w-0 items-baseline gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-1.5 transition-colors focus-within:border-positive/60">
                   <span className="numeric text-xl font-semibold text-muted-foreground">{currencySymbol}</span>
                   <NumberInput
                     value={target}
                     onChange={(v) => applyTarget(v)}
                     min={0}
                     format
                     ariaLabel={t("Gasto objetivo mensual", "Monthly spending target")}
                     placeholder="0"
                     className="numeric h-auto w-32 border-0 bg-transparent px-0 py-0 text-3xl font-bold shadow-none transition-none placeholder:text-foreground focus-visible:ring-0 md:text-3xl"
                   />
                 </div>
               </div>

               <div className="min-w-0 shrink-0 border-l border-border/60 pl-6">
                 <p className="text-sm text-muted-foreground">{t("Gasto del período", "Period spending")}</p>
                 <p className="numeric mt-1.5 whitespace-nowrap text-3xl font-bold">{fmt(spent)}</p>
               </div>

               <div className="relative ml-auto h-36 w-36 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="9" className="stroke-border/30" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(pct, 100) / 100)}
                    className={pct > 100 ? "stroke-negative" : "stroke-positive"}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={cn("numeric text-3xl font-bold leading-none", pct > 100 ? "text-negative" : "text-positive")}>
                    {pct.toFixed(0)}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("del plan", "of plan")}</p>
                </div>
              </div>

              <div
                className={cn(
                   "flex w-[252px] flex-none items-center gap-3 self-center rounded-xl border p-3.5 text-left",
                   isOnPace ? "border-positive/30 bg-positive/10" : "border-negative/30 bg-negative/10",
                 )}
               >
                 <span
                   className={cn(
                     "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                     isOnPace ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative",
                   )}
                 >
                   {isOnPace ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                 </span>
                 <div className="min-w-0">
                   <p className={cn("text-sm font-semibold", isOnPace ? "text-positive" : "text-negative")}>
                     {isOnPace ? t("Vas bien", "On track") : t("Vas por encima", "Above pace")}
                   </p>
                   <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {isOnPace
                      ? t(
                          `Estás ${Math.round(paceDifference)}% por debajo del ritmo esperado`,
                          `You're ${Math.round(paceDifference)}% below the expected pace`,
                        )
                      : t(
                          `Estás ${Math.round(paceDifference)}% por encima del ritmo esperado`,
                          `You're ${Math.round(paceDifference)}% above the expected pace`,
                        )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 hidden gap-8 sm:mt-5 md:grid md:grid-cols-2 lg:hidden">
              <div className="grid min-w-0 grid-rows-[auto_1fr] justify-items-center gap-5 text-center">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t("Limita tus gastos mensuales", "Set a limit for your monthly spending")}</p>
                  <div className="mt-2 inline-flex min-w-0 items-baseline gap-1 rounded-xl border border-border bg-muted/20 px-3 py-1.5 transition-colors focus-within:border-positive/60">
                    <span className="numeric text-xl font-semibold text-muted-foreground sm:text-2xl">{currencySymbol}</span>
                    <NumberInput
                      value={target}
                      onChange={(v) => applyTarget(v)}
                      min={0}
                      format
                      ariaLabel={t("Gasto objetivo mensual", "Monthly spending target")}
                      className="numeric h-auto w-28 border-0 bg-transparent px-0 py-0 text-3xl font-bold shadow-none transition-none focus-visible:ring-0 sm:w-32 sm:text-4xl md:text-4xl lg:text-5xl"
                    />
                  </div>
                </div>
                <div className="relative h-32 w-32 shrink-0 self-center">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" strokeWidth="9" className="stroke-border/30" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(pct, 100) / 100)}
                      className={pct > 100 ? "stroke-negative" : "stroke-positive"}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className={cn("numeric text-2xl font-bold leading-none sm:text-3xl lg:text-4xl", pct > 100 ? "text-negative" : "text-positive")}>
                      {pct.toFixed(0)}%
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("del plan", "of plan")}</p>
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 grid-rows-[auto_1fr] justify-items-center gap-5 text-center md:border-l md:border-border/60 md:pl-8">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t("Gasto del período", "Period spending")}</p>
                  <p className="numeric mt-1.5 whitespace-nowrap text-3xl font-bold sm:text-4xl">{fmt(spent)}</p>
                </div>
                <div className="flex w-full min-w-0 items-center gap-3 self-center rounded-xl border border-border bg-muted/20 p-3 text-left sm:p-4">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      isOnPace ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative",
                    )}
                  >
                    {isOnPace ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", isOnPace ? "text-positive" : "text-negative")}>
                      {isOnPace ? t("Vas bien", "On track") : t("Vas por encima", "Above pace")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {isOnPace
                        ? t(
                            `Estás ${Math.round(paceDifference)}% por debajo del ritmo esperado`,
                            `You're ${Math.round(paceDifference)}% below the expected pace`,
                          )
                        : t(
                            `Estás ${Math.round(paceDifference)}% por encima del ritmo esperado`,
                            `You're ${Math.round(paceDifference)}% above the expected pace`,
                          )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 sm:gap-0">
              <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2.5 sm:px-2">
                <span className={cn("hidden h-8 w-8 shrink-0 place-items-center rounded-full sm:grid", remaining < 0 ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive")}>
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className={cn("numeric text-base font-bold leading-tight sm:text-xl", remaining < 0 ? "text-negative" : "text-positive")}>{fmt(Math.abs(remaining))}</p>
                  <p className="text-xs text-muted-foreground">{remaining < 0 ? t("De más", "Over") : t("Te quedan", "Left")}</p>
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1 border-l border-border/60 pl-3 sm:flex-row sm:items-center sm:gap-2.5 sm:border-border sm:px-4">
                <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/10 text-positive sm:grid"><CalendarDays className="h-4 w-4" /></span>
                <div>
                  <p className="numeric text-base font-bold leading-tight text-positive sm:text-xl">{daysLeft}</p>
                  <p className="text-xs text-muted-foreground">{t("días quedan", "days left")}</p>
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1 border-l border-border/60 pl-3 sm:flex-row sm:items-center sm:gap-2.5 sm:border-border sm:px-4">
                <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/10 text-positive sm:grid"><TrendingUp className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="numeric whitespace-nowrap text-base font-bold leading-tight text-positive sm:text-xl">{fmt(perDay)}/{t("día", "day")}</p>
                  <p className="text-xs text-muted-foreground">{t("para el plan", "to stay on plan")}</p>
                </div>
              </div>
            </div>
          </div>



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
          {recording && (
            <button
              type="button"
              onClick={stopRecording}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/60 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300"
            >
              <Square className="h-3.5 w-3.5" />
              {t(
                "Grabando: di por ejemplo «45 euros en el super de hoy». Toca para detener.",
                "Recording: say e.g. \u201c45 euros at the supermarket today\u201d. Tap to stop.",
              )}
            </button>
          )}
          {alerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex w-full items-center gap-1 rounded-xl border px-3.5 py-2 transition-colors",
                a.pct >= 100
                  ? "border-negative/25 bg-negative/5 hover:bg-negative/10"
                  : "border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10",
              )}
            >
              <button
                type="button"
                onClick={() => setPlanOpen(true)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2.5 text-left text-[0.8125rem]",
                  a.pct >= 100 ? "text-negative/90" : "text-amber-200/90",
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
              <button
                type="button"
                onClick={() => dismissAlert(a.id)}
                aria-label={t("Cerrar aviso", "Dismiss alert")}
                className={cn(
                  "shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100",
                  a.pct >= 100 ? "text-negative" : "text-amber-200",
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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
                  <span className="ml-auto hidden text-[11px] text-muted-foreground/70 sm:block">
                    {t("Pasa el cursor", "Hover a day")}
                  </span>

                </div>

                <div className="relative mt-4 min-w-0">
                    {(() => {
                      const W = 560;
                      const H = 272;
                      const left = 64;
                      const top = 22;
                      const plotW = W - left - 8;
                      const plotH = H - top - 30;
                      const maxDaily = Math.max(...daily, 0);
                      // Ritmo lineal: el plan del mes repartido igual entre todos los días.
                      const linearDay = daysInMonth > 0 ? target / daysInMonth : 0;
                      // Techo "bonito" justo por encima del mayor gasto diario: las barras llenan el gráfico.
                      const niceMax = (v: number) => {
                        const mag = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
                        const n = v / mag;
                        const nice = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((c) => n <= c) ?? 10;
                        return nice * mag;
                      };
                      const yMax = niceMax(Math.max(maxDaily, linearDay, 1) * 1.08);
                      const step = plotW / daysInMonth;
                      const barW = step * 0.66;
                      const yOf = (v: number) => top + plotH - (v / yMax) * plotH;
                      const yTicks = [0, 0.5, 1].map((f) => yMax * f);
                      const axis = (v: number) =>
                        v === 0
                          ? `${currencySymbol}0`
                          : v >= 1000
                            ? `${currencySymbol}${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`
                            : `${currencySymbol}${Math.round(v)}`;
                      const xTicks = [...new Set([1, 5, 10, 15, 20, 25, daysInMonth])].filter((d) => d <= daysInMonth);
                      const active = hoverDay !== null && hoverDay >= 0 && hoverDay < daysInMonth ? hoverDay : null;
                      const activeReal = active === null ? 0 : daily[active] ?? 0;
                      const activeDiff = activeReal - linearDay;
                      const tipLeft = active === null ? 50 : ((left + (active + 0.5) * step) / W) * 100;
                      // Borde superior de la barra activa: el tooltip se pega justo arriba de ella.
                      const activeBarTop = active === null ? 0 : yOf(Math.max(daily[active] ?? 0, 0));
                      // Si la barra llega muy arriba, el tooltip entra debajo del borde para no salirse.
                      const tipBelow = activeBarTop < top + H * 0.2;
                      return (
                        <>
                        <svg
                          viewBox={`0 0 ${W} ${H}`}
                          className="w-full"
                          role="img"
                          onMouseLeave={() => setHoverDay(null)}
                        >
                          {yTicks.map((v) => (
                            <g key={v}>
                              <line x1={left} x2={W - 8} y1={yOf(v)} y2={yOf(v)} className="stroke-border" strokeWidth="1" />
                              <text x={left - 7} y={yOf(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                                {axis(v)}
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
                          {active !== null && (
                            <rect
                              x={left + active * step}
                              y={top}
                              width={step}
                              height={plotH}
                              className="fill-foreground/5"
                            />
                          )}
                          {daily.map((v, i) => {
                            if (v <= 0) return null;
                            const x = left + (i + 0.19) * step;
                            // Altura mínima para que gastos pequeños también se vean.
                            const y = Math.min(yOf(v), top + plotH - 4);
                            const isToday = i + 1 === todayDay;
                            const isActive = i === active;
                            return (
                              <rect
                                key={i}
                                x={x}
                                y={y}
                                width={barW}
                                height={top + plotH - y}
                                rx="2"
                                className={cn(
                                  isActive
                                    ? "fill-emerald-300"
                                    : isToday
                                      ? "fill-emerald-300"
                                      : i + 1 <= todayDay
                                        ? "fill-emerald-500/80"
                                        : "fill-muted-foreground/25",
                                )}
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
                            y={top - 6}
                            textAnchor="middle"
                            className="fill-foreground text-[11px] font-medium"
                          >
                            {t("Hoy", "Today")}
                          </text>
                          {xTicks.map((d) => (
                            <text
                              key={d}
                              x={left + (d - 0.5) * step}
                              y={H - 8}
                              textAnchor="middle"
                              className="fill-muted-foreground text-[11px]"
                            >
                              {d}
                            </text>
                          ))}
                          {/* Columnas sensibles: todo el alto del día, también si no hubo gasto. */}
                          {Array.from({ length: daysInMonth }, (_, i) => (
                            <rect
                              key={`hit-${i}`}
                              x={left + i * step}
                              y={top}
                              width={step}
                              height={plotH}
                              fill="transparent"
                              onMouseEnter={() => setHoverDay(i)}
                              onTouchStart={() => setHoverDay(i)}
                            />
                          ))}
                        </svg>
                        {active !== null && (
                          <div
                            className="pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-border bg-card/95 px-3 py-1.5 text-[12px] shadow-lg backdrop-blur-sm"
                            style={{
                              left: `${Math.min(84, Math.max(18, tipLeft))}%`,
                              top: `${(Math.max(top, activeBarTop) / H) * 100}%`,
                              transform: tipBelow
                                ? "translate(-50%, 10px)"
                                : "translate(-50%, calc(-100% - 8px))",
                            }}
                          >
                            <span className="numeric font-medium text-muted-foreground">
                              {format(new Date(now.getFullYear(), now.getMonth(), active + 1), "d MMM", { locale })}
                            </span>
                            <span
                              className={cn(
                                "numeric ml-2 font-semibold",
                                activeDiff > 0 ? "text-negative" : "text-positive",
                              )}
                            >
                              {fmt(activeReal)}
                            </span>
                            <span className="numeric ml-2 text-muted-foreground">
                              {t("de", "of")} {fmt(linearDay)}
                            </span>
                          </div>
                        )}

                        </>
                      );
                    })()}
                  </div>

              </div>

              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{t("Próximos pagos", "Upcoming payments")}</h3>
                  <button
                    type="button"
                    onClick={openNewRecurring}
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
                          <button
                            type="button"
                            onClick={() => openEditRecurring(i)}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={t("Editar gasto recurrente", "Edit recurring expense")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
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
                  <button
                    type="button"
                    onClick={() => openEditTx(x as Tx)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={t("Editar gasto", "Edit expense")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
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
            <DialogTitle>
              {recEditId ? t("Editar gasto recurrente", "Edit recurring expense") : t("Gasto recurrente", "Recurring expense")}
            </DialogTitle>
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
          <DialogFooter className="gap-2 sm:justify-between">
            {recEditId ? (
              <Button type="button" variant="ghost" className="text-negative" onClick={onDeleteRecurring}>
                {t("Eliminar", "Delete")}
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={onSaveRecurring}>{t("Guardar", "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editTx)} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Editar gasto", "Edit expense")}</DialogTitle>
            <DialogDescription>
              {t("Corrige el comercio, el monto, la fecha o la categoría.", "Fix the merchant, amount, date or category.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>{t("Comercio", "Merchant")}</Label>
              <Input value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{`${t("Monto", "Amount")} (${currency})`}</Label>
              <NumberInput value={editAmount} onChange={(v) => setEditAmount(v || 0)} min={0} format />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("Fecha", "Date")}</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("Categoría", "Category")}</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
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
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" className="text-negative" onClick={onDeleteEditTx} disabled={saving}>
              {t("Eliminar", "Delete")}
            </Button>
            <Button onClick={onSaveEditTx} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Guardar", "Save")}
            </Button>
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
