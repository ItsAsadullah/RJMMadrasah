BEGIN;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_unique ON public.students(auth_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS teachers_auth_user_unique ON public.teachers(auth_user_id);
COMMIT;
