import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_holdings",
  title: "List holdings",
  description:
    "List the signed-in user's wealth positions (investments, cash, property, businesses) with value, cost basis and expected return.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("holdings")
      .select("id,label,kind,ticker,quantity,manual_value,cost_basis,expected_return,monthly_contribution,monthly_income,linked_liability,position")
      .eq("user_id", ctx.getUserId()!)
      .order("position", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { holdings: data ?? [] },
    };
  },
});
