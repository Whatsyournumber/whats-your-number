import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Avisa por correo a la otra persona de un gasto compartido que creó quien llama. */
export const notifySharedExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ expenseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: exp } = await supabase
      .from("shared_expenses")
      .select("id, created_by, total, currency, category, merchant, split_mode")
      .eq("id", data.expenseId)
      .maybeSingle();
    if (!exp || exp.created_by !== userId) throw new Error("Forbidden");

    const { data: parts } = await supabase
      .from("shared_expense_participants")
      .select("user_id, display_name, share_amount")
      .eq("expense_id", exp.id);
    const me = parts?.find((p) => p.user_id === userId);
    const other = parts?.find((p) => p.user_id !== userId);
    if (!other) return { sent: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", other.user_id).maybeSingle();
    if (!prof?.email) return { sent: false };

    const money = (v: number) =>
      new Intl.NumberFormat("es-ES", { style: "currency", currency: exp.currency || "USD" }).format(Number(v));
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("shared-expense", prof.email, {
      idempotencyKey: `shared-expense-${exp.id}`,
      templateData: {
        fromName: me?.display_name ?? "",
        toName: (prof.full_name ?? "").split(" ")[0],
        concept: exp.merchant || exp.category,
        total: money(exp.total),
        share: money(other.share_amount),
        split: exp.split_mode,
      },
    });
    return { sent: result.sent };
  });
