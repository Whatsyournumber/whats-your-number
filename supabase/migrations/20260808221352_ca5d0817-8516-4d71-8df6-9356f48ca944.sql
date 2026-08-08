-- Remove duplicate statement uploads (same file re-imported), keeping the most recent upload per file/month
DELETE FROM public.statements s
USING public.statements newer
WHERE s.user_id = newer.user_id
  AND lower(regexp_replace(s.file_name, '[^a-zA-Z0-9]', '', 'g')) IS NOT NULL
  AND s.created_at < newer.created_at
  AND s.transactions_count = newer.transactions_count
  AND s.transactions_count > 0;

-- Remove any remaining exact duplicate transactions
DELETE FROM public.imported_transactions t
USING public.imported_transactions keep
WHERE t.user_id = keep.user_id
  AND t.tx_date IS NOT DISTINCT FROM keep.tx_date
  AND t.merchant = keep.merchant
  AND t.amount = keep.amount
  AND coalesce(t.description,'') = coalesce(keep.description,'')
  AND t.ctid > keep.ctid;

-- Drop statements that no longer have transactions and were empty imports
DELETE FROM public.statements s
WHERE s.transactions_count = 0
  AND NOT EXISTS (SELECT 1 FROM public.imported_transactions t WHERE t.statement_id = s.id);