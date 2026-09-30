import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Check, ChevronDown, Loader2, PencilLine, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, useT } from "@/hooks/use-language";
import { useProfile } from "@/hooks/use-profile";
import { useSpendBudgets } from "@/hooks/use-spend-budgets";
import { supabase } from "@/integrations/supabase/client";
import { InviteShareActions } from "@/components/invite-share-actions";
import { normalizeValidEmail } from "@/lib/email-validation";
import { notifySharedExpense } from "@/lib/shared-expense.functions";
import { translateCategory } from "@/lib/i18n-data";
import { cn } from "@/lib/utils";

/** Contenedor lógico para los gastos que el usuario escribe a mano (sin EEFF). */
async function ensureManualStatement(userId: string) {
  const { data: existing } = await supabase
    .from("statements")
    .select("id")
    .eq("user_id", userId)
    .eq("storage_path", "manual")
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("statements")
    .insert({
      user_id: userId,
      file_name: "Gastos manuales",
      file_type: "manual",
      file_size: 0,
      storage_path: "manual",
      status: "processed",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export function ManualExpenseDialog({
  categories,
  onAddCategory,
  trigger,
  open: openProp,
  onOpenChange,
  onSaved,
}: {
  categories: string[];
  onAddCategory?: (name: string) => void;
  /** Botón propio para abrir el diálogo (por defecto, "Cargar manualmente"). */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Al guardarse: por defecto lleva al análisis; con onSaved la pantalla decide (p. ej. ir a "Últimos gastos"). */
  onSaved?: () => void;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const budgets = useSpendBudgets();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notifyShared = useServerFn(notifySharedExpense);

  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    else setOpenState(value);
  };
  const [date, setDate] = useState<Date>(new Date());
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Otros");
  const [amount, setAmount] = useState<number>(0);
  const [precision, setPrecision] = useState<"day" | "month">("day");
  const [saving, setSaving] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newCatKind, setNewCatKind] = useState<"fixed" | "variable">("variable");
  const [inviting, setInviting] = useState(false);
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null);
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [invitePending, setInvitePending] = useState<string | null>(null);

  const { data: knownPartners = [] } = useQuery({
    queryKey: ["shared-partners", user?.id],
    enabled: Boolean(user?.id) && open,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("shared_expense_participants")
        .select("user_id, display_name, created_at")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(100);
      const unique = new Map<string, { id: string; name: string }>();
      for (const row of data ?? []) {
        if (!unique.has(row.user_id)) unique.set(row.user_id, { id: row.user_id, name: row.display_name || "?" });
      }
      return [...unique.values()];
    },
  });

  async function findPartner() {
    const validEmail = normalizeValidEmail(email);
    if (!validEmail) {
      toast.error(t("Escribe un correo válido", "Enter a valid email"));
      return;
    }
    setLooking(true);
    try {
      const { data, error } = await supabase.rpc("find_user_by_email", { _email: validEmail });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) { setInvitePending(validEmail); return; }
      if (row.id === user?.id) {
        toast.error(t("Elige a otra persona", "Choose someone else"));
        return;
      }
      setPartner({ id: row.id, name: (row.full_name as string) || validEmail });
      setEmail("");
      setInviting(false);
      setInvitePending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLooking(false);
    }
  }

  const currency = (profile?.currency as string) || "EUR";

  const trimmedNew = newCat.trim();
  const canCreateNew =
    trimmedNew.length > 0 &&
    !categories.some((c) => c.toLowerCase() === trimmedNew.toLowerCase());

  const confirmNewCategory = () => {
    if (!canCreateNew) return;
    onAddCategory?.(trimmedNew);
    setCategory(trimmedNew);
    // La categoría nueva entra en el plan de gastos como línea propia.
    const planId = `custom:cat:${trimmedNew.toLowerCase().replace(/\s+/g, "-")}`;
    const alreadyInPlan = budgets.lines.some(
      (line) =>
        line.id === planId ||
        (line.label ?? "").trim().toLowerCase() === trimmedNew.toLowerCase(),
    );
    if (!alreadyInPlan) {
      budgets.save([
        ...budgets.lines,
        {
          id: planId,
          label: trimmedNew,
          emoji: newCatKind === "fixed" ? "📌" : "🏷️",
          keywords: [trimmedNew.toLowerCase()],
          group: newCatKind === "fixed" ? "essentials" : "lifestyle",
          amount: 0,
        },
      ]);
      toast.success(
        t("Categoría añadida a tu plan", "Category added to your plan"),
        {
          description:
            newCatKind === "fixed"
              ? t("Como gasto fijo mensual", "As a monthly fixed expense")
              : t("Como gasto variable mensual", "As a monthly variable expense"),
        },
      );
    }
    setNewCat("");
    setNewCatKind("variable");
    setCreating(false);
  };


  /** Fecha efectiva: día exacto o primer día del mes seleccionado. */
  const effectiveDate = precision === "month" ? new Date(date.getFullYear(), date.getMonth(), 1) : date;

  async function onSave() {
    if (!user?.id) return;
    if (!amount || amount <= 0) {
      toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero"));
      return;
    }
    setSaving(true);
    try {
      const txDateStr = format(effectiveDate, "yyyy-MM-dd");
      const merchantName = merchant.trim() || translateCategory(category, lang);
      let ownAmount = amount;
      let description = t("Gasto manual", "Manual expense");
      if (partner) {
        ownAmount = amount / 2;
        const { data: expenseId, error: shareError } = await supabase.rpc("create_shared_expense", {
          _partner_id: partner.id,
          _payer_id: user.id,
          _total: amount,
          _currency: currency,
          _category: category,
          _merchant: merchantName,
          _tx_date: txDateStr,
          _split_mode: "50/50",
          _creator_name: (profile?.full_name as string | undefined)?.split(" ")[0] || t("Yo", "Me"),
          _partner_name: partner.name,
          _creator_share: ownAmount,
          _partner_share: amount - ownAmount,
        });
        if (shareError) throw shareError;
        if (!expenseId) throw new Error(t("No se pudo compartir el gasto", "Could not share the expense"));
        description = `shared:50/50|${partner.name}`;
        // Compartir no debe impedir que se registre tu parte si falla el aviso.
        void notifyShared({ data: { expenseId } }).catch(() => {});
      }
      const statementId = await ensureManualStatement(user.id);
      const { error } = await supabase.from("imported_transactions").insert({
        user_id: user.id,
        statement_id: statementId,
        tx_date: txDateStr,
        merchant: merchantName,
        description,
        amount: -Math.abs(ownAmount),
        currency,
        category,
      });
      if (error) throw new Error(error.message);
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      if (partner) void queryClient.invalidateQueries({ queryKey: ["shared-partners"] });
      const fmtStr = precision === "month" ? "MMM yyyy" : "d MMM yyyy";
      toast.success(t("Gasto guardado", "Expense saved"), {
        description: `${format(effectiveDate, fmtStr, (lang === "es" ? { locale: es } : undefined))} · ${translateCategory(category, lang)}`,
      });
      setMerchant("");
      setAmount(0);
      setPartner(null);
      setInviting(false);
      setEmail("");
      setInvitePending(null);
      setOpen(false);
      if (onSaved) {
        onSaved();
      } else {
        const monthStart = format(new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1), "yyyy-MM-dd");
        const monthEnd = format(new Date(effectiveDate.getFullYear(), effectiveDate.getMonth() + 1, 0), "yyyy-MM-dd");
        void navigate({ to: "/gastos", search: { from: monthStart, to: monthEnd, category } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {openProp === undefined && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm" variant="ghost" className="gap-2">
              <PencilLine className="h-4 w-4" />
              {t("Cargar manualmente", "Add manually")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Cargar gasto manualmente", "Add expense manually")}</DialogTitle>
          <DialogDescription>
            {t(
              "Si no quieres subir tus estados de cuenta, añade tus gastos variables con su fecha.",
              "If you don't want to upload statements, add your variable expenses with their date.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("Fecha", "Date")}</Label>
              <div className="flex rounded-md border border-white/10 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPrecision("day")}
                  className={cn("rounded px-2 py-0.5 transition", precision === "day" ? "bg-white/15 text-white" : "text-muted-foreground")}
                >
                  {t("Día exacto", "Exact day")}
                </button>
                <button
                  type="button"
                  onClick={() => setPrecision("month")}
                  className={cn("rounded px-2 py-0.5 transition", precision === "month" ? "bg-white/15 text-white" : "text-muted-foreground")}
                >
                  {t("Solo mes", "Month only")}
                </button>
              </div>
            </div>

            {precision === "day" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start gap-2 font-normal")}>
                    <CalendarIcon className="h-4 w-4" />
                    {format(date, "d MMM yyyy", (lang === "es" ? { locale: es } : undefined))}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={cn("justify-start gap-2 font-normal")}>
                    <CalendarIcon className="h-4 w-4" />
                    {format(date, "MMMM yyyy", (lang === "es" ? { locale: es } : undefined))}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                  <DropdownMenuLabel>{t("Selecciona el mes", "Select month")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Array.from({ length: 12 }, (_, m) => {
                    const candidate = new Date(date.getFullYear(), m, 1);
                    const isSel = date.getMonth() === m;
                    return (
                      <DropdownMenuItem
                        key={m}
                        onSelect={() => setDate(candidate)}
                        className={cn(isSel && "bg-white/10")}
                      >
                        {format(candidate, "MMMM yyyy", (lang === "es" ? { locale: es } : undefined))}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t("Año", "Year")}</DropdownMenuLabel>
                  {Array.from({ length: 7 }, (_, i) => date.getFullYear() - 3 + i).map((y) => (
                    <DropdownMenuItem
                      key={y}
                      onSelect={() => setDate(new Date(y, date.getMonth(), 1))}
                      className={cn(date.getFullYear() === y && "bg-white/10")}
                    >
                      {y}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>{t("Categoría", "Category")}</Label>
            {creating ? (
              <div className="grid gap-2">
                <Input
                  autoFocus
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmNewCategory();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setCreating(false);
                      setNewCat("");
                    }
                  }}
                  placeholder={t("Nombre de la categoría", "Category name")}
                />
                <div className="flex gap-2">
                  <Button type="button" onClick={confirmNewCategory} disabled={!canCreateNew}>
                    {t("Añadir", "Add")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreating(false);
                      setNewCat("");
                    }}
                  >
                    {t("Cancelar", "Cancel")}
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {t("Tipo de gasto", "Expense type")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewCatKind("fixed")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        newCatKind === "fixed"
                          ? "border-primary bg-primary/20 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground"
                      )}
                    >
                      <span aria-hidden>📌</span>
                      {t("Fijo", "Fixed")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatKind("variable")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        newCatKind === "variable"
                          ? "border-primary bg-primary/20 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground"
                      )}
                    >
                      <span aria-hidden>🏷️</span>
                      {t("Variable", "Variable")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Popover open={catOpen} onOpenChange={setCatOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={catOpen}
                      className="flex-1 justify-between font-normal"
                    >
                      <span>{translateCategory(category, lang)}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                      <CommandInput
                        placeholder={t("Buscar categoría", "Search category")}
                        value={catQuery}
                        onValueChange={setCatQuery}
                      />
                      <CommandList className="max-h-[min(50dvh,420px)]">
                        <CommandEmpty>
                          {t("No se encontraron categorías", "No categories found")}
                        </CommandEmpty>
                        <CommandGroup>
                          {categories.map((name) => (
                            <CommandItem
                              key={name}
                              value={`${name} ${translateCategory(name, lang)}`}
                              onSelect={() => {
                                setCategory(name);
                                setCatQuery("");
                                setCatOpen(false);
                              }}
                            >
                              <span className="flex-1">{translateCategory(name, lang)}</span>
                              {category === name && <Check className="h-4 w-4" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() => {
                    setCreating(true);
                    setNewCat("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("Nueva", "New")}
                </Button>
              </div>
            )}
          </div>


          <div className="grid gap-1.5">
            <Label>{t("Descripción (opcional)", "Description (optional)")}</Label>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={t("Ej. Supermercado", "e.g. Groceries")}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>{`${t("Monto", "Amount")} (${currency})`}</Label>
            <NumberInput value={amount} onChange={(v) => setAmount(v || 0)} min={0} format />
          </div>
        </div>

        <div className="grid gap-3 border-t border-border pt-4">
          <Label className="text-base font-medium">{t("Compartido", "Shared")}</Label>
          <div className="flex flex-wrap items-start gap-6">
            {[...(partner && !knownPartners.some((p) => p.id === partner.id) ? [partner] : []), ...knownPartners].map((person) => (
              <Button key={person.id} type="button" variant="ghost" className="flex h-auto max-w-24 flex-col items-center gap-2 p-0 font-normal hover:bg-transparent" onClick={() => setPartner(partner?.id === person.id ? null : person)} aria-pressed={partner?.id === person.id}>
                <span className={cn("relative grid h-20 w-20 place-items-center rounded-full bg-muted text-2xl font-semibold sm:h-24 sm:w-24", partner?.id === person.id && "ring-2 ring-positive")}>
                  {person.name.trim().slice(0, 2).toUpperCase()}
                  {partner?.id === person.id && <Check className="absolute -left-1 -top-1 h-5 w-5 rounded-full bg-positive p-0.5 text-background" />}
                </span>
                <span className="w-full break-words text-center text-sm">{person.name}</span>
              </Button>
            ))}
            <Button type="button" variant="ghost" className="flex h-auto w-20 flex-col items-center gap-2 p-0 font-normal hover:bg-transparent sm:w-24" onClick={() => setInviting((value) => !value)} aria-label={t("Añadir persona", "Add person")}>
              <span className="grid h-20 w-20 place-items-center rounded-full border border-border text-muted-foreground sm:h-24 sm:w-24"><Plus className="h-8 w-8" /></span>
              <span className="text-sm text-muted-foreground">{t("Añadir", "Add")}</span>
            </Button>
          </div>
          {inviting && (
            <div className="flex gap-2">
              <Input autoFocus type="email" value={email} onChange={(e) => { setEmail(e.target.value); setInvitePending(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void findPartner(); } }} placeholder={t("Correo de la otra persona", "Other person's email")} aria-label={t("Correo de la otra persona", "Other person's email")} />
              <Button type="button" variant="outline" onClick={findPartner} disabled={looking || !normalizeValidEmail(email)}>
                {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Añadir", "Add")}
              </Button>
            </div>
          )}
          {inviting && invitePending && <InviteShareActions email={invitePending} onClose={() => setInvitePending(null)} />}
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Guardar gasto", "Save expense")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
