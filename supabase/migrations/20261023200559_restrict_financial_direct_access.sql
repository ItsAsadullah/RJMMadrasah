-- Restrict direct financial mutations without changing portal read flows.
-- Existing permissive policies remain, but cannot bypass restrictive policies.
-- SECURITY DEFINER RPCs require a separate audit; these policies do not guard them.
BEGIN;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['student_dues', 'transactions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target);
    EXECUTE format('CREATE POLICY financial_admin_insert ON public.%I AS RESTRICTIVE FOR INSERT TO public WITH CHECK ((select auth.uid()) = %L::uuid)', target, '85bec2fc-13df-4b53-84a3-9e15d14da142');
    EXECUTE format('CREATE POLICY financial_admin_update ON public.%I AS RESTRICTIVE FOR UPDATE TO public USING ((select auth.uid()) = %L::uuid) WITH CHECK ((select auth.uid()) = %L::uuid)', target, '85bec2fc-13df-4b53-84a3-9e15d14da142', '85bec2fc-13df-4b53-84a3-9e15d14da142');
    EXECUTE format('CREATE POLICY financial_admin_delete ON public.%I AS RESTRICTIVE FOR DELETE TO public USING ((select auth.uid()) = %L::uuid)', target, '85bec2fc-13df-4b53-84a3-9e15d14da142');
  END LOOP;
END $$;
COMMIT;
