import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [saving, setSaving] = useState(false);

  const currency = (profile?.currency as string) || "EUR";

  async function onSave() {
    if (!user?.id) return;
    if (!amount || amount <= 0) {
      toast.error(t("Escribe un monto mayor que cero", "Enter an amount greater than zero"));
      return;
    }
    setSaving(true);
    try {
      const statementId = await ensureManualStatement(user.id);
      const { error } = await supabase.from("imported_transactions").insert({
        user_id: user.id,
        statement_id: statementId,
        tx_date: format(date, "yyyy-MM-dd"),
        merchant: merchant.trim() || translateCategory(category, lang),
        description: t("Gasto manual", "Manual expense"),
        amount: -Math.abs(amount),
        currency,
        category,
      });
      if (error) throw new Error(error.message);
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      toast.success(t("Gasto guardado", "Expense saved"), {
        description: `${format(date, "d MMM yyyy", (lang === "es" ? { locale: es } : undefined))} · ${translateCategory(category, lang)}`,
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
            <Label>{t("Fecha", "Date")}</Label>
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
