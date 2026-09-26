import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
      const statementId = await ensureManualStatement(user.id);
      const txDateStr = format(effectiveDate, "yyyy-MM-dd");
      const { error } = await supabase.from("imported_transactions").insert({
        user_id: user.id,
        statement_id: statementId,
        tx_date: txDateStr,
        merchant: merchant.trim() || translateCategory(category, lang),
        description: t("Gasto manual", "Manual expense"),
        amount: -Math.abs(amount),
        currency,
        category,
      });
      if (error) throw new Error(error.message);
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      const fmtStr = precision === "month" ? "MMM yyyy" : "d MMM yyyy";
      toast.success(t("Gasto guardado", "Expense saved"), {
        description: `${format(effectiveDate, fmtStr, (lang === "es" ? { locale: es } : undefined))} · ${translateCategory(category, lang)}`,
      });
      setMerchant("");
      setAmount(0);
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
      <DialogContent className="sm:max-w-md">
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
                <div className="flex gap-2">
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
                <div className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("Tipo de gasto", "Expense type")}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCatKind("fixed")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
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
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                        newCatKind === "variable"
                          ? "border-primary bg-primary/20 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground"
                      )}
                    >
                      <span aria-hidden>🏷️</span>
                      {t("Variable", "Variable")}
                    </button>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {t("Se añade a tu plan", "Added to your plan")}
                  </span>
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
                      <CommandList>
                        <CommandEmpty>
                          {t("No se encontraron categorías", "No categories found")}
                        </CommandEmpty>
                        <CommandGroup>
                          {categories.map((name) => (
                            <CommandItem
                              key={name}
                              value={name}
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
