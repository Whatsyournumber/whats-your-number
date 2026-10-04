import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ArrowDown, ArrowUp, BarChart3, CalendarDays, Camera, ChevronDown, ChevronRight, FileSpreadsheet, GripVertical, Link2, Loader2, MessageCircle, Mic, Pencil, PencilLine, Plus, Repeat, Square, Trash2, TrendingUp, Upload, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { FolderIcon, GooglePhotosIcon } from "@/components/expense-source-icons";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useFixedExpenses, useSpendTarget } from "@/hooks/use-fixed-expenses";
import { useLanguage, useT } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets, type BudgetLine } from "@/hooks/use-spend-budgets";
import { useTransactions, type Tx } from "@/hooks/use-transactions";
import { useSyncedSetting } from "@/hooks/use-synced-setting";
import { BUDGET_CATEGORIES, findBudgetCategory, type BudgetGroup } from "@/lib/budget-categories";
import { BASE_CATEGORIES, categorizeTx } from "@/lib/categorize";
import { captureExpense } from "@/lib/expense-capture.functions";
import { StatementImporter } from "@/components/statement-importer";
import { translateCategory } from "@/lib/i18n-data";
import { saveExpense } from "@/lib/manual-expense";
import { supabase } from "@/integrations/supabase/client";
import { SPEND_PLAN_FIELDS, compact, getWynMoneyLocale, money } from "@/lib/onboarding";
import { CategoryDetailDialog } from "@/components/category-detail-dialog";
import { cn } from "@/lib/utils";
import { SharedExpenseDialog, SharedExpenseInbox, parseShared, SHARED_PREFIX } from "@/components/shared-expense";
import { notifySharedExpense } from "@/lib/shared-expense.functions";
import { InviteShareActions } from "@/components/invite-share-actions";
import { useServerFn } from "@tanstack/react-start";
import { Check, Users } from "lucide-react";
import { normalizeValidEmail } from "@/lib/email-validation";
import { receiptItemsFrom as parseReceiptItems, sharedReceiptDescription } from "@/lib/receipt-insights";

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;

const editInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length > 1 ? (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "") : (parts[0] ?? "").slice(0, 2)).toUpperCase();
};

type DraftItem = { name: string; amount: number; category: string };
type Draft = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  items: DraftItem[];
  source: "voice" | "receipt";
  partner?: { id: string; name: string } | null;
  /** Mi parte cuando el gasto se comparte (amount sigue siendo el total). */
  myShare?: number | null;
};

const draftShare = (d: Draft) => Math.min(d.amount, Math.max(0, d.myShare ?? d.amount / 2));
const draftSplit = (d: Draft) => {
  const pct = d.amount > 0 ? Math.round((draftShare(d) / d.amount) * 100) : 50;
  return `${pct}/${100 - pct}`;
};

const normName = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Busca en lo dictado el nombre (o primer nombre) de alguien con quien ya compartiste gastos. */
const partnerFromTranscript = (text: string, partners: { id: string; name: string }[]) => {
  const words = new Set(normName(text).split(/[^a-z0-9]+/).filter(Boolean));
  const full = normName(text);
  return partners.find((p) => {
    const n = normName(p.name).trim();
    if (!n || n === "?") return false;
    const first = n.split(/\s+/)[0] ?? "";
    return full.includes(n) || (first.length >= 3 && words.has(first));
  }) ?? null;
};

const ALERTS_KEY = "whatsyournumber:expense-alerts";
const RECEIPT_DETAIL_PREFIX = "wyn-receipt:";
const EMPTY_OVERRIDES: Record<string, string> = {};

const receiptItemsFrom = (description: string | null | undefined): DraftItem[] => parseReceiptItems(description);

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

const MONTH_LABELS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const buildMonthLabel =
  (labels: string[]) =>
  (key: string) => {
    const [y, m] = key.split("-");
    return `${labels[Number(m) - 1] ?? m} ${y}`;
  };

/** Registro de gastos: captura rápida (manual, voz, recibo) y control contra tu plan. */
export function ExpenseLog() {
  const t = useT();
  const { lang } = useLanguage();
  const locale = lang === "es" ? es : enUS;
  const monthLabel = useMemo(() => buildMonthLabel(lang === "en" ? MONTH_LABELS_EN : MONTH_LABELS_ES), [lang]);
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
  const [sharedOpen, setSharedOpen] = useState(false);
  const [latestTab, setLatestTab] = useState<"all" | "mine" | "shared">("all");
  const [settlePartner, setSettlePartner] = useState<{ name: string; balance: number } | null>(null);
  const addParam = useRouterState({ select: (s) => (s.location.search as { add?: boolean }).add });
  const actionParam = useRouterState({ select: (s) => (s.location.search as { action?: string }).action });
  const router = useRouter();
  useEffect(() => {
    if (addParam !== true) return;
    setManualOpen(true);
    router.navigate({ to: "/registro-gastos", search: {}, replace: true });
  }, [addParam, router]);
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState(0);
  const [recDay, setRecDay] = useState(1);
  const [recEditId, setRecEditId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Tx | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSharedWith, setEditSharedWith] = useState<string | null>(null);
  const [editSharePartner, setEditSharePartner] = useState<{ id: string; name: string } | null>(null);
  const [editInviteEmail, setEditInviteEmail] = useState("");
  const [editLooking, setEditLooking] = useState(false);
  const [editInviting, setEditInviting] = useState(false);
  const [editInvitePending, setEditInvitePending] = useState<string | null>(null);
  const notifyShared = useServerFn(notifySharedExpense);
  const { data: editKnownPartners = [] } = useQuery({
    queryKey: ["shared-partners", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("shared_expense_participants")
        .select("user_id, display_name, created_at")
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      const seen = new Map<string, { id: string; name: string }>();
      for (const r of rows ?? []) if (!seen.has(r.user_id)) seen.set(r.user_id, { id: r.user_id, name: r.display_name || "?" });
      return [...seen.values()];
    },
  });

  // Gastos compartidos: participaciones con el gasto al que pertenecen (para el balance por persona).
  const { data: sharedBalanceRows = [] } = useQuery({
    queryKey: ["shared-balances", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("shared_expense_participants")
        .select("id, user_id, display_name, share_amount, status, shared_expenses(id, total, currency, payer_id, tx_date)")
        .neq("status", "declined");
      if (error) throw error;
      return rows;
    },
  });

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
    setEditSharedWith(parseShared(x.description)?.name ?? null);
    setEditSharePartner(null);
    setEditInviteEmail("");
    setEditInviting(false);
    setEditInvitePending(null);
  };

  const findEditPartner = async () => {
    const validEmail = normalizeValidEmail(editInviteEmail);
    if (!validEmail) {
      toast.error(t("Escribe un correo válido", "Enter a valid email"));
      return;
    }
    setEditLooking(true);
    const { data, error } = await supabase.rpc("find_user_by_email", { _email: validEmail });
    setEditLooking(false);
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      // Aún no está en la app: mostramos opciones de invitación (WhatsApp / link).
      setEditInvitePending(validEmail);
      return;
    }
    setEditInvitePending(null);
    setEditSharePartner({ id: row.id, name: (row.full_name as string) || validEmail });
    setEditInviteEmail("");
  };

  const onSaveEditTx = async () => {
    if (!editTx) return;
    if (!editAmount || editAmount <= 0) {
      toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero"));
      return;
    }
    setSaving(true);
    try {
      const wasShared = Boolean(parseShared(editTx.description));
      let amount = -Math.abs(editAmount);
      let description: string | null | undefined = undefined;
      if (wasShared && !editSharedWith) {
        // Quitar a la otra persona: el gasto pasa a ser solo tuyo.
        description = null;
      } else if (!wasShared && editSharePartner && user?.id) {
        // Convertir en compartido 50/50: se sincroniza con la otra persona.
        const total = Math.abs(editAmount);
        const half = total / 2;
        const { data: expenseId, error: shareError } = await supabase.rpc("create_shared_expense", {
          _partner_id: editSharePartner.id,
          _payer_id: user.id,
          _total: total,
          _currency: currency,
          _category: editCategory,
          _merchant: editMerchant.trim(),
          _tx_date: editDate,
          _split_mode: "50/50",
          _creator_name: (profile?.full_name as string | undefined)?.split(" ")[0] || t("Yo", "Me"),
          _partner_name: editSharePartner.name,
          _creator_share: half,
          _partner_share: half,
        });
        if (shareError) throw new Error(shareError.message);
        amount = -half;
        description = `${SHARED_PREFIX}50/50|${editSharePartner.name}`;
        if (expenseId) void notifyShared({ data: { expenseId } });
      }
      const { error } = await supabase
        .from("imported_transactions")
        .update({
          merchant: editMerchant.trim() || translateCategory(editCategory, lang),
          amount,
          tx_date: editDate,
          category: editCategory,
          ...(description !== undefined ? { description } : {}),
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
  const fmtCompact = (n: number) => compact(n, currency);
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

  // Periodo de la vista: hoy, última semana o mes completo. El objetivo y los
  // gastos fijos se prorratean para que la comparación siga siendo justa.
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  // Día de la columna del gráfico diario que el usuario está mirando (hover o toque).
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  // Categoría cuyo análisis detallado (gráfica + movimientos) está abierto.
  const [analysisCat, setAnalysisCat] = useState<string | null>(null);

  // Mes que se está mirando (key "yyyy-mm"): permite revisar los meses pasados.
  const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthKey = monthKeyOf(now);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const activeKey = viewKey ?? currentMonthKey;
  const isCurrentMonth = activeKey === currentMonthKey;
  const viewParts = activeKey.split("-").map(Number);
  const viewDate = new Date(viewParts[0] ?? now.getFullYear(), (viewParts[1] ?? now.getMonth() + 1) - 1, 1);
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);

  // Meses del selector: el actual, los 12 anteriores y cualquier mes más atrás
  // con movimientos registrados.
  const months = useMemo(() => {
    const set = new Set<string>([currentMonthKey]);
    for (const x of transactions) if (x.tx_date) set.add(monthKeyOf(parseISO(x.tx_date)));
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      set.add(monthKeyOf(d));
    }
    return [...set].sort().reverse().slice(0, 24);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const daysInMonth = monthEnd.getDate();
  const periodDays = period === "day" ? 1 : period === "week" ? 7 : daysInMonth;
  const periodFactor = periodDays / daysInMonth;
  const periodStart =
    period === "day" ? startOfDay(now) : period === "week" ? startOfDay(subDays(now, 6)) : monthStart;
  const elapsedDays = Math.min(periodDays, differenceInCalendarDays(now, periodStart) + 1);
  const daysLeft = Math.max(1, periodDays - elapsedDays + 1);

  const categoryNames = useMemo(
    () => [
      ...new Set([
        ...BASE_CATEGORIES,
        ...categories.rules.map((r) => r.name),
        ...budgets.lines
          .map((line) => line.label?.trim())
          .filter((label): label is string => Boolean(label)),
      ]),
    ],
    [budgets.lines, categories.rules],
  );

  const periodTx = useMemo(
    () =>
      transactions
        .filter((x) => x.amount < 0 && x.tx_date)
        .filter((x) => {
          const d = parseISO(x.tx_date!);
          return d >= periodStart && d <= monthEnd;
        })
        // Lo más reciente primero: por fecha y, a igual fecha, por hora de alta.
        .sort((a, b) => {
          if (a.tx_date! !== b.tx_date!) return a.tx_date! > b.tx_date! ? -1 : 1;
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        }),
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

  // Balance de gastos compartidos por persona, dentro del periodo visible.
  type SharedBalance = { id: string; name: string; count: number; together: number; myShare: number; balance: number };
  const myName = (profile?.full_name as string | undefined)?.split(" ")[0] || t("Yo", "Me");
  const initialsOf = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";
  const sharedBalances = useMemo<SharedBalance[]>(() => {
    if (!user?.id) return [];
    type Row = { expense_id: string; user_id: string; display_name: string | null; share_amount: number; status: string; shared_expenses: { total: number; payer_id: string; tx_date: string } | null };
    const byExpense = new Map<string, Row[]>();
    for (const row of sharedBalanceRows as unknown as Row[]) {
      const list = byExpense.get(row.expense_id) ?? [];
      list.push(row);
      byExpense.set(row.expense_id, list);
    }
    const map = new Map<string, SharedBalance>();
    for (const rows of byExpense.values()) {
      const exp = rows[0]?.shared_expenses;
      const mine = rows.find((r) => r.user_id === user.id);
      if (!exp || !mine) continue;
      const partners = rows.filter((r) => r.user_id !== user.id && r.status === "accepted");
      if (!partners.length) continue;
      const inPeriod = Boolean(exp.tx_date);
      for (const p of partners) {
        const entry = map.get(p.user_id) ?? { id: p.user_id, name: p.display_name || "?", count: 0, together: 0, myShare: 0, balance: 0 };
        if (inPeriod) {
          entry.count += 1;
          entry.together += Number(exp.total) || 0;
          entry.myShare += Number(mine.share_amount) || 0;
        }
        if (exp.payer_id === user.id) entry.balance += Number(p.share_amount) || 0;
        else if (exp.payer_id === p.user_id) entry.balance -= Number(mine.share_amount) || 0;
        map.set(p.user_id, entry);
      }
    }
    return [...map.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBalanceRows, user?.id, periodStart.getTime(), monthEnd.getTime()]);

  const settleMsg = settlePartner
    ? settlePartner.balance > 0.005
      ? t(`Hola! Solo recordar que me debes ${fmt(settlePartner.balance)} 💸`, `Hi! Just a reminder that you owe me ${fmt(settlePartner.balance)} 💸`)
      : settlePartner.balance < -0.005
        ? t(`Hola! Te pago ${fmt(-settlePartner.balance)} de lo que compartimos 💸`, `Hi! I'll pay you ${fmt(-settlePartner.balance)} for our shared expenses 💸`)
        : t("Hola! Todo en paz 😊", "Hi! We're all even 😊")
    : "";
  const settleWa = settlePartner ? `https://wa.me/?text=${encodeURIComponent(settleMsg)}` : "";
  const copySettleText = async () => {
    try {
      await navigator.clipboard.writeText(settleMsg);
      toast.success(t("Texto copiado", "Text copied"));
    } catch {
      toast.error(t("No se pudo copiar el texto", "Could not copy the text"));
    }
  };
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
  const expectedSpend = periodTarget * (elapsedDays / Math.max(periodDays, 1));
  const paceAmount = Math.abs(spent - expectedSpend);
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

  const todayDay = isCurrentMonth ? now.getDate() : 0;
  const monthVariable = daily.reduce((s, v) => s + v, 0);

  /** Fecha del próximo cobro a partir del día del mes. */
  const nextChargeDate = (dayOfMonth?: number) => {
    const base = startOfDay(now);
    const day = Math.min(Math.max(1, dayOfMonth ?? 1), daysInMonth);
    // Meses pasados: cada cobro se muestra en el día que tocó ese mes.
    if (!isCurrentMonth) return new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
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
  }, [expenseFixedItems, daysInMonth, activeKey]);

  /** Plan del onboarding: las categorías y montos que la persona declaró al registrarse. */
  const onboardingLines = useMemo<BudgetLine[]>(() => {
    // Varias categorías del onboarding pueden compartir budgetId: se suman.
    const byId = new Map<string, number>();
    for (const f of SPEND_PLAN_FIELDS) {
      const amt = Number(profile[f.key]) || 0;
      if (amt > 0) byId.set(f.budgetId, (byId.get(f.budgetId) ?? 0) + amt);
    }
    return [...byId.entries()].map(([id, amount]) => ({ id, amount }));
  }, [profile]);

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
    const result = [...merged.values()].filter((l) => l.amount > 0);
    // Hogar es variable: si el plan aún no lo trae, aparece con 0 para poder rellenarlo.
    if (result.length && !result.some((l) => l.id === "hogar")) {
      const groupOf = (l: BudgetLine): BudgetGroup =>
        findBudgetCategory(l.id)?.group ?? l.group ?? "other";
      let insertAt = result.length;
      for (let i = result.length - 1; i >= 0; i--) {
        if (groupOf(result[i]!) === "lifestyle") {
          insertAt = i + 1;
          break;
        }
      }
      result.splice(insertAt, 0, { id: "hogar", amount: 0 });
    }
    return result;
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

  // Desglose de «Suscripciones / apps»: cada app con su monto y día de cobro.
  // Se guarda en la cuenta para verse igual en todos los dispositivos.
  type AppSub = { id: string; name: string; emoji: string; amount: number; day: number };
  /** Línea del plan que representa «Suscripciones / apps» (id fijo o personalizada). */
  const isAppsPlanLine = (l: { id: string; label?: string }) =>
    l.id === "apps" || /^custom:.*(app|suscrip)/i.test(l.id) || /apps|suscripciones|subscriptions/i.test(l.label ?? "");
  /** Gasto recurrente suelto que es «Suscripciones / apps» (p. ej. el del onboarding). */
  const isAppsName = (name: string) => /suscrip|subscrip|\bapps?\b/i.test(name);
  const { value: appSubs, save: saveAppSubs } = useSyncedSetting<AppSub[]>("whatsyournumber:app-subscriptions", []);
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsDraft, setSubsDraft] = useState<AppSub[]>([]);
  const [appsExpanded, setAppsExpanded] = useState(false);
  const [fixedOpen, setFixedOpen] = useState(false);
  const appSubsTotal = appSubs.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  // Solo se muestran como reales las apps guardadas; nunca marcadores a 0.
  const displaySubs = appSubs;

  const openSubsEditor = () => {
    if (appSubs.length) {
      setSubsDraft(appSubs.map((a) => ({ ...a })));
    } else {
      // Sin desglose guardado: se parte del monto actual para no perderlo al guardar.
      const fixedApps = expenseFixedItems.find((i) => isAppsName(i.name));
      const planApps = budgets.lines.find(isAppsPlanLine);
      const currentAmount = Math.max(0, Math.round(Number(fixedApps?.amount ?? planApps?.amount ?? 0) || 0));
      const currentDay = Math.min(31, Math.max(1, Number(fixedApps?.dayOfMonth ?? planApps?.dueDay ?? 1) || 1));
      setSubsDraft([
        ...(currentAmount > 0
          ? [{ id: "current", name: t("Otras apps", "Other apps"), emoji: "📱", amount: currentAmount, day: currentDay }]
          : []),
        { id: "spotify", name: "Spotify", emoji: "🎵", amount: 0, day: currentDay },
        { id: "netflix", name: "Netflix", emoji: "🎬", amount: 0, day: currentDay },
      ]);
    }
    setSubsOpen(true);
  };

  const onSaveSubs = () => {
    const clean = subsDraft
      .map((a) => ({ ...a, name: a.name.trim(), amount: Math.max(0, Math.round(Number(a.amount) || 0)), day: Math.min(31, Math.max(1, Number(a.day) || 1)) }))
      .filter((a) => a.name);
    saveAppSubs(clean);
    const total = clean.reduce((s, a) => s + a.amount, 0);
    const firstDay = clean.length ? Math.min(...clean.map((a) => a.day)) : 1;
    // Si las apps vienen de un gasto recurrente suelto, se actualiza ese gasto.
    const fixedApps = expenseFixedItems.find((i) => isAppsName(i.name));
    if (fixedApps) fixed.update(fixedApps.id, { amount: total, dayOfMonth: firstDay });
    const existing = budgets.lines.find(isAppsPlanLine);
    if (existing || !fixedApps) {
      budgets.save([
        ...budgets.lines.filter((l) => !isAppsPlanLine(l)),
        { ...existing, id: existing?.id ?? "apps", amount: total, dueDay: firstDay, group: "essentials" },
      ]);
    }
    setSubsOpen(false);
    toast.success(t("Suscripciones actualizadas", "Subscriptions updated"));
  };

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
      // «Suscripciones / apps» con desglose: el total y la fecha salen de las apps.
      const isApps = isAppsPlanLine(l) && appSubs.length > 0;
      const day = isApps ? Math.min(...appSubs.map((a) => a.day)) : (l.dueDay ?? 1);
      return {
        id: `plan:${l.id}`,
        planId: l.id,
        name: `${cat?.emoji ?? l.emoji ?? "📦"} ${cat ? t(cat.es, cat.en) : (l.label ?? l.id)}`,
        amount: isApps ? appSubsTotal : l.amount,
        dayOfMonth: day,
        next: nextChargeDate(day),
      };
    });
    const fromFixed = fixedUpcoming
      .filter((i) => !dated.has(catOverrides[i.id] ?? match(i.name) ?? ""))
      .map((i) => {
        // El gasto recurrente de apps toma total y fecha del desglose guardado.
        if (isAppsName(i.name) && appSubs.length > 0) {
          const day = Math.min(...appSubs.map((a) => a.day));
          return { ...i, amount: appSubsTotal, dayOfMonth: day, next: nextChargeDate(day), planId: null as string | null };
        }
        return { ...i, planId: null as string | null };
      });
    // Se listan todos los gastos fijos: nada queda oculto bajo el total.
    return [...fromPlan, ...fromFixed].sort((a, b) => a.next.getTime() - b.next.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLines, fixedUpcoming, catOverrides, match, t, daysInMonth, appSubs, appSubsTotal]);

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
      // Los gastos compartidos ya traen la categoría elegida por la persona:
      // se respeta aunque el comercio coincida con otra regla automática.
      const name = x.description?.startsWith(SHARED_PREFIX) && x.category ? x.category : categorizeTx(x as Tx, categories.rules);
      const id = catOverrides[x.id] ?? match(name) ?? "others";
      push(id, x.id, x.merchant || name, Math.abs(x.amount), x.tx_date ?? undefined);
    }
    for (const item of expenseFixedItems) {
      const amount = (Number(item.amount) || 0) * periodFactor;
      const id = catOverrides[item.id] ?? match(item.name) ?? "others";
      push(id, item.id, item.name, amount);
    }
    const sortByDate = (
      a: { amount: number; date?: string },
      b: { amount: number; date?: string },
    ) => {
      if (a.date && b.date) return b.date.localeCompare(a.date) || b.amount - a.amount;
      if (a.date) return -1;
      if (b.date) return 1;
      return b.amount - a.amount;
    };
    const sortItems = (id: string) => (detail.get(id) ?? []).sort(sortByDate);
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
        .sort(sortByDate);
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

  // Gasto del periodo anterior equivalente, por categoría, para el "vs periodo
  // anterior" del análisis (misma ventana de días justo antes del periodo actual).
  const prevByCategory = useMemo(() => {
    const prevEnd = subDays(periodStart, 1);
    const prevStart = subDays(periodStart, periodDays);
    const map = new Map<string, number>();
    for (const x of transactions) {
      if (x.amount >= 0 || !x.tx_date) continue;
      const d = parseISO(x.tx_date);
      if (d < prevStart || d > prevEnd) continue;
      if (isSavingsName(`${x.merchant} ${x.description ?? ""}`)) continue;
      const name = x.description?.startsWith(SHARED_PREFIX) && x.category ? x.category : categorizeTx(x as Tx, categories.rules);
      const id = catOverrides[x.id] ?? match(name) ?? "others";
      map.set(id, (map.get(id) ?? 0) + Math.abs(x.amount));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, periodStart.getTime(), periodDays, categories.rules, catOverrides, match]);

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
    const over = visibleRows.filter((r) => r.pct >= 100).sort((a, b) => b.pct - a.pct)[0];
    if (over) focusCategory(over.id);
    else categoryCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  const [draft, setDraft] = useState<Draft | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [latestOpen, setLatestOpen] = useState(false);
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
  const [draftInviting, setDraftInviting] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [draftLooking, setDraftLooking] = useState(false);
  const [draftInvitePending, setDraftInvitePending] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cancelVoiceRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const camRef = useRef<HTMLInputElement | null>(null);
  const docsRef = useRef<HTMLInputElement | null>(null);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const latestExpensesRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

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
      if (kind === "voice" && result.transcript) {
        const match = partnerFromTranscript(result.transcript, editKnownPartners);
        const share = Number(result.myShare);
        const myShare = Number.isFinite(share) && share > 0 ? Math.abs(share) : null;
        if (match || myShare) setDraft((d) => (d ? { ...d, partner: match ?? d.partner ?? null, myShare } : d));
      }
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

  // Varios archivos a la vez: se leen todos y cada recibo se guarda solo.
  const sendReceiptFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length === 1) {
      const only = files[0];
      if (only) void send("receipt", only);
      return;
    }
    if (!user?.id) return;
    setBusy("receipt");
    let saved = 0;
    let lastId: string | null = null;
    for (const file of files) {
      try {
        const data = await blobToBase64(file);
        const result = await captureExpense({
          data: {
            kind: "receipt",
            data,
            mimeType: file.type,
            categories: categoryNames,
            currency,
            today: format(now, "yyyy-MM-dd"),
            lang,
          },
        });
        const amount = Math.abs(Number(result.amount) || 0);
        if (amount <= 0) continue;
        const items = (result.items ?? [])
          .map((i) => ({
            name: String(i.name || "").trim(),
            amount: Math.abs(Number(i.amount) || 0),
            category: categoryNames.includes(i.category) ? i.category : "Otros",
          }))
          .filter((i) => i.name && i.amount > 0);
        const valid = result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date);
        lastId = await saveExpense({
          userId: user.id,
          date: valid ? (result.date as string) : format(now, "yyyy-MM-dd"),
          merchant: result.merchant || t("Gasto", "Expense"),
          category: categoryNames.includes(result.category) ? result.category : "Otros",
          amount,
          currency,
          description: items.length > 0 ? `${RECEIPT_DETAIL_PREFIX}${JSON.stringify(items)}` : t("Registro rápido", "Quick log"),
        });
        saved++;
      } catch {
        // Un archivo ilegible no frena al resto.
      }
    }
    setBusy(null);
    if (saved > 0) {
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      setPeriod("month");
      if (lastId) setExpandedTx(lastId);
      toast.success(
        saved === 1
          ? t("Gasto guardado", "Expense saved")
          : t(`${saved} gastos guardados`, `${saved} expenses saved`),
      );
      window.setTimeout(() => latestExpensesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } else {
      toast.error(t("No pudimos leer los recibos. Inténtalo de nuevo.", "We couldn't read the receipts. Please try again."));
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
        if (cancelVoiceRef.current) {
          cancelVoiceRef.current = false;
          return;
        }
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

  const cancelRecording = () => {
    cancelVoiceRef.current = true;
    recorderRef.current?.stop();
    setVoiceDialogOpen(false);
  };

  const findDraftPartner = async () => {
    const email = normalizeValidEmail(draftEmail);
    if (!email) {
      toast.error(t("Escribe un correo válido", "Enter a valid email"));
      return;
    }
    setDraftLooking(true);
    try {
      const { data, error } = await supabase.rpc("find_user_by_email", { _email: email });
      if (error) throw error;
      const person = Array.isArray(data) ? data[0] : null;
      if (!person) {
        setDraftInvitePending(email);
        return;
      }
      if (person.id === user?.id) {
        toast.error(t("Elige a otra persona", "Choose someone else"));
        return;
      }
      setDraft((current) => current ? { ...current, partner: { id: person.id, name: person.full_name || email } } : current);
      setDraftInviting(false);
      setDraftEmail("");
      setDraftInvitePending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo buscar a la persona", "Could not find the person"));
    } finally {
      setDraftLooking(false);
    }
  };

  // Acciones que llegan desde el botón "+" de la barra móvil inferior.
  useEffect(() => {
    if (!actionParam) return;
    if (actionParam === "voice") void startRecording(true);
    else if (actionParam === "photo") camRef.current?.click();
    else if (actionParam === "upload") (isMobile ? setPhotoPickerOpen(true) : fileRef.current?.click());
    else if (actionParam === "recurring") openNewRecurring();
    else if (actionParam === "statement") setStatementOpen(true);
    router.navigate({ to: "/registro-gastos", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionParam]);

  const onSaveDraft = async () => {
    if (!draft || !user?.id) return;
    if (draft.amount <= 0) {
      toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero"));
      return;
    }
    setSaving(true);
    try {
      let ownAmount = draft.amount;
      let sharedDescription: string | null = null;
      if (draft.partner) {
        ownAmount = Math.round(draftShare(draft) * 100) / 100;
        const { data: expenseId, error: shareError } = await supabase.rpc("create_shared_expense", {
          _partner_id: draft.partner.id,
          _payer_id: user.id,
          _total: draft.amount,
          _currency: currency,
          _category: draft.category,
          _merchant: draft.merchant,
          _tx_date: draft.date,
          _split_mode: draftSplit(draft),
          _creator_name: (profile?.full_name as string | undefined)?.split(" ")[0] || t("Yo", "Me"),
          _partner_name: draft.partner.name,
          _creator_share: ownAmount,
          _partner_share: draft.amount - ownAmount,
          _receipt_items: draft.source === "receipt" ? draft.items.slice(0, 150).map((i) => ({ name: String(i.name).slice(0, 120), amount: Number(i.amount) || 0 })) : [],
        });
        if (shareError) throw new Error(shareError.message);
        if (!expenseId) throw new Error(t("No se pudo compartir el gasto", "Could not share the expense"));
        sharedDescription = draft.source === "receipt"
          ? sharedReceiptDescription(draftSplit(draft), draft.partner.name, draft.items)
          : `${SHARED_PREFIX}${draftSplit(draft)}|${draft.partner.name}`;
        void notifyShared({ data: { expenseId } }).catch(() => {});
      }
      const savedId = await saveExpense({
        userId: user.id,
        date: draft.date,
        merchant: draft.merchant,
        category: draft.category,
        amount: ownAmount,
        currency,
        description:
          sharedDescription ??
          (draft.source === "receipt" && draft.items.length > 0
            ? `${RECEIPT_DETAIL_PREFIX}${JSON.stringify(draft.items)}`
            : t("Registro rápido", "Quick log")),
      });
      setDraft(null);
      setTranscript("");
      setDraftInviting(false);
      setDraftEmail("");
      setDraftInvitePending(null);
      void queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      if (draft.partner) void queryClient.invalidateQueries({ queryKey: ["shared-partners"] });
      setPeriod("month");
      if (draft.source === "receipt" && draft.items.length > 0) setExpandedTx(savedId);
      toast.success(t("Gasto guardado", "Expense saved"), {
        description: `${draft.merchant} · ${fmt(draft.amount)}`,
      });
      window.setTimeout(() => latestExpensesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("No se pudo guardar el gasto", "Could not save the expense"));
    } finally {
      setSaving(false);
    }
  };

  /** Fila de "Últimos gastos", reutilizada en la tarjeta y en el popup con todo el historial. */
  const renderLatestTx = (x: (typeof expenseTx)[number]) => {
    const receiptItems = receiptItemsFrom(x.description);
    const receiptTotal = receiptItems.reduce((sum, item) => sum + item.amount, 0);
    const receiptShare = parseShared(x.description) && receiptTotal > 0
      ? Math.abs(x.original_amount ?? x.amount) / receiptTotal
      : 1;
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
            <p className="flex min-w-0 items-center gap-1.5 break-words text-sm font-medium">{x.merchant}{parseShared(x.description) && <Users className="h-3.5 w-3.5 shrink-0 text-positive" />}</p>
            <p className="break-words text-[11px] text-muted-foreground">
              {translateCategory(x.category || categorizeTx(x as Tx, categories.rules), lang)}
              {receiptItems.length > 0 ? ` · ${receiptItems.length} ${t("productos", "items")}` : ""}
              {parseShared(x.description) ? ` · ${parseShared(x.description)!.split} · ${t("con", "with")} ${parseShared(x.description)!.name}` : ""}
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
                <span className="numeric shrink-0 text-sm font-medium">{fmt(item.amount * receiptShare)}</span>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section className="space-y-4">
      <SharedExpenseInbox />
      <div className="sticky top-14 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur-xl sm:static sm:mx-0 sm:items-start sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t("Mis gastos diarios", "My daily spending")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:hidden">
            {t("Controla tu dinero día a día", "Keep control of your money, day by day")}
          </p>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            {t("Controla tu dinero día a día y mantente dentro de tu plan.", "Keep control of your money, day by day, and stay within your plan.")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:w-auto">
          <div className="flex min-w-0 rounded-lg border border-border bg-card p-1 sm:w-80">
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
                onClick={() => {
                  setPeriod(p.id);
                  // Semana y Hoy son del mes en curso: si había un mes pasado abierto, volvemos a él.
                  if (p.id !== "month" && !isCurrentMonth) {
                    setViewKey(null);
                    setHoverDay(null);
                  }
                }}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  period === p.id ? "bg-positive text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(p.es, p.en)}
              </button>
            ))}
          </div>

          {/* Selector de mes: revisa los meses pasados; elegir uno abre la vista Mensual. */}
          <Select
            value={activeKey}
            onValueChange={(v) => {
              setViewKey(v);
              setPeriod("month");
              setHoverDay(null);
            }}
          >
            <SelectTrigger className="h-10 w-auto shrink-0 gap-1.5 rounded-full border-border bg-card/60 px-4 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-tour-expense-target="add" className="hidden h-11 shrink-0 px-5 sm:flex sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t("Añadir gasto", "Add expense")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[21rem] p-2">
            <div className="px-4 pb-2 pt-3 text-center">
              <p className="text-[22px] font-bold tracking-tight text-foreground">
                {t("Trackea tus gastos diarios", "Track your spending")}
              </p>
              <p className="mt-0.5 text-[15px] font-medium text-muted-foreground">
                {t("Elige cómo quieres agregarlos", "Choose how you want to add them")}
              </p>
            </div>
            <DropdownMenuItem className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-2 text-[15px] font-medium" onSelect={() => setManualOpen(true)}>
              <PencilLine className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
              {t("Manual", "Manual")}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-2 text-[15px] font-medium" onSelect={() => (recording ? stopRecording() : startRecording())}>
              {recording ? <Square className="h-6 w-6 shrink-0 text-negative" strokeWidth={1.9} /> : <Mic className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />}
              {recording ? t("Detener", "Stop") : t("Por voz", "By voice")}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-2 text-[15px] font-medium" onSelect={() => camRef.current?.click()}>
              <Camera className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
              {t("Tomar foto (super, compras, etc)", "Take photo (groceries, shopping, etc)")}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-2 text-[15px] font-medium" onSelect={() => setPhotoPickerOpen(true)}>
              <Upload className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
              {t("Fotos o estados de cuentas", "Photos or bank statements")}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-2 text-[15px] font-medium" onSelect={openNewRecurring}>
              <Repeat className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
              {t("Recurrente", "Recurring")}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-2 text-[15px] font-medium" onSelect={() => setSharedOpen(true)}>
              <Users className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.9} />
              {t("Gasto compartido", "Shared expense")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ManualExpenseDialog
        categories={categoryNames}
        onAddCategory={(name) => categories.add(name)}
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSaved={() => {
          setPeriod("month");
          window.setTimeout(() => latestExpensesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
        }}
      />
      <SharedExpenseDialog
        open={sharedOpen}
        onOpenChange={setSharedOpen}
        onSaved={() => {
          setPeriod("month");
          window.setTimeout(() => latestExpensesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
        }}
      />

      <Dialog
        open={voiceDialogOpen}
        onOpenChange={(open) => {
          if (!open && recording) cancelRecording();
          if (!open && !recording && busy !== "voice") setVoiceDialogOpen(false);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border-negative/25 bg-card p-0 text-center shadow-2xl sm:hidden">
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
          <div className="rounded-2xl border border-border bg-card px-5 pt-5 pb-8 sm:p-8">
            <div data-tour-expense-target="plan" className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 flex-1">
                <h3 data-tour-expense-target="plan-title" className="min-w-0 text-lg font-semibold max-md:whitespace-normal max-md:leading-snug sm:text-xl lg:text-2xl lg:whitespace-nowrap">
                  {t("Tu plan de gasto mensual", "Your monthly spending plan")}
                </h3>
                <p className="hidden max-md:block max-md:mt-0.5 max-md:text-xs max-md:leading-snug max-md:text-muted-foreground">
                  {t("Crea o edita una categoría a tu plan", "Create or edit a category in your plan")}
                </p>
              </div>
              {period === "month" && (
                <>
                  <button
                    type="button"
                    onClick={() => setPlanOpen(true)}
                    aria-label={t("Editar el plan", "Edit plan")}
                    data-tour-expense-target="plan-pencil"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-positive text-background transition-colors hover:bg-positive/85 md:hidden"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => setPlanOpen(true)} aria-label={t("Editar el plan", "Edit plan")} data-tour-expense-target="plan-pencil" className="hidden shrink-0 text-muted-foreground transition-colors hover:text-foreground md:block">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t("Agrega o edita una categoría", "Add or edit a category")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>

            <div className="mt-8 md:hidden">
              <p className="numeric whitespace-nowrap text-4xl font-bold leading-none">
                {fmt(spent)}{" "}
                <span className="text-xl font-semibold text-muted-foreground">
                  {t("de", "of")} {fmt(periodTarget)}
                </span>
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border/40">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-500", pct > 100 ? "bg-negative" : "bg-positive")}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className={cn("numeric shrink-0 text-lg font-bold", pct > 100 ? "text-negative" : "text-positive")}>
                  {pct.toFixed(0)}%
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={focusOverspent}
              aria-label={t("Ver categorías donde te excediste", "See categories where you overspent")}
              className="mt-4 flex w-full cursor-pointer items-center gap-3 py-1 text-left md:hidden"
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  isOnPace ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative",
                )}
              >
                {isOnPace ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className={cn("text-base font-semibold leading-snug", isOnPace ? "text-positive" : "text-negative")}>
                  {!isOnPace
                    ? t(`Vas ${fmt(paceAmount)} por encima`, `You're ${fmt(paceAmount)} over`)
                    : t("Vas bien", "On track")}
                </p>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  {isOnPace
                    ? t("por debajo del ritmo esperado.", "below the expected pace.")
                    : t("del ritmo esperado.", "of the expected pace.")}
                </p>
              </div>
            </button>

             <div className="mt-3 hidden items-center gap-6 lg:flex">
                <div className="grid min-w-0 shrink-0 grid-cols-[auto_auto_auto] items-baseline gap-x-6 gap-y-2">
                  <p className="text-sm text-muted-foreground">{t("Gasto objetivo mensual", "Monthly spending target")}</p>
                  <span aria-hidden className="-my-1 row-span-2 self-stretch border-l border-border/70" />
                  <p className="text-sm text-muted-foreground">{t("Gastado a la fecha", "Spent to date")}</p>
                  <div data-tour-expense-target="budget" className="inline-flex min-w-0 items-baseline gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-1.5 transition-colors focus-within:border-positive/60">
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

            <div className="mt-3 hidden grid-cols-3 gap-2 border-t border-border/60 pt-3 md:grid">
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
                  {isCurrentMonth || period !== "month" ? (
                    <>
                      <p className="numeric text-base font-bold leading-tight text-positive sm:text-xl">{daysLeft}</p>
                      <p className="text-xs text-muted-foreground">{t("días quedan", "days left")}</p>
                    </>
                  ) : (
                    <>
                      <p className="numeric text-base font-bold leading-tight text-positive sm:text-xl">{periodDays}</p>
                      <p className="text-xs text-muted-foreground">{t("días del mes", "days of the month")}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1 max-sm:items-center max-sm:border-l max-sm:border-border/60 max-sm:pl-3 max-sm:text-center sm:flex-row sm:items-center sm:gap-2.5 md:border-l md:border-border/60 md:px-4">
                <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/10 text-positive sm:grid"><TrendingUp className="h-4 w-4" /></span>
                <div className="min-w-0">
                  {isCurrentMonth || period !== "month" ? (
                    <>
                      <p className="numeric whitespace-nowrap text-base font-bold leading-tight text-positive sm:text-xl">{fmt(perDay)}/{t("día", "day")}</p>
                      <p className="text-xs text-muted-foreground">{t("para el plan", "to stay on plan")}</p>
                    </>
                  ) : (
                    <>
                      <p className="numeric whitespace-nowrap text-base font-bold leading-tight text-positive sm:text-xl">{fmt(periodDays > 0 ? variableSpend / periodDays : 0)}/{t("día", "day")}</p>
                      <p className="text-xs text-muted-foreground">{t("de media gastada", "spent on average")}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* Galería / archivos del teléfono (incluye capturas de pantalla) */}
          <input
            ref={fileRef}
            type="file"
            /* En móvil solo imágenes: así Android ofrece Google Fotos / Galería
               directamente en vez del selector genérico de archivos. */
            accept={isMobile ? "image/*" : "image/*,application/pdf"}
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void sendReceiptFiles(files);
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
          {/* Archivos (incluye PDF) */}
          <input
            ref={docsRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void sendReceiptFiles(files);
            }}
          />

          {/* Selector de origen de la foto en móvil: cámara arriba y 3 opciones abajo */}
          <Dialog open={photoPickerOpen} onOpenChange={setPhotoPickerOpen}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl p-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{t("Añadir recibo", "Add receipt")}</DialogTitle>
                <DialogDescription className="text-sm">
                  {t("Elige cómo subirlo", "Choose how to upload it")}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPickerOpen(false);
                    camRef.current?.click();
                  }}
                  className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-positive/30 bg-positive/10 px-4 text-left outline-none transition-transform focus-visible:ring-2 focus-visible:ring-positive/50 active:scale-[0.98]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-positive/20">
                    <Camera className="h-6 w-6 text-positive" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold">{t("Tomar foto", "Take photo")}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t("Apunta el recibo y listo", "Point at the receipt")}
                    </span>
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { Icon: GooglePhotosIcon, es: "Imágenes", en: "Images", pick: () => fileRef.current?.click() },
                      { Icon: FileSpreadsheet, es: "Tus estados de cuenta", en: "Your bank statements", pick: () => setStatementOpen(true) },
                      { Icon: FolderIcon, es: "Archivos", en: "Files", pick: () => docsRef.current?.click() },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.es}
                      type="button"
                      onClick={() => {
                        setPhotoPickerOpen(false);
                        o.pick();
                      }}
                      className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/40 px-1.5 py-3 text-center outline-none transition-transform focus-visible:ring-2 focus-visible:ring-positive/50 active:scale-[0.97]"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-white/10">
                        <o.Icon className="h-7 w-7" />
                      </span>
                      <span className="text-xs font-semibold leading-tight">{t(o.es, o.en)}</span>
                    </button>
                  ))}
                </div>

                <p className="pt-1 text-center text-[11px] leading-snug text-muted-foreground">
                  {t(
                    "Puedes seleccionar varios gastos al mismo tiempo",
                    "You can select several expenses at the same time",
                  )}
                </p>
              </div>
            </DialogContent>
          </Dialog>
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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
              <div data-tour-expense-target="chart" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
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
                            const isToday = isCurrentMonth && i + 1 === todayDay;
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
                                      : todayDay === 0
                                        ? "fill-emerald-500/80"
                                        : i + 1 <= todayDay
                                          ? "fill-emerald-500/80"
                                          : "fill-muted-foreground/25",
                                )}
                              />
                            );
                          })}
                          {todayDay > 0 && (
                          <line
                            x1={left + (todayDay - 0.5) * step}
                            x2={left + (todayDay - 0.5) * step}
                            y1={top}
                            y2={top + plotH}
                            className="stroke-emerald-400"
                            strokeWidth="1.5"
                          />
                          )}
                          {todayDay > 0 && (
                          <text
                            x={left + (todayDay - 0.5) * step}
                            y={top - 6}
                            textAnchor="middle"
                            className="fill-foreground text-[14px] sm:text-[11px] font-medium"
                          >
                            {t("Hoy", "Today")}
                          </text>
                          )}
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
                              {format(new Date(viewDate.getFullYear(), viewDate.getMonth(), active + 1), "d MMM", { locale })}
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
                  <button
                    type="button"
                    onClick={() => setFixedOpen((v) => !v)}
                    aria-expanded={fixedOpen}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                  >
                    <h3 className="text-base font-semibold">{t("Gastos fijos (Próximos pagos)", "Fixed expenses (Upcoming payments)")}</h3>
                    <span className="flex shrink-0 items-center gap-2">
                      <p className={cn("numeric hidden font-semibold text-muted-foreground max-md:block", fixedOpen && "max-md:hidden")}>
                        {upcoming.length > 0 ? fmt(upcoming.reduce((s, i) => s + i.amount, 0)) : null}
                      </p>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform max-md:block md:hidden", fixedOpen && "rotate-180")} />
                    </span>
                  </button>
                  <div className="hidden md:block">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={openNewRecurring}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={t("Agrega solo gastos recurrentes", "Add recurring expenses only")}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {t("Agrega solo gastos recurrentes", "Add recurring expenses only")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {upcoming.length === 0 ? (
                  <p className={cn("mt-4 text-sm text-muted-foreground", !fixedOpen && "max-md:hidden")}>
                    {t("Añade gastos recurrentes para verlos aquí.", "Add recurring expenses to see them here.")}
                  </p>
                ) : (
                  <>
                  <ul className={cn("mt-4 space-y-3.5", !fixedOpen && "max-md:hidden")}>
                    {upcoming.map((i, idx) => {
                      const emoji = i.name.match(/^\p{Extended_Pictographic}+/u)?.[0];
                      const colors = [
                        "bg-emerald-500/15 text-emerald-300",
                        "bg-sky-500/15 text-sky-300",
                        "bg-violet-500/15 text-violet-300",
                        "bg-amber-500/15 text-amber-300",
                        "bg-rose-500/15 text-rose-300",
                      ];
                      const isApps = i.planId
                        ? budgets.lines.some((l) => l.id === i.planId && isAppsPlanLine(l)) || i.planId === "apps"
                        : isAppsName(i.name);
                      return (
                        <Fragment key={i.id}>
                        <li className="flex items-center gap-3 sm:gap-4">
                          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-base sm:h-12 sm:w-12 sm:text-lg", colors[idx % colors.length])}>
                            {emoji ?? <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />}
                          </span>
                          <div
                            className={cn("min-w-0 flex-1", isApps && "cursor-pointer")}
                            onClick={isApps ? () => setAppsExpanded((v) => !v) : undefined}
                          >
                            <p className="flex items-center gap-1.5 truncate text-sm leading-5 sm:text-base sm:leading-6">
                              <span className="truncate">{emoji ? i.name.slice(emoji.length).trim() : i.name}</span>
                              {isApps && (
                                <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", appsExpanded && "rotate-180")} />
                              )}
                            </p>
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="min-w-0 truncate text-[0.6875rem] leading-4 text-muted-foreground sm:text-xs sm:leading-5 sm:whitespace-nowrap">
                                {isApps && displaySubs.length
                                  ? t(`${displaySubs.length} apps · próximo cobro ${format(i.next, "d MMM", { locale })}`, `${displaySubs.length} apps · next charge ${format(i.next, "d MMM", { locale })}`)
                                  : format(i.next, "d MMM", { locale })}
                              </p>
                              <span className="numeric shrink-0 text-sm font-semibold sm:text-base">{fmt(i.amount)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => (isApps ? openSubsEditor() : i.planId ? setPlanOpen(true) : openEditRecurring(i))}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={isApps ? t("Editar suscripciones", "Edit subscriptions") : t("Editar gasto recurrente", "Edit recurring expense")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </li>
                        {isApps && appsExpanded && !displaySubs.length && (
                          <li className="pl-6 text-xs text-muted-foreground sm:pl-9">
                            <button type="button" onClick={openSubsEditor} className="font-medium text-primary hover:underline">
                              {t("Desglosa tus apps", "Break down your apps")}
                            </button>
                          </li>
                        )}
                        {isApps && appsExpanded &&
                          [...displaySubs]
                            .sort((a, b) => a.day - b.day)
                            .map((a) => (
                              <li key={a.id} className="flex items-center gap-3 pl-6 sm:gap-4 sm:pl-9">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/50 text-sm sm:h-10 sm:w-10 sm:text-base">{a.emoji}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm leading-5 sm:text-base sm:leading-6">{a.name}</p>
                                  <div className="flex items-baseline justify-between gap-3">
                                    <p className="min-w-0 truncate text-[0.6875rem] leading-4 text-muted-foreground sm:text-xs sm:leading-5 sm:whitespace-nowrap">
                                      {format(nextChargeDate(a.day), "d MMM", { locale })}
                                    </p>
                                    <span className="numeric shrink-0 text-sm text-muted-foreground sm:text-base">{fmt(a.amount)}</span>
                                  </div>
                                </div>
                                <span className="w-7 shrink-0" />
                              </li>
                            ))}
                        </Fragment>
                      );
                    })}
                  </ul>
                  {/* Total de los gastos fijos listados (coincide con lo mostrado arriba). */}
                  <div className={cn("mt-4 flex items-center justify-between gap-3 border-t border-border/60 pl-[3.25rem] pr-10 pt-3.5 sm:pl-14", !fixedOpen && "max-md:hidden")}>
                    <p className="text-sm font-semibold sm:text-[0.9375rem]">{t("Total gastos fijos", "Total fixed expenses")}</p>
                    <p className="numeric text-sm font-semibold sm:text-[0.9375rem]">
                      {fmt(upcoming.reduce((s, i) => s + i.amount, 0))}
                    </p>
                  </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* En escritorio, Últimos gastos va al lado de Gastos por categoría. */}
          <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          {rows.length > 0 && (
            <div
              ref={categoryCardRef}
              className="min-w-0 scroll-mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{t("Gastos por categoría", "Spending by category")}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {t("Gastos variables mensuales", "Monthly variable expenses")}
                  </p>
                </div>

                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setPlanOpen(true)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={t("Editar plan de gastos", "Edit spending plan")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t("Agrega o edita una categoría", "Add or edit a category")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ul className="mt-4 space-y-3.5">
                 {[...visibleRows]
                   .sort((a, b) => b.pct - a.pct)
                   .map((r) => {
                   const expandedCat = expandedCategory === r.id;
                   return (
                     <Fragment key={r.id}>
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
                           "grid grid-cols-[2.25rem_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 sm:flex sm:gap-3",
                          r.items.length > 0 && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                        aria-expanded={r.items.length > 0 ? expandedCat : undefined}
                      >
                        <span
                          className={cn(
                             "row-span-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-base sm:h-10 sm:w-10",
                            r.planned > 0 && r.actual > r.planned ? "bg-negative/20" : "bg-positive/15",
                          )}
                        >
                          {r.emoji}
                        </span>
                         <div className="row-span-2 min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
                          <div className="min-w-0 lg:w-44 lg:shrink-0">
                             <p className="text-sm leading-5 [overflow-wrap:anywhere]">{r.name}</p>
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
                             "numeric col-start-3 row-start-1 w-11 shrink-0 text-right text-sm sm:w-12",
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
                              setAnalysisCat(r.id);
                            }}
                             className="col-span-2 col-start-3 row-start-2 flex h-7 shrink-0 items-center justify-self-end gap-1.5 rounded-full px-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={t(`Ver análisis de ${r.name}`, `View ${r.name} analysis`)}
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="numeric rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-3">
                              {r.items.length} {t("movs.", "txs")}
                            </span>
                          </button>
                        )}
                        {r.items.length > 0 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedCategory(expandedCat ? null : r.id);
                            }}
                             className="col-start-4 row-start-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                                 <p className="flex min-w-0 items-center gap-1.5 text-sm">
                                   <span className="truncate">{it.label}</span>
                                   {parseShared(expenseTx.find((x) => x.id === it.key)?.description) && <Users className="h-3.5 w-3.5 shrink-0 text-positive" aria-label={t("Compartido", "Shared")} />}
                                 </p>
                                {it.date && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {format(parseISO(it.date), "d MMM", { locale })}
                                     {parseShared(expenseTx.find((x) => x.id === it.key)?.description)?.name && ` · ${t("con", "with")} ${parseShared(expenseTx.find((x) => x.id === it.key)?.description)?.name}`}
                                  </p>
                                )}
                              </div>
                              <span className="numeric shrink-0 text-sm font-medium">{fmt(it.amount)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const tx = expenseTx.find((x) => x.id === it.key);
                                  if (tx) {
                                    openEditTx(tx as Tx);
                                    return;
                                  }
                                  const fixedItem = expenseFixedItems.find((i) => i.id === it.key);
                                  if (fixedItem) {
                                    if ((fixedItem as { planId?: string }).planId) setPlanOpen(true);
                                    else openEditRecurring(fixedItem);
                                  }
                                }}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={t("Editar gasto", "Edit expense")}
                              >
                                <Pencil className="h-3.5 w-3.5" />
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
              {/* Total: suma exactamente las categorías visibles de la lista. */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pl-12 pt-3.5 sm:pl-[3.25rem]">
                <p className="text-sm font-semibold">{t("Total", "Total")}</p>
                <p className="numeric text-sm font-semibold">{fmt(visibleRows.reduce((s, r) => s + r.actual, 0))}</p>
              </div>
            </div>

          )}

          {/* Análisis del rubro: misma gráfica y detalle que en Análisis de gastos. */}
          {analysisCat && (() => {
            const row = rows.find((r) => r.id === analysisCat);
            if (!row) return null;
            const txById = new Map(expenseTx.map((tx) => [tx.id, tx]));
            const items = row.items.map((it) => txById.get(it.key) ?? ({
              id: it.key,
              amount: -Math.abs(it.amount),
              merchant: it.label,
              tx_date: it.date ?? null,
            } as Tx));
            const previousItems = transactions.filter((tx) => {
              if (tx.amount >= 0 || !tx.tx_date) return false;
              const date = parseISO(tx.tx_date);
              if (date < subDays(periodStart, periodDays) || date >= periodStart) return false;
              if (isSavingsName(`${tx.merchant} ${tx.description ?? ""}`)) return false;
              const category = tx.description?.startsWith(SHARED_PREFIX) && tx.category ? tx.category : categorizeTx(tx, categories.rules);
              return (catOverrides[tx.id] ?? match(category) ?? "others") === row.id;
            });
            return (
              <CategoryDetailDialog
                open={Boolean(analysisCat)}
                onOpenChange={(v) => !v && setAnalysisCat(null)}
                name={row.name}
                isSupermarket={row.id === "groceries"}
                items={items}
                previousItems={previousItems}
                amount={row.actual}
                prevAmount={prevByCategory.get(row.id) ?? 0}
                periodTotal={rows.reduce((s, r) => s + r.actual, 0)}
                days={periodDays}
                fmt={fmt}
                fmtCompact={fmtCompact}
              />
            );
          })()}


        <div ref={latestExpensesRef} id="latest-expenses" className="min-w-0 scroll-mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold">{t("Últimos gastos", "Latest expenses")}</h3>
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
            {([
              { key: "all", label: t("Todos", "All") },
              { key: "mine", label: t("Míos", "Mine") },
              { key: "shared", label: t("Compartidos", "Shared") },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={latestTab === tab.key}
                onClick={() => setLatestTab(tab.key)}
                className={cn(
                  "flex-1 rounded-full px-2 py-1.5 text-sm font-medium transition",
                  latestTab === tab.key ? "bg-positive text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {latestTab === "shared" && (
            <div className="mt-4">
              <div className="space-y-3">
                {sharedBalances.map((b) => {
                  const isOwed = b.balance > 0.005;
                  const iOwe = b.balance < -0.005;
                  return (
                    <div key={b.id} className="min-w-0 rounded-lg border border-border p-4 sm:p-5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex shrink-0 -space-x-2.5" aria-hidden="true">
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-positive/20 text-base font-semibold ring-2 ring-card">{initialsOf(myName)}</span>
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-base font-semibold ring-2 ring-card">{initialsOf(b.name)}</span>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold leading-snug">{firstNameOf(b.name)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{b.count} {t("gastos", "expenses")}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSettlePartner({ name: firstNameOf(b.name), balance: b.balance })}
                          className="h-10 shrink-0 rounded-full bg-transparent px-2.5 text-xs shadow-none sm:px-4 sm:text-sm"
                        >
                          {t("Saldar cuenta", "Settle up")}
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="mt-5 grid grid-cols-3 items-end gap-2 border-t border-border/60 pt-4 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-xs leading-5 text-muted-foreground">
                            {isOwed ? t(`${firstNameOf(b.name)} te debe`, `${firstNameOf(b.name)} owes you`) : iOwe ? t(`Le debes a ${firstNameOf(b.name)}`, `You owe ${firstNameOf(b.name)}`) : t("En paz", "Even")}
                          </p>
                          <p className={cn("numeric whitespace-nowrap text-lg font-semibold", isOwed && "text-positive")}>{fmt(Math.abs(b.balance))}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs leading-5 text-muted-foreground">{t("Gastado juntos", "Spent together")}</p>
                          <p className="numeric whitespace-nowrap text-lg font-semibold">{fmt(b.together)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs leading-5 text-muted-foreground">{t("Tu parte", "Your share")}</p>
                          <p className="numeric whitespace-nowrap text-lg font-semibold">{fmt(b.myShare)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(() => {
            const shown = latestTab === "mine"
              ? expenseTx.filter((x) => !parseShared(x.description))
              : latestTab === "shared"
                ? expenseTx.filter((x) => Boolean(parseShared(x.description)))
                : expenseTx;
            return shown.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {latestTab === "shared"
                  ? t("Aún no compartes gastos en este periodo.", "No shared expenses logged in this period yet.")
                  : t("Aún no registras gastos en este periodo.", "No expenses logged in this period yet.")}
              </p>
            ) : (
              <>
                {/* Mismo número de líneas que las categorías visibles; "Ver más" abre el popup con todo. */}
                <ul className="mt-4 divide-y divide-border/60">
                  {shown.slice(0, Math.max(visibleRows.length, 6)).map(renderLatestTx)}
                </ul>
                {shown.length > Math.max(visibleRows.length, 6) && (
                  <button
                    type="button"
                    onClick={() => setLatestOpen(true)}
                    className="mt-3 w-full rounded-full border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {t("Ver más", "Show more")}
                  </button>
                )}
              </>
            );
          })()}
        </div>
          </div>
      </div>

      <Dialog open={latestOpen} onOpenChange={setLatestOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{t("Últimos gastos", "Latest expenses")}</DialogTitle>
            <DialogDescription>
              {t("Todo lo que has registrado en este periodo.", "Everything you have logged in this period.")}
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border/60">
            {expenseTx.map(renderLatestTx)}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(settlePartner)} onOpenChange={(v) => !v && setSettlePartner(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{settlePartner ? t(`Saldar con ${settlePartner.name}`, `Settle with ${settlePartner.name}`) : ""}</DialogTitle>
            <DialogDescription className="text-center">
              {settlePartner
                ? settlePartner.balance > 0.005
                  ? t(`${settlePartner.name} te debe`, `${settlePartner.name} owes you`)
                  : settlePartner.balance < -0.005
                    ? t(`Le debes a ${settlePartner.name}`, `You owe ${settlePartner.name}`)
                    : t("Están en paz", "You're all even")
                : ""}
            </DialogDescription>
          </DialogHeader>
          {settlePartner && (
            <div className="grid gap-4">
              <div className={cn("rounded-2xl border border-border bg-muted/30 p-4 text-center", settlePartner.balance > 0.005 && "border-positive/40 bg-positive/5")}>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("Balance", "Balance")}</p>
                <p className={cn("numeric mt-1 text-3xl font-semibold", settlePartner.balance > 0.005 && "text-positive")}>{fmt(Math.abs(settlePartner.balance))}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={copySettleText}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {t("Copiar", "Copy")}
                </Button>
                <Button type="button" className="bg-positive text-background hover:bg-positive/90" onClick={() => { if (settleWa) window.open(settleWa, "_blank", "noopener"); }}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("WhatsApp", "WhatsApp")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Subir tus estados de cuenta", "Upload your bank statements")}</DialogTitle>
            <DialogDescription>
              {t(
                "Carga tu estado de cuenta y la IA extrae tus gastos automáticamente.",
                "Upload your bank statement and AI extracts your expenses automatically.",
              )}
            </DialogDescription>
          </DialogHeader>
          <StatementImporter showHeader={false} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !saving) setDraft(null); }}>
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
                <Label>{draft.partner ? `${t("Mi parte", "My share")} (${currency})` : `${t("Monto", "Amount")} (${currency})`}</Label>
                {draft.partner ? (
                  <NumberInput value={draftShare(draft)} onChange={(v) => setDraft({ ...draft, myShare: Math.min(draft.amount, v || 0) })} min={0} format />
                ) : (
                  <NumberInput value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v || 0 })} min={0} format />
                )}
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
              {(draft.source === "voice" || draft.source === "receipt") && (
                <div className="grid gap-3 border-t border-border pt-4">
                  <Label>{t("Compartido", "Shared")}</Label>
                  <div className="flex flex-wrap items-start gap-4">
                    {[...(draft.partner && !editKnownPartners.some((p) => p.id === draft.partner?.id) ? [draft.partner] : []), ...editKnownPartners].map((person) => (
                      <Button key={person.id} type="button" variant="ghost" className="flex h-auto max-w-16 flex-col items-center gap-1 p-0 font-normal hover:bg-transparent" onClick={() => setDraft({ ...draft, partner: draft.partner?.id === person.id ? null : person })} aria-pressed={draft.partner?.id === person.id}>
                        <span className={cn("relative grid h-12 w-12 place-items-center rounded-full bg-muted text-sm font-semibold", draft.partner?.id === person.id && "ring-2 ring-positive")}>
                          {editInitials(person.name)}
                          {draft.partner?.id === person.id && <Check className="absolute -left-1 -top-1 h-4 w-4 rounded-full bg-positive p-0.5 text-background" />}
                        </span>
                        <span className="w-full truncate text-center text-xs text-muted-foreground">{person.name.split(" ")[0]}</span>
                      </Button>
                    ))}
                    <Button type="button" variant="ghost" className="flex h-auto w-12 flex-col items-center gap-1 p-0 font-normal hover:bg-transparent" onClick={() => setDraftInviting((value) => !value)} aria-label={t("Añadir persona", "Add person")}>
                      <span className="grid h-12 w-12 place-items-center rounded-full border border-border text-muted-foreground"><Plus className="h-5 w-5" /></span>
                      <span className="w-full text-center text-xs text-muted-foreground">{t("Añadir", "Add")}</span>
                    </Button>
                  </div>
                  {draftInviting && (
                    <div className="flex gap-2">
                      <Input type="email" value={draftEmail} onChange={(e) => { setDraftEmail(e.target.value); setDraftInvitePending(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void findDraftPartner(); } }} placeholder={t("Correo de la otra persona", "Other person's email")} aria-label={t("Correo de la otra persona", "Other person's email")} />
                      <Button type="button" variant="outline" onClick={findDraftPartner} disabled={draftLooking || !normalizeValidEmail(draftEmail)}>
                        {draftLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Añadir", "Add")}
                      </Button>
                    </div>
                  )}
                  {draftInviting && draftInvitePending && <InviteShareActions email={draftInvitePending} onClose={() => setDraftInvitePending(null)} />}
                  {draft.partner && (
                    <p className="text-xs text-muted-foreground">
                      {t(
                        `Total ${fmt(draft.amount)} · ${draftSplit(draft)} · ${draft.partner.name.split(" ")[0]} paga ${fmt(draft.amount - draftShare(draft))}`,
                        `Total ${fmt(draft.amount)} · ${draftSplit(draft)} · ${draft.partner.name.split(" ")[0]} pays ${fmt(draft.amount - draftShare(draft))}`,
                      )}
                    </p>
                  )}
                </div>
              )}
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

      {/* Desglose de «Suscripciones / apps»: nombre, monto y día de cobro de cada app. */}
      <Dialog open={subsOpen} onOpenChange={setSubsOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Suscripciones / apps", "Subscriptions / apps")}</DialogTitle>
            <DialogDescription>
              {t("Cada app con su monto y día de cobro; el total se suma solo.", "Each app with its amount and billing day; the total adds up automatically.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {subsDraft.map((a, idx) => (
              <div key={a.id} className="flex items-end gap-2">
                <div className="grid min-w-0 flex-1 gap-1.5">
                  {idx === 0 && <Label>{t("App", "App")}</Label>}
                  <Input
                    value={a.name}
                    onChange={(e) => setSubsDraft((d) => d.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)))}
                    placeholder={t("Nombre de la app", "App name")}
                    aria-label={t("Nombre de la app", "App name")}
                  />
                </div>
                <div className="grid w-24 shrink-0 gap-1.5">
                  {idx === 0 && <Label>{`${t("Monto", "Amount")} (${currency})`}</Label>}
                  <NumberInput
                    value={a.amount}
                    onChange={(v) => setSubsDraft((d) => d.map((x) => (x.id === a.id ? { ...x, amount: v || 0 } : x)))}
                    min={0}
                    aria-label={t("Monto mensual", "Monthly amount")}
                  />
                </div>
                <div className="grid w-20 shrink-0 gap-1.5">
                  {idx === 0 && <Label>{t("Día", "Day")}</Label>}
                  <Select
                    value={String(a.day)}
                    onValueChange={(v) => setSubsDraft((d) => d.map((x) => (x.id === a.id ? { ...x, day: Number(v) || 1 } : x)))}
                  >
                    <SelectTrigger aria-label={t("Día de cobro", "Billing day")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 31 }, (_, d) => d + 1).map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => setSubsDraft((d) => d.filter((x) => x.id !== a.id))}
                  className="grid h-10 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-negative"
                  aria-label={`${t("Eliminar", "Delete")} ${a.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubsDraft((d) => [...d, { id: crypto.randomUUID(), name: "", emoji: "📱", amount: 0, day: 1 }])}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("Añadir otra", "Add another")}
            </Button>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("Total apps", "Total apps")}</span>
              <span className="numeric font-semibold">{fmt(subsDraft.reduce((s, a) => s + (Number(a.amount) || 0), 0))}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onSaveSubs}>{t("Guardar", "Save")}</Button>
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
            <div className="grid gap-1.5">
              <Label>{t("Compartido", "Shared")}</Label>
              {editSharedWith ? (
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="relative grid h-14 w-14 place-items-center rounded-full bg-positive/20 text-lg font-semibold ring-2 ring-positive">
                      {editInitials(editSharedWith)}
                      <Check className="absolute -left-1 -top-1 h-5 w-5 rounded-full bg-positive p-0.5 text-background" />
                    </span>
                    <span className="max-w-28 break-words text-center text-xs leading-tight">{editSharedWith}</span>
                  </div>
                  <button type="button" onClick={() => setEditSharedWith(null)} className="flex flex-col items-center gap-1">
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-border text-muted-foreground">
                      <X className="h-5 w-5" />
                    </span>
                    <span className="max-w-28 break-words text-center text-xs leading-tight text-muted-foreground">
                      {t("Solo mío", "Just mine")}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-start gap-4">
                    {[
                      ...(editSharePartner && !editKnownPartners.some((k) => k.id === editSharePartner.id) ? [editSharePartner] : []),
                      ...editKnownPartners,
                    ].map((p) => {
                      const active = editSharePartner?.id === p.id;
                      return (
                        <button key={p.id} type="button" onClick={() => setEditSharePartner(active ? null : p)} className="flex flex-col items-center gap-1">
                          <span className={cn("relative grid h-14 w-14 place-items-center rounded-full text-lg font-semibold", active ? "bg-positive/20 ring-2 ring-positive" : "bg-muted")}>
                            {editInitials(p.name)}
                            {active && <Check className="absolute -left-1 -top-1 h-5 w-5 rounded-full bg-positive p-0.5 text-background" />}
                          </span>
                          <span className="max-w-28 break-words text-center text-xs leading-tight">{p.name}</span>
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => setEditInviting((v) => !v)} className="flex flex-col items-center gap-1">
                      <span className="grid h-14 w-14 place-items-center rounded-full border border-border text-muted-foreground">
                        <Plus className="h-5 w-5" />
                      </span>
                      <span className="text-xs text-muted-foreground">{t("Añadir", "Add")}</span>
                    </button>
                  </div>
                  {editInviting && (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        type="email"
                        value={editInviteEmail}
                        onChange={(e) => { setEditInviteEmail(e.target.value); setEditInvitePending(null); }}
                        onKeyDown={(e) => e.key === "Enter" && void findEditPartner()}
                        placeholder={t("Correo de alguien nuevo", "Someone new's email")}
                      />
                      <Button type="button" onClick={findEditPartner} disabled={editLooking || !normalizeValidEmail(editInviteEmail)}>
                        {editLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Añadir", "Add")}
                      </Button>
                    </div>
                  )}
                  {editInviting && editInvitePending && <InviteShareActions email={editInvitePending} onClose={() => setEditInvitePending(null)} />}
                </div>
              )}
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
        appSubs={displaySubs}
        onEditApps={() => {
          setPlanOpen(false);
          openSubsEditor();
        }}
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
