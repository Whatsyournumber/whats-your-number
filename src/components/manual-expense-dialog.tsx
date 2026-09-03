import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Check, Loader2, PencilLine, ChevDown, Plus, ChevronDown } from "lucide-react";
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
  CommandSeparator,
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

export function ManualExpenseDialog({ categories }: { categories: string[] }) {
  const t = useT();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Otros");
  const [amount, setAmount] = useState<number>(0);
  const [precision, setPrecision] = useState<"day" | "month">("day");
  const [saving, setSaving] = useState(false);

  const currency = (profile?.currency as string) || "EUR";

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2">
          <PencilLine className="h-4 w-4" />
          {t("Cargar manualmente", "Add manually")}
        </Button>
      </DialogTrigger>
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {categories.map((name) => (
                  <SelectItem key={name} value={name}>
                    {translateCategory(name, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
