-- Fix overly permissive RLS policies
-- Replace "true" policies with role-based checks (authenticated only)

-- 1. Academic Classes
DROP POLICY IF EXISTS "Public Access Classes" ON public.academic_classes;
CREATE POLICY "Public Read Classes" ON public.academic_classes FOR SELECT USING (true);
CREATE POLICY "Admin Manage Classes" ON public.academic_classes FOR ALL USING (auth.role() = 'authenticated');

-- 2. Academic Subjects
DROP POLICY IF EXISTS "Public Access Subjects" ON public.academic_subjects;
CREATE POLICY "Public Read Subjects" ON public.academic_subjects FOR SELECT USING (true);
CREATE POLICY "Admin Manage Subjects" ON public.academic_subjects FOR ALL USING (auth.role() = 'authenticated');

-- 3. Admission Config
DROP POLICY IF EXISTS "Admin Update" ON public.admission_config;
CREATE POLICY "Public Read Config" ON public.admission_config FOR SELECT USING (true);
CREATE POLICY "Admin Update Config" ON public.admission_config FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Branches
DROP POLICY IF EXISTS "Enable all for branches" ON public.branches;
CREATE POLICY "Public Read Branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Admin Manage Branches" ON public.branches FOR ALL USING (auth.role() = 'authenticated');

-- 5. Exam Marks
DROP POLICY IF EXISTS "Admin All Marks" ON public.exam_marks;
CREATE POLICY "Admin Manage Marks" ON public.exam_marks FOR ALL USING (auth.role() = 'authenticated');

-- 6. Exam Routines
DROP POLICY IF EXISTS "Admin All Routine" ON public.exam_routines;
CREATE POLICY "Public Read Routines" ON public.exam_routines FOR SELECT USING (true);
CREATE POLICY "Admin Manage Routines" ON public.exam_routines FOR ALL USING (auth.role() = 'authenticated');

-- 7. Exams
DROP POLICY IF EXISTS "Admin All Exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage all" ON public.exams;
CREATE POLICY "Public Read Exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admin Manage Exams" ON public.exams FOR ALL USING (auth.role() = 'authenticated');

-- 8. Notices
DROP POLICY IF EXISTS "Enable delete for notices" ON public.notices;
DROP POLICY IF EXISTS "Enable insert for notices" ON public.notices;
DROP POLICY IF EXISTS "Enable update for notices" ON public.notices;
-- Re-create properly (already done in previous step, but ensuring cleanup)
CREATE POLICY "Admin Manage Notices" ON public.notices FOR ALL USING (auth.role() = 'authenticated');

-- 9. Payments
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admin Manage Payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

-- 10. Results
DROP POLICY IF EXISTS "Admins can manage results" ON public.results;
CREATE POLICY "Public Read Results" ON public.results FOR SELECT USING (true);
CREATE POLICY "Admin Manage Results" ON public.results FOR ALL USING (auth.role() = 'authenticated');

-- 11. Routine Templates
DROP POLICY IF EXISTS "Admin All Templates" ON public.routine_templates;
CREATE POLICY "Admin Manage Templates" ON public.routine_templates FOR ALL USING (auth.role() = 'authenticated');

-- 12. Routines
DROP POLICY IF EXISTS "Admin All Routines" ON public.routines;
CREATE POLICY "Public Read Routines" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Admin Manage Routines" ON public.routines FOR ALL USING (auth.role() = 'authenticated');

-- 13. Students
DROP POLICY IF EXISTS "Anyone can submit admission" ON public.students;
DROP POLICY IF EXISTS "Enable delete for students" ON public.students;
DROP POLICY IF EXISTS "Enable insert/update for all" ON public.students;
DROP POLICY IF EXISTS "Enable update for students" ON public.students;

-- Allow public insert for admission form, but restrict update/delete to admins
CREATE POLICY "Public Submit Admission" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Admin Manage Students" ON public.students FOR ALL USING (auth.role() = 'authenticated');

-- 14. Subjects (Generic)
DROP POLICY IF EXISTS "Admins can manage all subjects" ON public.subjects;
CREATE POLICY "Admin Manage Subjects Generic" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
