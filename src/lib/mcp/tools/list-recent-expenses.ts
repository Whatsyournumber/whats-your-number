import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_recent_expenses",
  title: "List recent expenses",
  description: "List the signed-in user's most recent imported transactions, optionally filtered by category.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("How many transactions to return (default 50)."),
    category: z.string().trim().optional().describe("Only return transactions in this category."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("imported_transactions")
      .select("id,tx_date,merchant,description,amount,currency,category,subcategory,excluded")
      .eq("user_id", ctx.getUserId()!)
      .eq("excluded", false)
      .order("tx_date", { ascending: false })
      .limit(limit ?? 50);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ total, transactions: data ?? [] }) }],
      structuredContent: { total, transactions: data ?? [] },
    };
  },
});
