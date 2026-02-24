-- Enable RLS on student_dues and fee_structures tables
-- Fixes: rls_disabled_in_public security lint errors

-- ── student_dues ──────────────────────────────────────────────
ALTER TABLE public.student_dues ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can do everything
CREATE POLICY "student_dues_admin_all"
  ON public.student_dues
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── fee_structures ────────────────────────────────────────────
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- Anyone can read fee structures (needed for public admission/info pages)
CREATE POLICY "fee_structures_public_read"
  ON public.fee_structures
  FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert / update / delete
CREATE POLICY "fee_structures_admin_write"
  ON public.fee_structures
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
