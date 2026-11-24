-- Apply only when server-only configuration and portal accounts are ready.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE OR REPLACE FUNCTION private.portal_student_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT id FROM public.students WHERE auth_user_id=(select auth.uid()) AND auth.uid() IS NOT NULL AND status='active' LIMIT 1
$$;
CREATE OR REPLACE FUNCTION private.portal_student_number() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT student_id FROM public.students WHERE auth_user_id=(select auth.uid()) AND auth.uid() IS NOT NULL AND status='active' LIMIT 1
$$;
CREATE OR REPLACE FUNCTION private.portal_teacher_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT id FROM public.teachers WHERE auth_user_id=(select auth.uid()) AND auth.uid() IS NOT NULL LIMIT 1
$$;
CREATE OR REPLACE FUNCTION private.teacher_attendance_access(class_id uuid, student_id uuid, branch_id integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.routines r JOIN public.teachers t ON t.id=r.teacher_id
    JOIN public.academic_classes c ON c.id=r.class_id JOIN public.students s ON s.id=$2
    WHERE t.auth_user_id=auth.uid() AND c.id=$1 AND c.branch_id=$3
      AND s.branch_id=c.branch_id AND s.class_name=c.name AND s.academic_year=c.academic_year
      AND s.department IS NOT DISTINCT FROM c.department AND s.status='active'
  )
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.portal_student_id(),private.portal_student_number(),private.portal_teacher_id(),private.teacher_attendance_access(uuid,uuid,integer) TO authenticated;

DO $$ DECLARE t text; admin text := '(select auth.uid()) = ''85bec2fc-13df-4b53-84a3-9e15d14da142''::uuid'; read_rule text; insert_rule text; write_rule text;
BEGIN
  FOREACH t IN ARRAY ARRAY['students','teachers','student_dues','transactions','attendance','exam_marks','results','leave_applications','teacher_salaries','profiles'] LOOP
    read_rule:=admin; write_rule:=admin; insert_rule:=admin;
    IF t='students' THEN
      read_rule:=admin || ' OR id=(select private.portal_student_id())';
      insert_rule:=admin || ' OR (auth.uid() IS NULL AND status=''pending'' AND auth_user_id IS NULL)';
    ELSIF t='teachers' THEN read_rule:=admin || ' OR id=(select private.portal_teacher_id())';
    ELSIF t='student_dues' THEN read_rule:=admin || ' OR student_id=(select private.portal_student_id())';
    ELSIF t='transactions' THEN read_rule:=admin || ' OR student_id=(select private.portal_student_number())';
    ELSIF t='exam_marks' THEN read_rule:=admin || ' OR (student_id=(select private.portal_student_number()) AND EXISTS (SELECT 1 FROM public.exams e WHERE e.id=exam_id AND e.status=''published''))';
    ELSIF t='attendance' THEN
      read_rule:=admin || ' OR student_id=(select private.portal_student_id()) OR private.teacher_attendance_access(class_id,student_id,branch_id::integer)';
      write_rule:=admin || ' OR (private.teacher_attendance_access(class_id,student_id,branch_id::integer) AND date=(now() AT TIME ZONE ''Asia/Dhaka'')::date AND status IN (''present'',''absent'',''late'',''leave''))';
      insert_rule:=write_rule;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY portal_read ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (%s)',t,read_rule);
    EXECUTE format('CREATE POLICY portal_no_anon_read ON public.%I AS RESTRICTIVE FOR SELECT TO anon USING (false)',t);
    EXECUTE format('CREATE POLICY portal_insert ON public.%I AS RESTRICTIVE FOR INSERT TO public WITH CHECK (%s)',t,insert_rule);
    EXECUTE format('CREATE POLICY portal_update ON public.%I AS RESTRICTIVE FOR UPDATE TO public USING (%s) WITH CHECK (%s)',t,write_rule,write_rule);
    EXECUTE format('CREATE POLICY portal_delete ON public.%I AS RESTRICTIVE FOR DELETE TO public USING (%s)',t,admin);
  END LOOP;
END $$;
COMMIT;
