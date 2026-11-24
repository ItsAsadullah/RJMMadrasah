BEGIN;
ALTER TABLE public.teacher_salaries ADD COLUMN IF NOT EXISTS transaction_id bigint REFERENCES public.transactions(id);
CREATE UNIQUE INDEX IF NOT EXISTS teacher_salary_transaction_unique ON public.teacher_salaries(transaction_id);

CREATE OR REPLACE FUNCTION public.manage_teacher_salary(action text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE salary public.teacher_salaries%rowtype; tx bigint; teacher public.teachers%rowtype; v_amount numeric;
BEGIN
  IF auth.uid() IS DISTINCT FROM '85bec2fc-13df-4b53-84a3-9e15d14da142'::uuid THEN
    RAISE EXCEPTION 'Administrator permission required' USING ERRCODE='42501';
  END IF;
  IF action NOT IN ('create','update','delete') THEN RAISE EXCEPTION 'Unknown action'; END IF;
  IF action <> 'delete' THEN
    v_amount := (payload->>'amount')::numeric;
    IF v_amount IS NULL OR v_amount <= 0 OR v_amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid salary amount'; END IF;
  END IF;
  IF action = 'create' THEN
    SELECT * INTO STRICT teacher FROM public.teachers WHERE id=(payload->>'teacher_id')::uuid FOR UPDATE;
    IF (payload->>'month')::int NOT BETWEEN 0 AND 11 OR (payload->>'year')::int NOT BETWEEN 2000 AND 2200 THEN RAISE EXCEPTION 'Invalid salary period'; END IF;
    INSERT INTO public.transactions(amount,type,fund_type,description,transaction_date,branch_id,created_by,payment_method)
    VALUES(v_amount,'expense','general','শিক্ষক বেতন - ' || teacher.name || ' - ' || (payload->>'month') || '/' || (payload->>'year'),
      (now() AT TIME ZONE 'Asia/Dhaka')::date,teacher.branch_id,auth.uid(),coalesce(payload->>'payment_method','cash')) RETURNING id INTO tx;
    INSERT INTO public.teacher_salaries(teacher_id,base_amount,net_amount,salary_month,salary_year,payment_date,payment_method,remarks,created_by,transaction_id)
    VALUES(teacher.id,coalesce((payload->>'base_amount')::numeric,v_amount),v_amount,(payload->>'month')::int,(payload->>'year')::int,
      (now() AT TIME ZONE 'Asia/Dhaka')::date,coalesce(payload->>'payment_method','cash'),payload->>'remarks',auth.uid(),tx) RETURNING * INTO salary;
  ELSE
    SELECT * INTO STRICT salary FROM public.teacher_salaries WHERE id=(payload->>'id')::uuid FOR UPDATE;
    IF salary.transaction_id IS NULL THEN RAISE EXCEPTION 'Legacy salary requires ledger reconciliation before editing'; END IF;
    PERFORM 1 FROM public.transactions WHERE id=salary.transaction_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Linked ledger entry missing'; END IF;
    IF action='update' THEN
      UPDATE public.transactions SET amount=v_amount,payment_method=payload->>'payment_method' WHERE id=salary.transaction_id;
      UPDATE public.teacher_salaries SET net_amount=v_amount,payment_method=payload->>'payment_method',remarks=payload->>'remarks' WHERE id=salary.id;
    ELSE
      DELETE FROM public.teacher_salaries WHERE id=salary.id;
      DELETE FROM public.transactions WHERE id=salary.transaction_id;
    END IF;
  END IF;
  RETURN jsonb_build_object('success',true,'id',salary.id,'transaction_id',salary.transaction_id);
END $$;
REVOKE EXECUTE ON FUNCTION public.manage_teacher_salary(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_teacher_salary(text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_teacher_salaries_bulk(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE entry jsonb;
BEGIN
  IF auth.uid() IS DISTINCT FROM '85bec2fc-13df-4b53-84a3-9e15d14da142'::uuid THEN RAISE EXCEPTION 'Administrator permission required' USING ERRCODE='42501'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(payload->'salaries') ORDER BY value->>'teacher_id' LOOP
    PERFORM public.manage_teacher_salary('create', entry || jsonb_build_object('month',payload->'month','year',payload->'year','payment_method','cash'));
  END LOOP;
  RETURN jsonb_build_object('success',true);
END $$;
REVOKE EXECUTE ON FUNCTION public.process_teacher_salaries_bulk(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.process_teacher_salaries_bulk(jsonb) TO authenticated;
COMMIT;
