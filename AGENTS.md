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

The home daily-spending showcase uses an isolated preview component with illustrative data; never mount authenticated expense management on the public home page.

Keep the home-only fixed desktop header and contact shortcut in HomeNavigation, shared by both home languages, so other pages and mobile navigation remain unchanged.

The four entitlements rank free < pro < investor < patrimonio (Family): Free has the number summary on Dashboard and savings goals/money flow, Pro unlocks the full number, AI and planners, Investor adds net worth, portfolio and mortgage, and Family adds children's profiles; keep sidebar and mobile tour destinations aligned with these gates.

The sidebar distributes remaining height among each plan's unlocked groups according to item count, with locked destinations in a collapsible group, so plan navigation remains visible without a main sidebar scrollbar.

Savings goals are stored per user through the existing synced user settings so Free users can edit them across devices without changing Life Planner's separate Pro goals.

Create group shared expenses and all participant transactions atomically via `create_group_shared_expense`; keep legacy two-person creation compatible. Each member has one durable transaction and one cent-exact share so spending is never multiplied by partner count. Public RPCs are authenticated invoker wrappers around checked private definers.

Validate and normalize invitation email addresses with the shared Zod helper before account lookup or external sharing so both expense flows behave consistently.

Onboarding stores one primary and one optional secondary financial goal; only an exclusive spending-tracking goal skips the return-assumption step and replaces the final assets/liabilities sections with bank savings for emergency-fund context.

Supermarket receipt insights parse itemized lines from transaction descriptions into twelve bilingual, product-name-based rubros and show only rubros with current spend; when a bank charge duplicates an uploaded receipt, keep the bank charge and carry its receipt details in the read model so spending is counted once without losing products.

Grocery rules are synced per user; show only saved corrections/additions as rules, not every detected receipt product, and apply them to past and future receipts without rewriting bank data.

Classify receipt products through the shared bilingual grocery vocabulary after user rules and before the `other` fallback, so current and historical receipt views improve without rewriting transactions.

Shared-expense editing, deletion and balances use each participant's durable transaction_id; identity metadata precedes receipt JSON in descriptions so creation triggers retain the link. Recover legacy links only for bidirectionally unique exact matches; each owner confirms ambiguous legacy links through the checked RPC, never fuzzy-match a partner's purchase. Both transactions, shares and expense update atomically. Receipt capture uses the shared expense-split calculation for equal, percentage and amount modes.

Monthly shared-balance payments are private per-user append-only entries with amount, currency, direction, and date, separate from expense shares, so partial payments retain history and change only the outstanding balance, not historical spending.

Monthly shared-balance summaries match accepted expense records one-to-one to visible user transactions by date, merchant when present, and currency; prefer exact share amount but allow named legacy transactions with rounded or altered amounts. Orphaned participant rows must not inflate counts or balances because their transactions cannot be inspected or edited.

Keep liability form rules in `src/lib/liability-form.ts` so the UI and its rule tests share one source of truth.
Liability rows reuse AssetDialog: stored debts edit their holding, while profile and property liabilities update their original balance source and keep supplemental name/type/date in user settings, avoiding duplicate debts.

Currency edits in My Profile are draft-only for both profile and holdings; persist through `save_financial_profile`, also used by the header selector, so profile, holdings, goals and budgets commit together with an original-currency check. Invalidate only the active user's caches after commit.
