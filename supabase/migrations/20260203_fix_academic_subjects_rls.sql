-- Ensure RLS + policies exist for academic_subjects so admin UI can update/delete (soft remove)
ALTER TABLE public.academic_subjects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'academic_subjects'
      AND policyname = 'Public Read Academic Subjects'
  ) THEN
    CREATE POLICY "Public Read Academic Subjects"
    ON public.academic_subjects
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'academic_subjects'
      AND policyname = 'Admin Manage Academic Subjects'
  ) THEN
    CREATE POLICY "Admin Manage Academic Subjects"
    ON public.academic_subjects
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
