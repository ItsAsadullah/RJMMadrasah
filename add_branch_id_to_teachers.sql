-- Add branch_id column to teachers table
ALTER TABLE public.teachers
ADD COLUMN branch_id bigint REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create an index for faster filtering
CREATE INDEX idx_teachers_branch_id ON public.teachers(branch_id);
