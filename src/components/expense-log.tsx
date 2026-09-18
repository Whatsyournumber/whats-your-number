import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { AlertTriangle, Camera, ChevronDown, Loader2, Mic, Pencil, PencilLine, Plus, Square } from "lucide-react";
import { toast } from "sonner";

import targetIcon from "@/assets/target-icon-v2.png.asset.json";
import { BudgetDialog } from "@/components/budget-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  const [planOpen, setPlanOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(true);
  const { target: savedTarget, setTarget, hasTarget } = useSpendTarget();

  const currency = profile.currency || "EUR";
  const fmt = (n: number) => money(Math.round(n), currency);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthLabel = format(now, "LLLL", { locale });
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
  const onboardingTotal = SPEND_PLAN_FIELDS.reduce((s, f) => s + (Number(profile[f.key]) || 0), 0);
  const plan = budgets.hasBudget ? budgets.total : onboardingTotal;
  const target = hasTarget && savedTarget > 0 ? savedTarget : plan > 0 ? plan : onboardingTotal;
  const pct = target > 0 ? (spent / target) * 100 : 0;
  const boundaryPct = spent > 0 ? Math.min(100, (target / spent) * 100) : 0;
  const remaining = target - spent;
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
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="grid gap-x-5 gap-y-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
                <div className="order-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <img src={targetIcon.url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="whitespace-nowrap text-sm font-semibold sm:text-base">
                          {t("Gasto objetivo mensual", "Monthly spend target")}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground"
                          onClick={() => setPlanOpen(true)}
                          aria-label={rows.length ? t("Editar plan", "Edit plan") : t("Plan de gastos", "Spending plan")}
                        >
                          {rows.length ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="mt-1 text-xs leading-4 text-muted-foreground">
                        {t("Limita tus gastos mensuales", "Limit your monthly spending")}
                      </p>
                    </div>
                  </div>
                </div>
                {target <= 0 ? (
                  <div className="order-2 flex md:col-start-2 md:self-center">
                    <Button className="w-full sm:w-auto" onClick={() => setPlanOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("Crear tu plan de gastos", "Create your spending plan")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="order-3 flex min-w-0 flex-col gap-1 md:order-2 md:-mb-2 md:self-end">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <span className="numeric shrink-0 text-xl font-semibold sm:text-2xl">{fmt(spent)}</span>
                        <span
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium",
                            spent <= target ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative",
                          )}
                        >
                          {spent <= target
                            ? `${fmt(target - spent)} ${t("que puedes invertir", "you can invest")}`
                            : `${fmt(spent - target)} ${t("que gastaste de más", "over budget")}`}
                        </span>
                      </div>
                      <p className="whitespace-nowrap text-xs leading-4 text-muted-foreground">
                        {monthLabel} · {pct.toFixed(0)}% {t("del objetivo", "of target")}
                      </p>
                    </div>
                    <div className="relative order-2 flex items-center self-start md:order-3 md:self-center">
                      <span className="pointer-events-none absolute left-3 text-sm font-semibold text-muted-foreground">$</span>
                      <NumberInput
                        value={target}
                        onChange={setTarget}
                        format
                        className="h-11 w-full pl-7 text-base font-semibold"
                      />
                    </div>
                    <div className="order-4 self-center">
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        {spent <= target ? (
                          <div className="h-full rounded-full bg-positive" style={{ width: `${Math.min(100, pct)}%` }} />
                        ) : (
                          <>
                            <div className="h-full bg-positive" style={{ width: `${boundaryPct}%` }} />
                            <div className="h-full flex-1 bg-negative" />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="order-5 mt-1.5 md:-mt-5 md:col-start-2">
                      <div className="relative h-4 text-[0.625rem] text-muted-foreground sm:text-xs">
                        <span className="numeric absolute left-0 top-0">{fmt(0)}</span>
                        {spent > target && boundaryPct >= 10 && boundaryPct <= 90 && (
                          <span
                            className={cn("numeric absolute top-0 -translate-x-full pr-1 lg:-translate-x-1/2 lg:pr-0")}
                            style={{ left: `${boundaryPct}%` }}
                          >
                            {fmt(target)}
                          </span>
                        )}
                        <span className="numeric absolute right-0 top-0">{fmt(spent)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {rows.length > 0 && (
                <Collapsible
                  open={rowsOpen}
                  onOpenChange={setRowsOpen}
                  className="mt-5 border-t border-border/60 pt-4"
                >
                  <CollapsibleTrigger
                    className="flex w-full items-center justify-between gap-2 py-1 text-left"
                    aria-label={t("Mostrar u ocultar plan por categoría", "Show or hide category plan")}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="whitespace-nowrap text-[0.625rem] font-medium uppercase tracking-[0.08em] text-muted-foreground sm:text-xs sm:tracking-[0.14em]">
                        <span className="sm:hidden">{t("Gasto real vs objetivo", "Actual vs target")}</span>
                        <span className="hidden sm:inline">{t("Gasto real vs objetivo por categoría", "Actual vs target by category")}</span>
                      </p>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanOpen(true);
                      }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={t("Editar plan de gastos", "Edit spending plan")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.map((r) => (
                        <div key={r.id} className="rounded-xl border border-border/50 bg-background/40 px-3.5 py-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 flex-1 truncate text-xs leading-4 sm:text-sm">
                              {r.emoji} {r.name}
                            </span>
                            <span
                              className={cn(
                                "numeric shrink-0 text-xs leading-4 sm:text-sm",
                                r.actual > r.planned ? "text-negative" : "text-positive",
                              )}
                            >
                              {fmt(r.actual)} / {fmt(r.planned)}
                            </span>
                          </div>
                          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", r.actual > r.planned ? "bg-negative" : "bg-positive")}
                              style={{ width: `${Math.min(100, r.pct)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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
