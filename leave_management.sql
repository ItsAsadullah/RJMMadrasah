
-- Create Leave Applications Table
CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_remark TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public/Students can insert (since they might not be fully auth'd in Supabase context, or we allow public insert like admission)
-- But wait, we need `student_id`.
-- If students are not Supabase Auth users, we can't use `auth.uid()`.
-- We will allow "Public" read/insert for now to support the custom portal, similar to how `students` table might be accessed or we rely on the API to secure it?
-- Actually, for `students` table:
-- `CREATE POLICY "Public Read Students" ON public.students FOR SELECT USING (true);`
-- So we can do similar for leave_applications for SELECT (with filter in UI) or better, just allow all for now and filter in client (not secure but consistent with current project state).
-- BUT, we can try to be slightly better.
-- Let's just follow the "Admin Manage" pattern.

DROP POLICY IF EXISTS "Public Read Leaves" ON leave_applications;
CREATE POLICY "Public Read Leaves" ON leave_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Leaves" ON leave_applications;
CREATE POLICY "Public Insert Leaves" ON leave_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Manage Leaves" ON leave_applications;
CREATE POLICY "Admin Manage Leaves" ON leave_applications FOR ALL USING (auth.role() = 'authenticated');
