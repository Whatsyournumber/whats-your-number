import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ArrowDown, ArrowLeftRight, ArrowUp, CalendarDays, Camera, ChevronDown, ChevronRight, GripVertical, Loader2, Mic, Pencil, PencilLine, Plus, Repeat, Square, TrendingUp, Upload, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { BudgetDialog } from "@/components/budget-dialog";
import { ManualExpenseDialog } from "@/components/manual-expense-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { BUDGET_CATEGORIES, findBudgetCategory } from "@/lib/budget-categories";
import { BASE_CATEGORIES, categorizeTx } from "@/lib/categorize";
import { captureExpense } from "@/lib/expense-capture.functions";
import { translateCategory } from "@/lib/i18n-data";
import { saveExpense } from "@/lib/manual-expense";
import { supabase } from "@/integrations/supabase/client";
import { SPEND_PLAN_FIELDS, getWynMoneyLocale, money } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type DraftItem = { name: string; amount: number; category: string };
type Draft = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  items: DraftItem[];
  source: "voice" | "receipt";
};

const ALERTS_KEY = "whatsyournumber:expense-alerts";
const RECEIPT_DETAIL_PREFIX = "wyn-receipt:";
const EMPTY_OVERRIDES: Record<string, string> = {};

const receiptItemsFrom = (description: string | null | undefined): DraftItem[] => {
  if (!description?.startsWith(RECEIPT_DETAIL_PREFIX)) return [];
  try {
    const parsed = JSON.parse(description.slice(RECEIPT_DETAIL_PREFIX.length)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const name = typeof row["name"] === "string" ? row["name"].trim() : "";
        const amount = Math.abs(Number(row["amount"]) || 0);
        const category = typeof row["category"] === "string" ? row["category"] : "Otros";
        return name && amount > 0 ? { name, amount, category } : null;
      })
      .filter((item): item is DraftItem => item !== null);
  } catch {
    return [];
  }
};

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
    const amount = Math.round(recAmount);
    if (!name || recAmount <= 0) {
      toast.error(t("Escribe nombre y monto mayor que cero", "Enter a name and an amount above zero"));
      return;
    }
    if (recEditId) {
      fixed.update(recEditId, { name, amount, dayOfMonth: recDay });
      const planId = `custom:fixed:${recEditId}`;
      const existing = budgets.lines.find((line) => line.id === planId);
      // Los recurrentes creados antes de las líneas de plan no tienen budget line:
      // en ese caso el monto anterior es el del propio gasto fijo, no 0.
      const previousAmount =
        existing?.amount ?? Number(fixed.items.find((i) => i.id === recEditId)?.amount ?? 0) ?? 0;
      const nextLine: BudgetLine = {
        ...existing,
        id: planId,
        label: name,
        emoji: "🔁",
        keywords: [name],
        group: "essentials",
        amount,
        dueDay: recDay,
      };
      budgets.save([...budgets.lines.filter((line) => line.id !== planId), nextLine]);
      if (hasTarget) setTarget(Math.max(0, savedTarget - previousAmount + amount));
      toast.success(t("Gasto recurrente actualizado", "Recurring expense updated"));
    } else {
      const fixedId = fixed.add(name, amount, recDay);
      budgets.save([
        ...budgets.lines,
        {
          id: `custom:fixed:${fixedId}`,
          label: name,
          emoji: "🔁",
          keywords: [name],
          group: "essentials",
          amount,
          dueDay: recDay,
        },
      ]);
      if (hasTarget) setTarget(savedTarget + amount);
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
    const planId = `custom:fixed:${recEditId}`;
    const planLine = budgets.lines.find((line) => line.id === planId);
    fixed.remove(recEditId);
    if (planLine) {
      budgets.save(budgets.lines.filter((line) => line.id !== planId));
      if (hasTarget) setTarget(Math.max(0, savedTarget - planLine.amount));
    }
    toast.success(t("Gasto recurrente eliminado", "Recurring expense deleted"));
    setRecOpen(false);
    setRecEditId(null);
  };

  const openEditTx = (x: Tx) => {
    setEditTx(x);
    setEditMerchant(x.merchant ?? "");
    setEditAmount(Math.abs(x.amount));
    setEditDate(x.tx_date ?? format(new Date(), "yyyy-MM-dd"));
    setEditCategory(x.category || categorizeTx(x, categories.rules));
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
      const selectedCategoryId = match(editCategory) ?? "others";
      saveCatOverrides({ ...catOverrides, [editTx.id]: selectedCategoryId });
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

  // El ahorro y la inversión no son gastos: se apartan para que las categorías,
  // el total gastado y los próximos pagos muestren solo gasto real.
  const isSavingsName = (name: string) => {
    const n = name.toLowerCase();
    return ["ahorro", "inversi", "savings", "investment", "fondo indexado"].some((h) => n.includes(h));
  };
  const expenseTx = useMemo(
    () => periodTx.filter((x) => !isSavingsName(`${x.merchant} ${x.description ?? ""}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodTx],
  );
  const expenseFixedItems = useMemo(
    () => fixed.items.filter((i) => !isSavingsName(i.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixed.items],
  );
  const expenseFixedTotal = expenseFixedItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const variableSpend = expenseTx.reduce((s, x) => s + Math.abs(x.amount), 0);
  const spent = variableSpend + expenseFixedTotal * periodFactor;
  const onboardingTotal = SPEND_PLAN_FIELDS.reduce((s, f) => s + (Number(profile[f.key]) || 0), 0);
  const plan = budgets.hasBudget ? budgets.total : onboardingTotal;
  const target = hasTarget && savedTarget > 0 ? savedTarget : plan > 0 ? plan : onboardingTotal;
  const periodTarget = target * periodFactor;
  const pct = periodTarget > 0 ? (spent / periodTarget) * 100 : 0;
  const expectedPacePct = periodDays > 0 ? (elapsedDays / periodDays) * 100 : 0;
  const paceDifference = Math.abs(pct - expectedPacePct);
  const isOnPace = pct <= expectedPacePct;
  const remaining = periodTarget - spent;
  // Gasto diario del plan: objetivo del periodo repartido entre sus días (mes: objetivo / 30).
  const perDay = periodDays > 0 ? periodTarget / periodDays : 0;

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

  /** Fecha del próximo cobro a partir del día del mes. */
  const nextChargeDate = (dayOfMonth?: number) => {
    const base = startOfDay(now);
    const day = Math.min(Math.max(1, dayOfMonth ?? 1), daysInMonth);
    let next = new Date(now.getFullYear(), now.getMonth(), day);
    if (next < base) next = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(day, 28));
    return next;
  };

  // Próximos pagos recurrentes ordenados por la fecha en que caen.
  const fixedUpcoming = useMemo(() => {
    return expenseFixedItems
      .filter((i) => i.amount > 0)
      .map((i) => ({ ...i, next: nextChargeDate(i.dayOfMonth) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseFixedItems, daysInMonth]);

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

  /**
   * Correcciones manuales: gasto (id de movimiento o de gasto fijo) → categoría del plan.
   * Se guardan en la cuenta, así la corrección vale en móvil, tablet y ordenador.
   */
  const { value: catOverrides, save: saveCatOverrides } = useSyncedSetting<Record<string, string>>(
    "whatsyournumber:expense-category-overrides",
    EMPTY_OVERRIDES,
  );

  const moveExpense = (key: string, toId: string) => {
    moveExpenses([key], toId);
  };

  const moveExpenses = (keys: string[], toId: string) => {
    const next = { ...catOverrides };
    for (const key of keys) next[key] = toId;
    saveCatOverrides(next);
    const cat = findBudgetCategory(toId);
    toast.success(
      keys.length > 1 ? t(`${keys.length} gastos movidos`, `${keys.length} expenses moved`) : t("Gasto movido de categoría", "Expense moved"),
      cat ? { description: `${cat.emoji} ${t(cat.es, cat.en)}` } : undefined,
    );
  };

  /** Empareja el nombre de un gasto con una categoría del plan. */
  const match = useCallback(
    (name: string) => {
      const n = name.trim().toLowerCase();
      const custom = customLines.find((c) => c.aliases.some((a) => n === a || n.includes(a) || a.includes(n)));
      if (custom) return custom.id;
      if (
        ["hipoteca", "mortgage", "alquiler", "renta", "rent", "condominio", "community fee", "mantenimiento vivienda", "mantenimiento hogar", "home maintenance", "seguro vivienda", "seguro hogar", "home insurance"]
          .some((term) => n.includes(term))
      ) return "housing";
      return BUDGET_CATEGORIES.find((c) => c.aliases.some((a) => n === a || n.includes(a)))?.id ?? null;
    },
    [customLines],
  );

  /**
   * Próximos pagos: los gastos fijos del plan con día de cobro, más los
   * recurrentes sueltos que no pertenecen a una categoría ya fechada.
   */
  const upcoming = useMemo(() => {
    const planned = planLines.filter(
      (l) => l.amount > 0 && (l.dueDay ?? 0) >= 1 && (findBudgetCategory(l.id)?.group ?? l.group) === "essentials",
    );
    const dated = new Set(planned.map((l) => l.id));
    const fromPlan = planned.map((l) => {
      const cat = findBudgetCategory(l.id);
      return {
        id: `plan:${l.id}`,
        planId: l.id,
        name: `${cat?.emoji ?? l.emoji ?? "📦"} ${cat ? t(cat.es, cat.en) : (l.label ?? l.id)}`,
        amount: l.amount,
        dayOfMonth: l.dueDay ?? 1,
        next: nextChargeDate(l.dueDay),
      };
    });
    const fromFixed = fixedUpcoming
      .filter((i) => !dated.has(catOverrides[i.id] ?? match(i.name) ?? ""))
      .map((i) => ({ ...i, planId: null as string | null }));
    return [...fromPlan, ...fromFixed].sort((a, b) => a.next.getTime() - b.next.getTime()).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLines, fixedUpcoming, catOverrides, match, t, daysInMonth]);

  const rows = useMemo(() => {
    const actual = new Map<string, number>();
    // Detalle de gastos por categoría: cada fila se puede abrir para ver en qué se gastó.
    const detail = new Map<string, { key: string; label: string; amount: number; date?: string }[]>();
    const push = (id: string, key: string, label: string, amount: number, date?: string) => {
      if (amount <= 0) return;
      actual.set(id, (actual.get(id) ?? 0) + amount);
      const arr = detail.get(id) ?? [];
      arr.push(date ? { key, label, amount, date } : { key, label, amount });
      detail.set(id, arr);
    };
    for (const x of expenseTx) {
      const name = categorizeTx(x as Tx, categories.rules);
      const id = catOverrides[x.id] ?? match(name) ?? "others";
      push(id, x.id, x.merchant || name, Math.abs(x.amount), x.tx_date ?? undefined);
    }
    for (const item of expenseFixedItems) {
      const amount = (Number(item.amount) || 0) * periodFactor;
      const id = catOverrides[item.id] ?? match(item.name) ?? "others";
      push(id, item.id, item.name, amount);
    }
    const sortItems = (id: string) => (detail.get(id) ?? []).sort((a, b) => b.amount - a.amount);
    const list = planLines
      .filter((l) => l.amount > 0)
      .map((l) => {
        const cat = findBudgetCategory(l.id);
        const spentCat = actual.get(l.id) ?? 0;
        const planned = l.amount * periodFactor;
        return {
          id: l.id,
           name: l.label ?? (cat ? t(cat.es, cat.en) : l.id),
          emoji: cat?.emoji ?? l.emoji ?? "📦",
          group: cat?.group === "essentials" || l.group === "essentials" ? "essentials" as const : "lifestyle" as const,
          planned,
          actual: spentCat,
          pct: planned > 0 ? (spentCat / planned) * 100 : 0,
          items: sortItems(l.id),
        };
      })
      .sort((a, b) => b.pct - a.pct);
    // Todo lo gastado que no encaja en una categoría del plan se agrupa en
    // "Otros gastos", para que la suma de la lista cuadre con "Gastado a la fecha".
    const shown = list.reduce((s, r) => s + r.actual, 0);
    const leftover = spent - shown;
    if (leftover > 0.5) {
      const plannedIds = new Set(list.map((r) => r.id));
      const otherItems = [...detail.entries()]
        .filter(([id]) => !plannedIds.has(id))
        .flatMap(([, items]) => items)
        .sort((a, b) => b.amount - a.amount);
      list.push({
        id: "others",
        name: t("Otros gastos", "Other spending"),
        emoji: "🧾",
        group: "lifestyle" as const,
        planned: 0,
        actual: leftover,
        pct: 0,
        items: otherItems,
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLines, expenseTx, expenseFixedItems, match, periodFactor, spent, t, categories.rules, catOverrides]);

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

  // Solo las categorías que se muestran en la lista pueden recibir foco desde una alerta.
  const visibleRows = rows.filter((r) => r.group !== "essentials");
  const alerts = visibleRows.filter((r) => r.pct >= 80 && !dismissed.includes(r.id)).slice(0, 2);

  const categoryCardRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const flashTimer = useRef<number | null>(null);
  const [flashRow, setFlashRow] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const focusCategory = (id: string) => {
    const node = rowRefs.current[id];
    if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
    else categoryCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    setFlashRow(id);
    flashTimer.current = window.setTimeout(() => setFlashRow(null), 2400);
  };

  const focusOverspent = () => {
    const over = rows.filter((r) => r.pct >= 100).sort((a, b) => b.pct - a.pct)[0];
    if (over) focusCategory(over.id);
    else categoryCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  const [draft, setDraft] = useState<Draft | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  // Gasto que se está moviendo a otra categoría desde el desglose.
  const [moveItem, setMoveItem] = useState<{ keys: string[]; label: string; from: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dragItem, setDragItem] = useState<{ keys: string[]; from: string } | null>(null);
  const dragItemRef = useRef<{ keys: string[]; from: string } | null>(null);

  // Mientras arrastras, un rótulo flotante dice qué cantidad y cuántos gastos
  // van contigo, para que quede claro que se mueven varios a la vez.
  const dragInfo = useMemo(() => {
    const keys = dragItem?.keys ?? [];
    if (keys.length === 0) return null;
    const wanted = new Set(keys);
    let amount = 0;
    for (const r of rows) {
      for (const it of r.items) {
        if (!wanted.has(it.key)) continue;
        amount += it.amount;
        wanted.delete(it.key);
      }
      if (wanted.size === 0) break;
    }
    return { count: keys.length, amount };
  }, [dragItem, rows]);

  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!dragItem) {
      setDragPoint(null);
      return;
    }
    let frame = 0;
    const onMove = (event: DragEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setDragPoint({ x, y });
      });
    };
    document.addEventListener("dragover", onMove, true);
    return () => {
      document.removeEventListener("dragover", onMove, true);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [dragItem]);
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<"voice" | "receipt" | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const camRef = useRef<HTMLInputElement | null>(null);
  const latestExpensesRef = useRef<HTMLDivElement | null>(null);

  const openDraft = (source: "voice" | "receipt", parsed: {
    merchant: string;
    amount: number;
    date: string | null;
    category: string;
    items?: { name: string; amount: number; category: string }[];
  }) => {
    const valid = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date);
    const items = (parsed.items ?? [])
      .map((i) => ({
        name: String(i.name || "").trim(),
        amount: Math.abs(Number(i.amount) || 0),
        category: categoryNames.includes(i.category) ? i.category : "Otros",
      }))
      .filter((i) => i.name && i.amount > 0);
    setDraft({
      merchant: parsed.merchant || t("Gasto", "Expense"),
      amount: Math.abs(Number(parsed.amount) || 0),
      date: valid ? (parsed.date ?? format(now, "yyyy-MM-dd")) : format(now, "yyyy-MM-dd"),
      category: categoryNames.includes(parsed.category) ? parsed.category : "Otros",
      items,
      source,
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
          lang,

        },
      });
      setTranscript(result.transcript ?? "");
      openDraft(kind, result);
    } catch (error) {
      toast.error(
        t("No pudimos leer el gasto. Inténtalo de nuevo.", "We couldn't read the expense. Please try again."),
        { description: error instanceof Error ? error.message : undefined },
      );
    } finally {
      setBusy(null);
      if (kind === "voice") setVoiceDialogOpen(false);
    }
  };

  const startRecording = async (showMobileDialog = false) => {
    if (showMobileDialog) {
      setVoiceDialogOpen(true);
      setVoiceStarting(true);
    }
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
      setVoiceStarting(false);
      setRecording(true);
    } catch {
      setVoiceStarting(false);
      setVoiceDialogOpen(false);
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
      const savedId = await saveExpense({
        userId: user.id,
        date: draft.date,
        merchant: draft.merchant,
        category: draft.category,
        amount: draft.amount,
        currency,
        description:
          draft.source === "receipt" && draft.items.length > 0
            ? `${RECEIPT_DETAIL_PREFIX}${JSON.stringify(draft.items)}`
            : t("Registro rápido", "Quick log"),
      });
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      setPeriod("month");
      if (draft.source === "receipt" && draft.items.length > 0) setExpandedTx(savedId);
      toast.success(t("Gasto guardado", "Expense saved"), {
        description: `${draft.merchant} · ${fmt(draft.amount)}`,
      });
      setDraft(null);
      setTranscript("");
      window.setTimeout(() => latestExpensesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="sticky top-14 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur-xl sm:static sm:mx-0 sm:items-start sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none">
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
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-positive text-background shadow-lg shadow-positive/20 sm:hidden"
            >
              <Plus className="h-6 w-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => setManualOpen(true)}>
              <PencilLine className="mr-2.5 h-6 w-6 text-positive" />
              {t("Manual", "Manual")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => (recording ? stopRecording() : startRecording(true))}>
              {recording ? <Square className="mr-2.5 h-6 w-6 text-negative" /> : <Mic className="mr-2.5 h-6 w-6 text-positive" />}
              {recording ? t("Detener", "Stop") : t("Por voz", "By voice")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => camRef.current?.click()}>
              <Camera className="mr-2.5 h-6 w-6 text-positive" />
              {t("Tomar foto", "Take photo")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => fileRef.current?.click()}>
              <Upload className="mr-2.5 h-6 w-6 text-positive" />
              {t("Sube foto o captura", "Upload photo or screenshot")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={openNewRecurring}>
              <Repeat className="mr-2.5 h-6 w-6 text-positive" />
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
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => setManualOpen(true)}>
              <PencilLine className="mr-2.5 h-6 w-6 text-positive" />
              {t("Manual", "Manual")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => (recording ? stopRecording() : startRecording())}>
              {recording ? <Square className="mr-2.5 h-6 w-6 text-negative" /> : <Mic className="mr-2.5 h-6 w-6 text-positive" />}
              {recording ? t("Detener", "Stop") : t("Por voz", "By voice")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => camRef.current?.click()}>
              <Camera className="mr-2.5 h-6 w-6 text-positive" />
              {t("Tomar foto", "Take photo")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={() => fileRef.current?.click()}>
              <Upload className="mr-2.5 h-6 w-6 text-positive" />
              {t("Sube foto o captura", "Upload photo or screenshot")}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-16 rounded-lg px-3.5 text-[17px]" onSelect={openNewRecurring}>
              <Repeat className="mr-2.5 h-6 w-6 text-positive" />
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

      <Dialog
        open={voiceDialogOpen}
        onOpenChange={(open) => {
          if (!open && recording) stopRecording();
          if (!open && !recording && busy !== "voice") setVoiceDialogOpen(false);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border-negative/25 bg-card p-0 text-center shadow-2xl sm:hidden [&>button]:hidden">
          <div className="relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden px-6 py-8">
            <div className="relative mb-6 grid h-32 w-32 place-items-center">
              {recording && (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-negative/10 motion-reduce:animate-none" />
                  <span className="absolute inset-3 animate-pulse rounded-full border border-negative/30 motion-reduce:animate-none" />
                </>
              )}
              <span className="relative grid h-24 w-24 place-items-center rounded-full bg-negative/15 text-negative ring-1 ring-negative/25">
                {voiceStarting || busy === "voice" ? (
                  <Loader2 className="h-11 w-11 animate-spin" />
                ) : (
                  <Mic className="h-11 w-11" strokeWidth={1.8} />
                )}
              </span>
            </div>

            <DialogTitle className="text-2xl">
              {busy === "voice"
                ? t("Preparando tu gasto", "Preparing your expense")
                : voiceStarting
                  ? t("Activando micrófono", "Starting microphone")
                  : t("Grabando...", "Recording...")}
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-[17rem] text-sm leading-6">
              {busy === "voice"
                ? t("Entendiendo el monto, la fecha y la categoría.", "Understanding the amount, date, and category.")
                : t("Di por ejemplo: «45 euros en el supermercado hoy».", "Say, for example: “45 dollars at the supermarket today.”")}
            </DialogDescription>

            {recording && (
              <Button
                type="button"
                variant="outline"
                onClick={stopRecording}
                className="mt-7 h-12 w-full border-negative/35 bg-negative/10 text-negative hover:bg-negative/15 hover:text-negative"
              >
                <Square className="mr-2 h-4 w-4 fill-current" />
                {t("Detener grabación", "Stop recording")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={busy === "receipt"}>
        <DialogContent className="max-w-xs text-center [&>button]:hidden">
          <div className="flex flex-col items-center py-5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-positive/10 text-positive">
              <Loader2 className="h-7 w-7 animate-spin" />
            </span>
            <DialogTitle className="mt-4">{t("Leyendo tu recibo", "Reading your receipt")}</DialogTitle>
            <DialogDescription className="mt-2">
              {t("Identificando el total y cada producto.", "Identifying the total and each item.")}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>



      <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-positive/10 sm:h-11 sm:w-11">
                <Wallet className="h-4 w-4 text-positive sm:h-5 sm:w-5" />
              </span>
              <h3 className="min-w-0 whitespace-nowrap text-lg font-semibold sm:text-xl lg:text-2xl">
                {t("Tu plan de gasto mensual", "Your monthly spending plan")}
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
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  {period === "week"
                    ? t("Gasto objetivo semanal", "Weekly spending target")
                    : period === "day"
                      ? t("Gasto objetivo de hoy", "Today's spending target")
                      : t("Gasto objetivo mensual", "Monthly spending target")}
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
            <button
              type="button"
              onClick={focusOverspent}
              aria-label={t("Ver categorías donde te excediste", "See categories where you overspent")}
              className="mt-3 flex w-full cursor-pointer items-center gap-3 py-1 text-left md:hidden"
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
            </button>

             <div className="mt-3 hidden items-center gap-6 lg:flex">
                <div className="grid min-w-0 shrink-0 grid-cols-[auto_auto_auto] items-baseline gap-x-6 gap-y-2">
                  <p className="text-sm text-muted-foreground">{t("Gasto objetivo mensual", "Monthly spending target")}</p>
                  <span aria-hidden className="-my-1 row-span-2 self-stretch border-l border-border/70" />
                  <p className="text-sm text-muted-foreground">{t("Gastado a la fecha", "Spent to date")}</p>
                 <div className="inline-flex min-w-0 items-baseline gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-1.5 transition-colors focus-within:border-positive/60">
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
                 <p className="numeric whitespace-nowrap text-3xl font-bold">{fmt(spent)}</p>
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

              <button
                type="button"
                onClick={focusOverspent}
                aria-label={t("Ver categorías donde te excediste", "See categories where you overspent")}
                className={cn(
                   "flex w-[252px] flex-none cursor-pointer items-center gap-3 self-center rounded-xl border p-3.5 text-left transition-colors",
                   isOnPace
                     ? "border-positive/30 bg-positive/10 hover:bg-positive/15"
                     : "border-negative/30 bg-negative/10 hover:border-negative/50 hover:bg-negative/15",
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
               </button>
             </div>

            <div className="mt-4 hidden gap-8 sm:mt-5 md:grid md:grid-cols-2 lg:hidden">
              <div className="grid min-w-0 grid-rows-[auto_1fr] justify-items-center gap-5 text-center">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t("Gasto objetivo mensual", "Monthly spending target")}</p>
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
                  <p className="text-sm text-muted-foreground">{t("Gastado a la fecha", "Spent to date")}</p>
                  <p className="numeric mt-1.5 whitespace-nowrap text-3xl font-bold sm:text-4xl">{fmt(spent)}</p>
                </div>
                 <button
                   type="button"
                   onClick={focusOverspent}
                   aria-label={t("Ver categorías donde te excediste", "See categories where you overspent")}
                   className={cn(
                     "flex w-full min-w-0 cursor-pointer items-center gap-3 self-center rounded-xl border border-border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40 sm:p-4",
                     !isOnPace && "hover:border-negative/50",
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
                 </button>
               </div>
             </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:gap-0 md:grid-cols-3">
              <div className="hidden min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2.5 sm:px-2 md:flex">
                <span className={cn("hidden h-8 w-8 shrink-0 place-items-center rounded-full sm:grid", remaining < 0 ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive")}>
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className={cn("numeric text-base font-bold leading-tight sm:text-xl", remaining < 0 ? "text-negative" : "text-positive")}>{fmt(Math.abs(remaining))}</p>
                  <p className="text-xs text-muted-foreground">{remaining < 0 ? t("De más", "Over") : t("Te quedan", "Left")}</p>
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1 max-sm:items-center max-sm:text-center sm:flex-row sm:items-center sm:gap-2.5 md:border-l md:border-border/60 md:px-4">
                <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/10 text-positive sm:grid"><CalendarDays className="h-4 w-4" /></span>
                <div>
                  <p className="numeric text-base font-bold leading-tight text-positive sm:text-xl">{daysLeft}</p>
                  <p className="text-xs text-muted-foreground">{t("días quedan", "days left")}</p>
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1 max-sm:items-center max-sm:border-l max-sm:border-border/60 max-sm:pl-3 max-sm:text-center sm:flex-row sm:items-center sm:gap-2.5 md:border-l md:border-border/60 md:px-4">
                <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/10 text-positive sm:grid"><TrendingUp className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="numeric whitespace-nowrap text-base font-bold leading-tight text-positive sm:text-xl">{fmt(perDay)}/{t("día", "day")}</p>
                  <p className="text-xs text-muted-foreground">{t("para el plan", "to stay on plan")}</p>
                </div>
              </div>
            </div>
          </div>



          {/* Galería / archivos del teléfono (incluye capturas de pantalla) */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void send("receipt", file);
            }}
          />
          {/* Cámara directa */}
          <input
            ref={camRef}
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
              className="hidden w-full items-center justify-center gap-2 rounded-xl border border-rose-500/60 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 sm:flex"
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
                onClick={() => focusCategory(a.id)}
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
                    {t("Ritmo del plan", "Plan pace")}
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
                        const nice =
                          [1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10].find((c) => n <= c) ?? 10;
                        return nice * mag;
                      };
                      const yMax = niceMax(Math.max(maxDaily, linearDay, 1) * 1.02);
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
                              <text x={left - 7} y={yOf(v) + 4} textAnchor="end" className="fill-muted-foreground text-[15px] sm:text-[11px]">
                                {axis(v)}
                              </text>
                            </g>
                          ))}
                          {linearDay > 0 && (
                            <>
                              <line
                                x1={left}
                                x2={W - 8}
                                y1={yOf(Math.min(linearDay, yMax))}
                                y2={yOf(Math.min(linearDay, yMax))}
                                className="stroke-muted-foreground"
                                strokeWidth="1.5"
                                strokeDasharray="1 5"
                                strokeLinecap="round"
                              />
                              <text
                                x={W - 10}
                                y={yOf(Math.min(linearDay, yMax)) - 7}
                                textAnchor="end"
                                className="fill-muted-foreground text-[13px] sm:text-[10px]"
                              >
                                {axis(linearDay)}
                              </text>
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
                            const x = left + (i + 0.17) * step;
                            // Altura mínima para que gastos pequeños también se vean.
                            const y = Math.min(yOf(v), top + plotH - 7);
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
                            className="fill-foreground text-[14px] sm:text-[11px] font-medium"
                          >
                            {t("Hoy", "Today")}
                          </text>
                          {xTicks.map((d) => (
                            <text
                              key={d}
                              x={left + (d - 0.5) * step}
                              y={H - 8}
                              textAnchor="middle"
                              className="fill-foreground/70 text-[15px] sm:text-[11px]"
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
                  <h3 className="text-base font-semibold">{t("Gastos fijos (Próximos pagos)", "Fixed expenses (Upcoming payments)")}</h3>
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
                            onClick={() => (i.planId ? setPlanOpen(true) : openEditRecurring(i))}
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
            <div
              ref={categoryCardRef}
              className="scroll-mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
            >
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
                 {[...rows]
                   .filter((r) => r.group !== "essentials")
                   .sort((a, b) => b.pct - a.pct)
                   .map((r, index) => {
                   const expandedCat = expandedCategory === r.id;
                   return (
                     <Fragment key={r.id}>
                       {index === 0 ? (
                         <li className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                           {t("Gastos variables mensuales", "Monthly variable expenses")}
                         </li>
                       ) : null}
                       <li
                        ref={(el) => {
                          rowRefs.current[r.id] = el;
                        }}
                        onDragOver={(event) => {
                          const activeDrag = dragItemRef.current ?? dragItem;
                          if (!activeDrag || (activeDrag.from === r.id && activeDrag.keys.length === 1)) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const activeDrag = dragItemRef.current ?? dragItem;
                          const transferredKeys = event.dataTransfer.getData("application/x-wyn-expenses");
                          const keys = transferredKeys ? transferredKeys.split("\n").filter(Boolean) : activeDrag?.keys ?? [];
                          if (keys.length > 0) moveExpenses(keys, r.id);
                          dragItemRef.current = null;
                          setDragItem(null);
                          setSelectedItems([]);
                        }}
                        className={cn(
                          "scroll-mt-24 rounded-lg transition-all duration-500",
                          flashRow === r.id &&
                            (r.planned > 0 && r.actual > r.planned
                              ? "bg-negative/10 ring-1 ring-negative/40"
                              : "bg-positive/10 ring-1 ring-positive/40"),
                        )}
                      >
                      <div
                        role={r.items.length > 0 ? "button" : undefined}
                        tabIndex={r.items.length > 0 ? 0 : undefined}
                        onClick={() => {
                          if (r.items.length > 0 && !dragItem) setExpandedCategory(expandedCat ? null : r.id);
                        }}
                        onKeyDown={(event) => {
                          if (r.items.length === 0 || (event.key !== "Enter" && event.key !== " ")) return;
                          event.preventDefault();
                          setExpandedCategory(expandedCat ? null : r.id);
                        }}
                        className={cn(
                          "flex items-center gap-3",
                          r.items.length > 0 && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                        aria-expanded={r.items.length > 0 ? expandedCat : undefined}
                      >
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-full text-base sm:h-10 sm:w-10",
                            r.planned > 0 && r.actual > r.planned ? "bg-negative/20" : "bg-positive/15",
                          )}
                        >
                          {r.emoji}
                        </span>
                        <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
                          <div className="min-w-0 lg:w-44 lg:shrink-0">
                            <p className="truncate text-sm leading-5">{r.name}</p>
                            <p className="numeric text-[0.6875rem] leading-4 text-muted-foreground">
                              {r.planned > 0 ? `${fmt(r.actual)} / ${fmt(r.planned)}` : fmt(r.actual)}
                            </p>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted lg:mt-0 lg:min-w-0 lg:flex-1">
                            <div
                              className={cn("h-full rounded-full", r.planned > 0 && r.actual > r.planned ? "bg-negative" : "bg-positive")}
                              style={{ width: `${r.planned > 0 ? Math.min(100, r.pct) : 100}%` }}
                            />
                          </div>
                        </div>
                        <span
                          className={cn(
                            "numeric w-11 shrink-0 text-right text-sm sm:w-12",
                            r.planned > 0 && r.actual > r.planned ? "text-negative" : "text-foreground",
                          )}
                        >
                          {r.planned > 0 ? `${Math.round(r.pct)}%` : "—"}
                        </span>
                        {r.items.length > 0 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedCategory(expandedCat ? null : r.id);
                            }}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={expandedCat ? t("Ocultar gastos", "Hide expenses") : t("Ver gastos", "View expenses")}
                            aria-expanded={expandedCat}
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedCat && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {expandedCat && r.items.length > 0 && (
                        <ul className="ml-12 mt-2 divide-y divide-border/40 rounded-lg bg-muted/20 px-3 sm:ml-[3.25rem]">
                          {r.items.slice(0, 12).map((it, i) => (
                            <li
                              key={`${it.key}-${i}`}
                              draggable
                              onDragStart={(event) => {
                                const keys = selectedItems.includes(it.key) ? selectedItems : [it.key];
                                const nextDrag = { keys, from: r.id };
                                dragItemRef.current = nextDrag;
                                setDragItem(nextDrag);
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", keys.join("\n"));
                                event.dataTransfer.setData("application/x-wyn-expenses", keys.join("\n"));
                              }}
                              onDragEnd={() => {
                                dragItemRef.current = null;
                                setDragItem(null);
                              }}
                              className={cn(
                                "flex cursor-grab items-center gap-2 py-2 active:cursor-grabbing",
                                selectedItems.includes(it.key) && "bg-positive/5",
                              )}
                            >
                              <GripVertical className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                              <Checkbox
                                checked={selectedItems.includes(it.key)}
                                onCheckedChange={(checked) => {
                                  setSelectedItems((current) => checked
                                    ? [...new Set([...current, it.key])]
                                    : current.filter((key) => key !== it.key));
                                }}
                                onClick={(event) => event.stopPropagation()}
                                aria-label={t(`Seleccionar ${it.label}`, `Select ${it.label}`)}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm">{it.label}</p>
                                {it.date && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {format(parseISO(it.date), "d MMM", { locale })}
                                  </p>
                                )}
                              </div>
                              <span className="numeric shrink-0 text-sm font-medium">{fmt(it.amount)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const keys = selectedItems.includes(it.key) ? selectedItems : [it.key];
                                  setMoveItem({ keys, label: keys.length > 1 ? t(`${keys.length} gastos`, `${keys.length} expenses`) : it.label, from: r.id });
                                }}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={t("Cambiar de categoría", "Change category")}
                              >
                                <ArrowLeftRight className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      </li>
                    </Fragment>
                  );
                })}
              </ul>
              {/* Total: la suma de todas las categorías cuadra con "Gastado a la fecha". */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pl-12 pt-3.5 sm:pl-[3.25rem]">
                <p className="text-sm font-semibold">{t("Total", "Total")}</p>
                <p className="numeric text-sm font-semibold">{fmt(rows.reduce((s, r) => s + r.actual, 0))}</p>
              </div>
            </div>

          )}


        <div ref={latestExpensesRef} className="scroll-mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("Últimos gastos", "Latest expenses")}</p>
          {expenseTx.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("Aún no registras gastos en este periodo.", "No expenses logged in this period yet.")}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {expenseTx.slice(0, 6).map((x) => {
                const receiptItems = receiptItemsFrom(x.description);
                const expanded = expandedTx === x.id;
                return (
                  <li key={x.id} className="py-2.5">
                    <div className="flex items-center gap-3">
                      {receiptItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedTx(expanded ? null : x.id)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={expanded ? t("Ocultar productos", "Hide items") : t("Ver productos", "View items")}
                          aria-expanded={expanded}
                        >
                          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{x.merchant}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {translateCategory(x.category || categorizeTx(x as Tx, categories.rules), lang)}
                          {receiptItems.length > 0 ? ` · ${receiptItems.length} ${t("productos", "items")}` : ""}
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
                    </div>
                    {expanded && receiptItems.length > 0 && (
                      <ul className="ml-10 mt-2 divide-y divide-border/40 rounded-lg bg-muted/20 px-3">
                        {receiptItems.map((item, index) => (
                          <li key={`${item.name}-${index}`} className="flex items-center gap-3 py-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">{item.name}</p>
                              <p className="text-[11px] text-muted-foreground">{translateCategory(item.category, lang)}</p>
                            </div>
                            <span className="numeric shrink-0 text-sm font-medium">{fmt(item.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
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
              {draft.source !== "receipt" && (
                <div className="grid gap-1.5">
                  <Label>{t("Comercio", "Merchant")}</Label>
                  <Input value={draft.merchant} onChange={(e) => setDraft({ ...draft, merchant: e.target.value })} />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label>{`${t("Monto", "Amount")} (${currency})`}</Label>
                <NumberInput value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v || 0 })} min={0} format />
              </div>
              {draft.source !== "receipt" && (
                <div className="grid gap-1.5">
                  <Label>{t("Fecha", "Date")}</Label>
                  <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </div>
              )}
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

      <Dialog open={Boolean(moveItem)} onOpenChange={(open) => !open && setMoveItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Cambiar de categoría", "Change category")}</DialogTitle>
            <DialogDescription>
              {moveItem
                ? t(`Mueve "${moveItem.label}" a la categoría correcta.`, `Move "${moveItem.label}" to the right category.`)
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {rows
              .filter((r) => r.id !== moveItem?.from)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (moveItem) moveExpenses(moveItem.keys, r.id);
                    setSelectedItems([]);
                    setMoveItem(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-base">
                    {r.emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                </button>
              ))}
          </div>
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

      {dragInfo ? (
        <div
          aria-hidden="true"
          data-drag-pill="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+16px)] select-none"
          style={dragPoint ? { left: dragPoint.x, top: dragPoint.y } : { left: "50%", top: "22%" }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-positive/40 bg-background/95 px-3 py-1.5 shadow-xl shadow-black/40 backdrop-blur-sm">
            <span className="numeric text-sm font-semibold">{fmt(dragInfo.amount)}</span>
            <span className="h-3 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {dragInfo.count === 1
                ? t("1 gasto", "1 expense")
                : t(`${dragInfo.count} gastos`, `${dragInfo.count} expenses`)}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
