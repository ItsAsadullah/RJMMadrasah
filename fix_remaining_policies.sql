-- Fix remaining permissive RLS policies for Teachers and Students

-- 1. Teachers
DROP POLICY IF EXISTS "Admin All Teachers" ON public.teachers;
CREATE POLICY "Public Read Teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Admin Manage Teachers" ON public.teachers FOR ALL USING (auth.role() = 'authenticated');

-- 2. Students (Fix remaining permissive policies)
-- Note: "Public Submit Admission" is intentionally permissive for INSERT (new students)
-- but we must ensure UPDATE is restricted.

DROP POLICY IF EXISTS "Enable update for students" ON public.students;
-- Ensure "Admin Manage Students" covers updates, which we created in the previous step.
-- If not, explicit update policy for admins:
CREATE POLICY "Admin Update Students" ON public.students FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Subjects (Specific table if exists, distinct from academic_subjects)
DROP POLICY IF EXISTS "Admins can manage all subjects" ON public.subjects;
CREATE POLICY "Admin Manage Subjects Generic" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
