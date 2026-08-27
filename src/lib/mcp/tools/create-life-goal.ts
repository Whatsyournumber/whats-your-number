import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_life_goal",
  title: "Create life goal",
  description: "Create a new financial goal (house, business, travel, other) for the signed-in user.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Goal name, e.g. 'Down payment for a flat'."),
    cost: z.number().nonnegative().describe("Total amount needed, in the user's currency."),
    saved: z.number().nonnegative().optional().describe("Amount already saved towards the goal."),
    monthly: z.number().nonnegative().optional().describe("Monthly contribution towards the goal."),
    target_year: z.number().int().min(2024).max(2100).optional().describe("Year the goal should be reached."),
    kind: z.string().trim().optional().describe("Goal category, e.g. 'house', 'business', 'travel', 'other'."),
    emoji: z.string().trim().optional().describe("Emoji shown on the goal card."),
    note: z.string().trim().optional().describe("Free-form note about the goal."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("life_goals")
      .insert({
        user_id: ctx.getUserId()!,
        name: input.name,
        cost: input.cost,
        ...(input.saved !== undefined ? { saved: input.saved } : {}),
        ...(input.monthly !== undefined ? { monthly: input.monthly } : {}),
        ...(input.target_year !== undefined ? { target_year: input.target_year } : {}),
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.emoji ? { emoji: input.emoji } : {}),
        ...(input.note ? { note: input.note } : {}),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { goal: data },
    };
  },
});
