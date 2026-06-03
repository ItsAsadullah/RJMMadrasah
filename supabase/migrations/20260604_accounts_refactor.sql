-- 1. Add metadata column to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing donation descriptions to metadata is skipped. Will rely on UI fallback.

-- 3. RPC: get_accounts_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_accounts_dashboard_stats(p_branch_id INT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_income NUMERIC := 0;
    v_total_expense NUMERIC := 0;
    v_lillah_fund NUMERIC := 0;
    v_total_due NUMERIC := 0;
    v_due_students INT := 0;
    v_teachers_paid INT := 0;
    v_teachers_total INT := 0;
    v_current_month INT := EXTRACT(MONTH FROM CURRENT_DATE) - 1; -- JS month is 0-indexed
    v_current_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Transactions stats
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'income' AND fund_type = 'lillah' THEN amount 
                          WHEN type = 'expense' AND fund_type = 'lillah' THEN -amount 
                          ELSE 0 END), 0)
    INTO v_total_income, v_total_expense, v_lillah_fund
    FROM public.transactions
    WHERE (p_branch_id IS NULL OR branch_id = p_branch_id);

    -- Dues stats
    WITH student_dues_calc AS (
        SELECT 
            sd.student_id,
            sd.amount, sd.fine, sd.waiver, sd.net_amount, sd.paid_amount
        FROM public.student_dues sd
        JOIN public.students s ON s.student_id = sd.student_id
        WHERE sd.status NOT IN ('paid', 'waived')
          AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    )
    SELECT 
        COALESCE(SUM(GREATEST(
            COALESCE(net_amount, GREATEST(COALESCE(amount,0) + COALESCE(fine,0) - COALESCE(waiver,0), 0)) - COALESCE(paid_amount,0), 0
        )), 0),
        COUNT(DISTINCT student_id)
    INTO v_total_due, v_due_students
    FROM student_dues_calc
    WHERE GREATEST(
            COALESCE(net_amount, GREATEST(COALESCE(amount,0) + COALESCE(fine,0) - COALESCE(waiver,0), 0)) - COALESCE(paid_amount,0), 0
          ) > 0;

    -- Teacher stats
    SELECT COUNT(id) INTO v_teachers_total
    FROM public.teachers
    WHERE (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND status = 'active';

    IF v_teachers_total > 0 THEN
        SELECT COUNT(DISTINCT ts.teacher_id) INTO v_teachers_paid
        FROM public.teacher_salaries ts
        JOIN public.teachers t ON t.id = ts.teacher_id
        WHERE ts.salary_month = v_current_month
        AND ts.salary_year = v_current_year
        AND (p_branch_id IS NULL OR t.branch_id = p_branch_id);
    END IF;

    RETURN jsonb_build_object(
        'totalIncome', v_total_income,
        'totalExpense', v_total_expense,
        'balance', v_total_income - v_total_expense,
        'lillahFund', v_lillah_fund,
        'totalDue', v_total_due,
        'dueStudents', v_due_students,
        'teachersPaid', v_teachers_paid,
        'teachersTotal', v_teachers_total
    );
END;
$$;


-- 4. RPC: process_fee_payments_bulk
CREATE OR REPLACE FUNCTION public.process_fee_payments_bulk(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fee JSONB;
    v_tx_id BIGINT;
    v_total_paid NUMERIC := 0;
BEGIN
    FOR v_fee IN SELECT * FROM jsonb_array_elements(payload->'fees')
    LOOP
        -- Update student_dues
        UPDATE public.student_dues
        SET 
            paid_amount = (v_fee->>'new_paid_amount')::numeric,
            status = v_fee->>'new_status',
            net_amount = (v_fee->>'net_amount')::numeric,
            waiver = (v_fee->>'waiver')::numeric,
            payment_date = NOW(),
            receipt_no = payload->>'receipt_no',
            updated_at = NOW()
        WHERE id = (v_fee->>'due_id')::bigint;

        -- Insert transaction for this specific fee
        INSERT INTO public.transactions (
            amount,
            type,
            fund_type,
            description,
            transaction_date,
            created_by,
            student_id,
            branch_id,
            payment_method,
            due_id
        ) VALUES (
            (v_fee->>'pay_amount')::numeric,
            'income',
            'general',
            (v_fee->>'description') || ' | রসিদ: ' || (payload->>'receipt_no'),
            CURRENT_DATE,
            (payload->>'user_id')::uuid,
            payload->>'student_id',
            (payload->>'branch_id')::int,
            payload->>'payment_method',
            (v_fee->>'due_id')::bigint
        ) RETURNING id INTO v_tx_id;
        
        v_total_paid := v_total_paid + (v_fee->>'pay_amount')::numeric;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'total_paid', v_total_paid);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process bulk payments: %', SQLERRM;
END;
$$;


-- 5. RPC: process_teacher_salaries_bulk
CREATE OR REPLACE FUNCTION public.process_teacher_salaries_bulk(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salary JSONB;
BEGIN
    FOR v_salary IN SELECT * FROM jsonb_array_elements(payload->'salaries')
    LOOP
        -- Insert Transaction
        INSERT INTO public.transactions (
            amount,
            type,
            fund_type,
            description,
            transaction_date,
            branch_id,
            created_by
        ) VALUES (
            (v_salary->>'amount')::numeric,
            'expense',
            'general',
            v_salary->>'description',
            CURRENT_DATE,
            (v_salary->>'branch_id')::int,
            (payload->>'user_id')::uuid
        );

        -- Insert Teacher Salary
        INSERT INTO public.teacher_salaries (
            teacher_id,
            base_amount,
            net_amount,
            salary_month,
            salary_year,
            payment_date,
            payment_method,
            created_by
        ) VALUES (
            (v_salary->>'teacher_id')::uuid,
            (v_salary->>'base_amount')::numeric,
            (v_salary->>'amount')::numeric,
            (payload->>'month')::int,
            (payload->>'year')::int,
            CURRENT_DATE,
            'cash',
            (payload->>'user_id')::uuid
        );
    END LOOP;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process bulk salaries: %', SQLERRM;
END;
$$;
