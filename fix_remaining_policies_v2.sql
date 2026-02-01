-- Fix remaining permissive RLS policies with safety checks
-- This script drops existing policies before creating new ones to avoid "already exists" errors.

-- 1. Teachers
DROP POLICY IF EXISTS "Admin All Teachers" ON public.teachers;
DROP POLICY IF EXISTS "Public Read Teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admin Manage Teachers" ON public.teachers;

CREATE POLICY "Public Read Teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Admin Manage Teachers" ON public.teachers FOR ALL USING (auth.role() = 'authenticated');

-- 2. Students
DROP POLICY IF EXISTS "Enable update for students" ON public.students;
DROP POLICY IF EXISTS "Admin Update Students" ON public.students;
-- Ensure we don't conflict with previous "Admin Manage Students" if it exists
DROP POLICY IF EXISTS "Admin Manage Students" ON public.students;

-- Public read access (if not already set correctly)
DROP POLICY IF EXISTS "Public Read Students" ON public.students;
CREATE POLICY "Public Read Students" ON public.students FOR SELECT USING (true);

-- Admin full management access
CREATE POLICY "Admin Manage Students" ON public.students FOR ALL USING (auth.role() = 'authenticated');

-- 3. Subjects (Generic)
DROP POLICY IF EXISTS "Admins can manage all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admin Manage Subjects Generic" ON public.subjects;

CREATE POLICY "Admin Manage Subjects Generic" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
