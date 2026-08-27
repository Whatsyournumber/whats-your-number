import { auth, defineMcp } from "@lovable.dev/mcp-js";

import createLifeGoalTool from "./tools/create-life-goal";
import getFinancialProfileTool from "./tools/get-financial-profile";
import listHoldingsTool from "./tools/list-holdings";
import listLifeGoalsTool from "./tools/list-life-goals";
import listRecentExpensesTool from "./tools/list-recent-expenses";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "whatsyournumber",
  title: "WhatsYourNumber",
  version: "0.1.0",
  instructions:
    "Tools for WhatsYourNumber, a personal finance and wealth app. Read the signed-in user's financial profile, wealth holdings, life goals and recent expenses, and create new financial goals. All amounts are in the currency stored on the user's profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getFinancialProfileTool,
    listHoldingsTool,
    listLifeGoalsTool,
    createLifeGoalTool,
    listRecentExpensesTool,
  ] as unknown as Parameters<typeof defineMcp>[0]["tools"],
});
