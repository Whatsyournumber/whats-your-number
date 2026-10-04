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

Create shared expenses and both participants atomically via `create_shared_expense`, with each member's share counted once and receipt items retained. Keep its public RPC an authenticated invoker wrapper around a checked private definer function so participant SELECT policies pass without exposing a definer in the API.

Validate and normalize invitation email addresses with the shared Zod helper before account lookup or external sharing so both expense flows behave consistently.

Onboarding stores one primary and one optional secondary financial goal; only an exclusive spending-tracking goal skips the return-assumption step and replaces the final assets/liabilities sections with bank savings for emergency-fund context.

Supermarket receipt insights parse itemized lines from transaction descriptions into twelve bilingual, product-name-based rubros and show only rubros with current spend; when a bank charge duplicates an uploaded receipt, keep the bank charge and carry its receipt details in the read model so spending is counted once without losing products.

Grocery rules are synced per user; show only saved corrections/additions as rules, not every detected receipt product, and apply them to past and future receipts without rewriting bank data.

Shared-expense edits use the authenticated public invoker RPC backed by a private checked function to update the expense, both shares, and the editor's transaction together; balances convert each expense currency to the profile currency and refresh after writes so totals stay consistent.

Monthly shared-balance settlements are private per-user records of paid amounts and payment direction, separate from expense shares, so recording payments changes only the outstanding balance, not historical spending.

Monthly shared-balance summaries match accepted expense records one-to-one to visible user transactions by date, merchant when present, currency, and share amount; orphaned participant rows must not inflate counts or balances because their transactions cannot be inspected or edited.
