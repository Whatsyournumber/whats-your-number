<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

The four entitlements rank free < pro < investor < patrimonio (Family): Free has the number summary on Dashboard and savings goals/money flow, Pro unlocks the full number, AI and planners, Investor adds net worth, portfolio and mortgage, and Family adds children's profiles; keep sidebar and mobile tour destinations aligned with these gates.

The sidebar distributes remaining height among each plan's unlocked groups according to item count, with locked destinations in a collapsible group, so plan navigation remains visible without a main sidebar scrollbar.

Savings goals are stored per user through the existing synced user settings so Free users can edit them across devices without changing Life Planner's separate Pro goals.

Create each shared expense and both participant records atomically via `create_shared_expense`; keep receipt items with the purchase and count only each member's share, avoiding partial or doubled data.

Validate and normalize invitation email addresses with the shared Zod helper before account lookup or external sharing so both expense flows behave consistently.

Onboarding stores one primary and one optional secondary financial goal; only an exclusive spending-tracking goal skips the return-assumption step and replaces the final assets/liabilities sections with bank savings for emergency-fund context.

Supermarket receipt insights parse itemized lines from transaction descriptions into twelve bilingual, product-name-based rubros and show only rubros with current spend; when a bank charge duplicates an uploaded receipt, keep the bank charge and carry its receipt details in the read model so spending is counted once without losing products.

Grocery corrections are saved per user through synced settings and applied to both current and previous itemized receipts; this lets corrections improve future analysis without rewriting bank transactions.
