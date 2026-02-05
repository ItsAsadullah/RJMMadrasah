-- RPC to soft-remove a subject (SECURITY DEFINER to bypass RLS for admin UI)
CREATE OR REPLACE FUNCTION public.admin_remove_academic_subject(subject_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.academic_subjects
  SET is_active = false
  WHERE id = subject_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_remove_academic_subject(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_remove_academic_subject(uuid) TO authenticated;
