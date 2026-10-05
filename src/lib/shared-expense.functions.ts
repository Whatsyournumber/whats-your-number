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
    const { userId, supabase } = context;
    const { data: ownTx, error: txError } = await supabase.from("imported_transactions")
      .select("id, merchant, tx_date, currency, description, amount")
      .eq("id", data.transactionId).eq("user_id", userId).single();
    if (txError || !ownTx?.description?.startsWith("shared:")) throw new Error("Shared expense not found");

    const { data: parts, error: partsError } = await supabase.from("shared_expense_participants")
      .select("expense_id, user_id, display_name, share_amount, shared_expenses(id, created_by, merchant, tx_date, currency, total)")
      .eq("user_id", userId).neq("status", "declined");
    if (partsError) throw new Error(partsError.message);
    const candidates = (parts ?? []).filter((part) =>
      part.shared_expenses?.tx_date === ownTx.tx_date &&
      part.shared_expenses?.merchant === ownTx.merchant &&
      part.shared_expenses?.currency === ownTx.currency,
    );
    const chosen = candidates.find((part) => Math.abs(Number(part.share_amount) - Math.abs(Number(ownTx.amount))) < 0.02)
      ?? (candidates.length === 1 ? candidates[0] : undefined);
    const expense = chosen?.shared_expenses;
    if (!expense || !chosen) throw new Error("Shared expense not found");
    const others = (await supabase.from("shared_expense_participants")
      .select("user_id, display_name, share_amount").eq("expense_id", chosen.expense_id)).data ?? [];
    const other = others.find((part) => part.user_id !== userId);
    if (!other) throw new Error("Shared partner not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: otherTransactions, error: otherError } = await supabaseAdmin.from("imported_transactions")
      .select("id, amount, description")
      .eq("user_id", other.user_id).eq("tx_date", expense.tx_date)
      .eq("merchant", expense.merchant).eq("currency", expense.currency)
      .like("description", "shared:%");
    if (otherError) throw new Error(otherError.message);
    const otherName = chosen.display_name?.trim().toLowerCase();
    const scoped = (otherTransactions ?? []).filter((tx) => !otherName || tx.description?.toLowerCase().includes(otherName));
    const otherTx = scoped.find((tx) => Math.abs(Math.abs(Number(tx.amount)) - Number(other.share_amount)) < 0.02)
      ?? (scoped.length === 1 ? scoped[0] : undefined);
    if (!otherTx) throw new Error("Matching shared entry not found");

    // Delete only the identified pair; never remove unrelated bank transactions.
    const { error: removeOtherError } = await supabaseAdmin.from("imported_transactions").delete()
      .eq("id", otherTx.id).eq("user_id", other.user_id);
    if (removeOtherError) throw new Error(removeOtherError.message);
    const { error: removeOwnError } = await supabaseAdmin.from("imported_transactions").delete()
      .eq("id", ownTx.id).eq("user_id", userId);
    if (removeOwnError) throw new Error(removeOwnError.message);
    const { error: removeExpenseError } = await supabaseAdmin.from("shared_expenses").delete().eq("id", expense.id);
    if (removeExpenseError) throw new Error(removeExpenseError.message);

    const { data: profile } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", other.user_id).maybeSingle();
    if (profile?.email) {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      try {
        await sendTemplateEmail("shared-expense-deleted", profile.email, {
          idempotencyKey: `shared-expense-deleted-${expense.id}`,
          templateData: {
            fromName: chosen.display_name ?? "",
            toName: (profile.full_name ?? "").split(" ")[0],
            concept: expense.merchant,
          },
        });
      } catch (error) {
        console.error("Shared expense deletion email failed", error);
      }
    }
    return { deleted: true };
  });
