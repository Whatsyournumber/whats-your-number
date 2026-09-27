import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { supabase } from "@/integrations/supabase/client";
import { translateCategory } from "@/lib/i18n-data";
import { saveExpense } from "@/lib/manual-expense";
import { BASE_CATEGORIES } from "@/lib/categorize";
import { useCategories } from "@/hooks/use-categories";
import { notifySharedExpense } from "@/lib/shared-expense.functions";
import { InviteShareActions } from "@/components/invite-share-actions";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";

type Mode = "equal" | "percent" | "amount";
type Partner = { id: string; name: string };

/** Marca en la descripción del gasto para mostrarlo como compartido en el historial. */
export const SHARED_PREFIX = "shared:";
export function parseShared(description?: string | null) {
  if (!description?.startsWith(SHARED_PREFIX)) return null;
  const [split, name] = description.slice(SHARED_PREFIX.length).split("|");
  return { split: split ?? "", name: name ?? "" };
}

const modeLabel = (mode: Mode, myPct: number) =>
  mode === "equal" ? "50/50" : `${Math.round(myPct)}/${Math.round(100 - myPct)}`;

const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

export function SharedExpenseDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved?: () => void }) {
  const t = useT();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const budgets = useSpendBudgets();
  const queryClient = useQueryClient();
  const currency = (profile?.currency as string) || "USD";
  const myName = (profile?.full_name as string | undefined)?.split(" ")[0] || t("Yo", "Me");

  const custom = useCategories();
  const notify = useServerFn(notifySharedExpense);
  // Todas las categorías: base, las creadas por el usuario y las del plan.
  const categories = useMemo(
    () => [
      ...new Set([
        ...BASE_CATEGORIES,
        ...custom.rules.map((r) => r.name),
        ...(budgets.lines.map((l) => l.label?.trim()).filter(Boolean) as string[]),
      ]),
    ],
    [budgets.lines, custom.rules],
  );

  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [invitePending, setInvitePending] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("equal");
  const [myPct, setMyPct] = useState(50);
  const [myAmount, setMyAmount] = useState(0);
  const [payer, setPayer] = useState<"me" | "partner">("me");
  const [saving, setSaving] = useState(false);

  // Personas con las que ya compartiste gastos: quedan guardadas para reutilizarlas.
  const { data: knownPartners = [] } = useQuery({
    queryKey: ["shared-partners", user?.id],
    enabled: Boolean(user?.id) && open,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("shared_expense_participants")
        .select("user_id, display_name, created_at")
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      const seen = new Map<string, Partner>();
      for (const r of rows ?? []) if (!seen.has(r.user_id)) seen.set(r.user_id, { id: r.user_id, name: r.display_name || "?" });
      return [...seen.values()];
    },
  });
  const cat = category || categories[0] || "Otros";
  const mine = mode === "equal" ? total / 2 : mode === "percent" ? (total * myPct) / 100 : Math.min(myAmount, total);
  const theirs = Math.max(0, total - mine);
  const pct = total > 0 ? (mine / total) * 100 : 50;
  const fmt = (v: number) =>
    new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);

  const reset = () => {
    setTotal(0); setMerchant(""); setPartner(null); setMode("equal"); setMyPct(50); setMyAmount(0); setPayer("me");
  };

  async function findPartner() {
    if (!email.trim()) return;
    setLooking(true);
    const { data, error } = await supabase.rpc("find_user_by_email", { _email: email });
    setLooking(false);
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      toast.error(t("No encontramos a nadie con ese correo en la app", "No app user found with that email"));
      return;
    }
    setPartner({ id: row.id, name: (row.full_name as string) || email });
    setInviting(false);
    setEmail("");
  }

  async function onSave() {
    if (!user?.id) return;
    if (!total || total <= 0) { toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero")); return; }
    if (!partner) { toast.error(t("Elige con quién lo compartes", "Choose who you share it with")); return; }
    setSaving(true);
    try {
      const date = format(new Date(), "yyyy-MM-dd");
      const split = modeLabel(mode === "equal" ? "equal" : "percent", pct);
      const { data: expenseId, error } = await supabase.rpc("create_shared_expense", {
        _partner_id: partner.id,
        _payer_id: payer === "me" ? user.id : partner.id,
        _total: total,
        _currency: currency,
        _category: cat,
        _merchant: merchant.trim(),
        _tx_date: date,
        _split_mode: split,
        _creator_name: myName,
        _partner_name: partner.name,
        _creator_share: mine,
        _partner_share: theirs,
      });
      if (error) throw error;
      if (!expenseId) throw new Error(t("No se pudo crear el gasto compartido", "The shared expense could not be created"));
      // En tu presupuesto solo cuenta tu parte.
      await saveExpense({
        userId: user.id, date, category: cat, currency, amount: mine,
        merchant: merchant.trim() || translateCategory(cat, lang),
        description: `${SHARED_PREFIX}${split}|${partner.name}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["shared-partners"] });
      await notify({ data: { expenseId } });
      toast.success(t("Gasto compartido guardado", "Shared expense saved"), {
        description: t(`Tu parte: ${fmt(mine)} · ${partner.name} ya lo ve en su app`, `Your share: ${fmt(mine)} · ${partner.name} already sees it in the app`),
      });
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : ((e as { message?: string })?.message ?? String(e)));
    } finally {
      setSaving(false);
    }
  }

  const seg = (active: boolean) =>
    cn("flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
      active ? "border-positive bg-positive/15 text-foreground" : "border-border bg-muted/30 text-muted-foreground");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{t("Agregar gasto compartido", "Add shared expense")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("En tu plan solo cuenta tu parte", "Only your share counts in your plan")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput value={total} onChange={(v) => setTotal(v || 0)} min={0} format />
            <select
              value={cat}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((c) => <option key={c} value={c}>{translateCategory(c, lang)}</option>)}
            </select>
          </div>
          <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={t("Descripción (opcional)", "Description (optional)")} />

          <div className="grid gap-2">
            <p className="text-sm font-semibold">{t("¿Con quién?", "With whom?")}</p>
            <div className="flex flex-wrap items-start gap-4">
              {[...(partner && !knownPartners.some((k) => k.id === partner.id) ? [partner] : []), ...knownPartners].map((p) => {
                const active = partner?.id === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setPartner(active ? null : p)} className="flex flex-col items-center gap-1">
                    <span className={cn("relative grid h-14 w-14 place-items-center rounded-full text-lg font-semibold", active ? "bg-positive/20 ring-2 ring-positive" : "bg-muted")}>
                      {initials(p.name)}
                      {active && <Check className="absolute -left-1 -top-1 h-5 w-5 rounded-full bg-positive p-0.5 text-background" />}
                    </span>
                    <span className="max-w-28 break-words text-center text-xs leading-tight">{p.name}</span>
                  </button>
                );
              })}
              <button type="button" onClick={() => setInviting(true)} className="flex flex-col items-center gap-1">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-border text-muted-foreground">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-xs text-muted-foreground">{t("Invitar", "Invite")}</span>
              </button>
            </div>
            {inviting && (
              <div className="flex gap-2">
                <Input
                  autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void findPartner()}
                  placeholder={t("Correo de su cuenta en la app", "Their app account email")}
                />
                <Button type="button" onClick={findPartner} disabled={looking}>
                  {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Añadir", "Add")}
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-semibold">{t("¿Cómo dividirlo?", "How to split it?")}</p>
            <div className="flex gap-2">
              <button type="button" className={seg(mode === "equal")} onClick={() => setMode("equal")}>50 / 50</button>
              <button type="button" className={seg(mode === "percent")} onClick={() => setMode("percent")}>{t("Porcentaje", "Percent")}</button>
              <button type="button" className={seg(mode === "amount")} onClick={() => setMode("amount")}>{t("Cantidad", "Amount")}</button>
            </div>
            {mode === "percent" && (
              <label className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                {t("Tu porcentaje", "Your percent")}
                <div className="w-28"><NumberInput value={myPct} onChange={(v) => setMyPct(Math.min(100, Math.max(0, v || 0)))} min={0} /></div>
              </label>
            )}
            {mode === "amount" && (
              <label className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                {t("Tu parte", "Your share")}
                <div className="w-32"><NumberInput value={myAmount} onChange={(v) => setMyAmount(v || 0)} min={0} format /></div>
              </label>
            )}
          </div>

          <div className="grid gap-2 rounded-2xl border border-border p-3">
            <p className="text-sm text-muted-foreground">{t("Pagó", "Paid by")}</p>
            <div className="flex gap-2">
              <button type="button" className={seg(payer === "me")} onClick={() => setPayer("me")}>{t("Yo", "Me")}</button>
              <button type="button" className={seg(payer === "partner")} onClick={() => setPayer("partner")} disabled={!partner}>
                {partner?.name ?? t("La otra persona", "The other person")}
              </button>
            </div>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border">
            {[{ n: t("Tú pagas", "You pay"), v: mine, i: initials(myName) }, { n: `${partner?.name ?? t("Otra persona", "Other")} ${t("paga", "pays")}`, v: theirs, i: initials(partner?.name ?? "?") }].map((r) => (
              <div key={r.n} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold">{r.i}</span>
                <span className="flex-1 text-sm">{r.n}</span>
                <span className="numeric text-lg font-semibold">{fmt(r.v)}</span>
              </div>
            ))}
          </div>

          <Button onClick={onSave} disabled={saving} className="h-12 rounded-full bg-positive text-base font-semibold text-background hover:bg-positive/90">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Guardar gasto", "Save expense")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Gastos que otra persona compartió contigo y esperan tu confirmación. */
export function SharedExpenseInbox() {
  const t = useT();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["shared-inbox", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("shared_expense_participants")
        .select("id, share_amount, expense_id, shared_expenses(created_by, total, currency, category, merchant, tx_date, split_mode)")
        .eq("user_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      const withNames = await Promise.all(
        (rows ?? []).map(async (r) => {
          const { data: owner } = await supabase
            .from("shared_expense_participants")
            .select("display_name")
            .eq("expense_id", r.expense_id)
            .neq("user_id", user!.id)
            .limit(1)
            .maybeSingle();
          return { ...r, from: owner?.display_name ?? "" };
        }),
      );
      return withNames;
    },
  });

  if (!data.length) return null;

  async function respond(row: (typeof data)[number], accept: boolean) {
    if (!user?.id) return;
    setBusy(row.id);
    try {
      const exp = row.shared_expenses as unknown as { total: number; currency: string; category: string; merchant: string; tx_date: string; split_mode: string };
      if (accept) {
        const split = exp.split_mode.split("/").reverse().join("/");
        await saveExpense({
          userId: user.id, date: exp.tx_date, category: exp.category, currency: exp.currency,
          amount: Number(row.share_amount), merchant: exp.merchant || translateCategory(exp.category, lang),
          description: `${SHARED_PREFIX}${split}|${row.from}`,
        });
      }
      const { error } = await supabase.from("shared_expense_participants").update({ status: accept ? "accepted" : "declined" }).eq("id", row.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["shared-inbox"] });
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      toast.success(accept ? t("Añadido a tus gastos", "Added to your spending") : t("Gasto rechazado", "Expense declined"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : ((e as { message?: string })?.message ?? String(e)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-positive/40 bg-positive/5 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4 text-positive" />
        {t("Gastos compartidos contigo", "Expenses shared with you")}
      </p>
      <ul className="divide-y divide-border/50">
        {data.map((row) => {
          const exp = row.shared_expenses as unknown as { currency: string; category: string; merchant: string };
          const amount = new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { style: "currency", currency: exp.currency }).format(Number(row.share_amount));
          return (
            <li key={row.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{exp.merchant || translateCategory(exp.category, lang)}</p>
                <p className="text-[11px] text-muted-foreground">{row.from} · {t("tu parte", "your share")} {amount}</p>
              </div>
              <Button size="icon" variant="ghost" disabled={busy === row.id} onClick={() => respond(row, false)} aria-label={t("Rechazar", "Decline")}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" disabled={busy === row.id} onClick={() => respond(row, true)} className="bg-positive text-background hover:bg-positive/90">
                {t("Aceptar", "Accept")}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
