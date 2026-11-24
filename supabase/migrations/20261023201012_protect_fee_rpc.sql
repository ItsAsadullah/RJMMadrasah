BEGIN;
-- Fee writes must obey the caller's restrictive financial RLS policies.
ALTER FUNCTION public.process_fee_payments_bulk(jsonb) SECURITY INVOKER;
ALTER FUNCTION public.process_fee_payments_bulk(jsonb) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.process_fee_payments_bulk(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_fee_payments_bulk(jsonb) TO authenticated;
COMMIT;
