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
        WHERE id = (v_fee->>'due_id')::uuid;

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
            (v_fee->>'due_id')::uuid
        ) RETURNING id INTO v_tx_id;
        
        v_total_paid := v_total_paid + (v_fee->>'pay_amount')::numeric;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'total_paid', v_total_paid);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process bulk payments: %', SQLERRM;
END;
$$;
