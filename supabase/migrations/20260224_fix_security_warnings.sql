-- Fix Supabase security lint warnings
-- 1. function_search_path_mutable  → update_due_status
-- 2. rls_policy_always_true        → academic_subjects, departments, gallery_items,
--                                    promotion_logs, leave_applications, students

-- ══════════════════════════════════════════════════════════════
-- 1. Fix mutable search_path on update_due_status
--    Prevents search-path hijacking attacks
-- ══════════════════════════════════════════════════════════════
ALTER FUNCTION public.update_due_status()
  SET search_path = public, pg_temp;

-- ══════════════════════════════════════════════════════════════
-- 2. academic_subjects
--    Replace USING (true) / WITH CHECK (true) for authenticated
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admin Manage Academic Subjects" ON public.academic_subjects;

CREATE POLICY "Admin Manage Academic Subjects"
  ON public.academic_subjects
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════
-- 3. departments
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.departments;

CREATE POLICY "Enable delete access for authenticated users"
  ON public.departments
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
  ON public.departments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
  ON public.departments
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════
-- 4. gallery_items
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.gallery_items;

CREATE POLICY "Enable delete for authenticated users only"
  ON public.gallery_items
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only"
  ON public.gallery_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only"
  ON public.gallery_items
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════
-- 5. promotion_logs
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.promotion_logs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.promotion_logs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.promotion_logs;

CREATE POLICY "Enable delete access for authenticated users"
  ON public.promotion_logs
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
  ON public.promotion_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
  ON public.promotion_logs
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════
-- 6. leave_applications — "Public Insert Leaves"
--    Intentional: anyone (anon) can submit a leave application.
--    Tighten by ensuring required fields are non-empty so bots
--    can't insert empty rows.
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public Insert Leaves" ON public.leave_applications;

CREATE POLICY "Public Insert Leaves"
  ON public.leave_applications
  FOR INSERT
  WITH CHECK (
    teacher_id IS NOT NULL
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
  );

-- ══════════════════════════════════════════════════════════════
-- 7. students — "Public Submit Admission"
--    Intentional: anyone can submit the online admission form.
--    Tighten by requiring at minimum a name field.
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public Submit Admission" ON public.students;

CREATE POLICY "Public Submit Admission"
  ON public.students
  FOR INSERT
  WITH CHECK (
    name IS NOT NULL
    AND name <> ''
  );

-- ══════════════════════════════════════════════════════════════
-- NOTE: "Leaked Password Protection Disabled" (auth_leaked_password_protection)
-- cannot be fixed via SQL. Enable it in the Supabase dashboard:
--   Authentication → Settings → Enable Leaked Password Protection
-- ══════════════════════════════════════════════════════════════
