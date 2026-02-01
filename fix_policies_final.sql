-- Fix RLS policies with conflict handling
-- This script ensures existing policies are dropped before creating new ones

-- 1. Academic Subjects
DROP POLICY IF EXISTS "Public Access Subjects" ON public.academic_subjects;
DROP POLICY IF EXISTS "Public Read Subjects" ON public.academic_subjects;
DROP POLICY IF EXISTS "Admin Manage Subjects" ON public.academic_subjects;

CREATE POLICY "Public Read Subjects" ON public.academic_subjects FOR SELECT USING (true);
CREATE POLICY "Admin Manage Subjects" ON public.academic_subjects FOR ALL USING (auth.role() = 'authenticated');

-- 2. Admission Config
DROP POLICY IF EXISTS "Admin Update" ON public.admission_config;
DROP POLICY IF EXISTS "Public Read Config" ON public.admission_config;
DROP POLICY IF EXISTS "Admin Update Config" ON public.admission_config;

CREATE POLICY "Public Read Config" ON public.admission_config FOR SELECT USING (true);
CREATE POLICY "Admin Update Config" ON public.admission_config FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Branches
DROP POLICY IF EXISTS "Enable all for branches" ON public.branches;
DROP POLICY IF EXISTS "Public Read Branches" ON public.branches;
DROP POLICY IF EXISTS "Admin Manage Branches" ON public.branches;

CREATE POLICY "Public Read Branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Admin Manage Branches" ON public.branches FOR ALL USING (auth.role() = 'authenticated');

-- 4. Exam Marks
DROP POLICY IF EXISTS "Admin All Marks" ON public.exam_marks;
DROP POLICY IF EXISTS "Admin Manage Marks" ON public.exam_marks;

CREATE POLICY "Admin Manage Marks" ON public.exam_marks FOR ALL USING (auth.role() = 'authenticated');

-- 5. Exams
DROP POLICY IF EXISTS "Admin All Exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage all" ON public.exams;
DROP POLICY IF EXISTS "Public Read Exams" ON public.exams;
DROP POLICY IF EXISTS "Admin Manage Exams" ON public.exams;

CREATE POLICY "Public Read Exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admin Manage Exams" ON public.exams FOR ALL USING (auth.role() = 'authenticated');

-- 6. Notices
DROP POLICY IF EXISTS "Enable delete for notices" ON public.notices;
DROP POLICY IF EXISTS "Enable insert for notices" ON public.notices;
DROP POLICY IF EXISTS "Enable update for notices" ON public.notices;
DROP POLICY IF EXISTS "Public Read Notices" ON public.notices;
DROP POLICY IF EXISTS "Admin Manage Notices" ON public.notices;

CREATE POLICY "Public Read Notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Admin Manage Notices" ON public.notices FOR ALL USING (auth.role() = 'authenticated');

-- 7. Payments
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admin Manage Payments" ON public.payments;

CREATE POLICY "Admin Manage Payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

-- 8. Results
DROP POLICY IF EXISTS "Admins can manage results" ON public.results;
DROP POLICY IF EXISTS "Public Read Results" ON public.results;
DROP POLICY IF EXISTS "Admin Manage Results" ON public.results;

CREATE POLICY "Public Read Results" ON public.results FOR SELECT USING (true);
CREATE POLICY "Admin Manage Results" ON public.results FOR ALL USING (auth.role() = 'authenticated');

-- 9. Routine Templates
DROP POLICY IF EXISTS "Admin All Templates" ON public.routine_templates;
DROP POLICY IF EXISTS "Admin Manage Templates" ON public.routine_templates;

CREATE POLICY "Admin Manage Templates" ON public.routine_templates FOR ALL USING (auth.role() = 'authenticated');

-- 10. Routines
DROP POLICY IF EXISTS "Admin All Routines" ON public.routines;
DROP POLICY IF EXISTS "Public Read Routines" ON public.routines;
DROP POLICY IF EXISTS "Admin Manage Routines" ON public.routines;

CREATE POLICY "Public Read Routines" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Admin Manage Routines" ON public.routines FOR ALL USING (auth.role() = 'authenticated');
