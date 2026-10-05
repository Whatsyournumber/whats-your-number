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

    // Sincroniza el gasto en la app de la otra persona: su parte entra en sus gastos.
    const { data: exp2 } = await supabase.from("shared_expenses").select("tx_date").eq("id", exp.id).single();
    let { data: st } = await supabaseAdmin
      .from("statements").select("id").eq("user_id", other.user_id).eq("storage_path", "manual").limit(1).maybeSingle();
    if (!st) {
      const created = await supabaseAdmin.from("statements").insert({
        user_id: other.user_id, file_name: "Gastos manuales", file_type: "manual", file_size: 0, storage_path: "manual", status: "processed",
      }).select("id").single();
      if (created.error) throw new Error(created.error.message);
      st = created.data;
    }
    const split = String(exp.split_mode).split("/").reverse().join("/");
    const ins = await supabaseAdmin.from("imported_transactions").insert({
      user_id: other.user_id, statement_id: st!.id, tx_date: exp2?.tx_date ?? null,
      merchant: exp.merchant || exp.category, description: `shared:${split}|${me?.display_name ?? ""}`,
      amount: -Math.abs(Number(other.share_amount)), currency: exp.currency, category: exp.category,
    });
    if (ins.error) throw new Error(ins.error.message);
    await supabaseAdmin.from("shared_expense_participants").update({ status: "accepted" })
      .eq("expense_id", exp.id).eq("user_id", other.user_id);
    const { data: prof } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", other.user_id).maybeSingle();
    if (!prof?.email) return { sent: false, synced: true };

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
    return { sent: result.sent, synced: true };
  });

/** Removes both sides of a shared entry before emailing the other participant. */
export const deleteSharedExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ transactionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // The checked database function validates membership and deletes both entries atomically.
    const { data: rows, error: deletionError } = await context.supabase.rpc("delete_shared_expense", { _transaction_id: data.transactionId });
    if (deletionError) throw new Error(deletionError.message);
    const deleted = rows?.[0];
    if (!deleted) throw new Error("Shared expense not found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", deleted.other_user_id).maybeSingle();
    if (profile?.email) {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      try {
        await sendTemplateEmail("shared-expense-deleted", profile.email, {
          idempotencyKey: `shared-expense-deleted-${deleted.deleted_expense_id}`,
          templateData: {
            fromName: deleted.actor_name ?? "",
            toName: (profile.full_name ?? "").split(" ")[0],
            concept: deleted.concept,
          },
        });
      } catch (error) {
        console.error("Shared expense deletion email failed", error);
      }
    }
    return { deleted: true };
  });
