-- Drop the existing constraint
ALTER TABLE public.attendance
DROP CONSTRAINT attendance_marked_by_fkey;

-- Add the constraint back with ON DELETE SET NULL
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_marked_by_fkey
FOREIGN KEY (marked_by)
REFERENCES public.teachers(id)
ON DELETE SET NULL;
