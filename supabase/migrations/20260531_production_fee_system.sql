-- Production-ready fee ledger fixes.
-- Keeps generated fees traceable by branch/class/month and keeps net amounts reliable.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.fee_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_bn text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fee_structures
  ADD COLUMN IF NOT EXISTS fee_type_id uuid REFERENCES public.fee_types(id),
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.student_dues
  ADD COLUMN IF NOT EXISTS fee_type_id uuid REFERENCES public.fee_types(id),
  ADD COLUMN IF NOT EXISTS net_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_month integer CHECK (fee_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS fee_year integer,
  ADD COLUMN IF NOT EXISTS payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_no text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.student_dues sd
SET fee_type_id = fs.fee_type_id
FROM public.fee_structures fs
WHERE sd.fee_structure_id = fs.id
  AND sd.fee_type_id IS NULL
  AND fs.fee_type_id IS NOT NULL;

UPDATE public.student_dues
SET net_amount = GREATEST(COALESCE(amount, 0) + COALESCE(fine, 0) - COALESCE(waiver, 0), 0)
WHERE net_amount IS NULL
   OR (net_amount = 0 AND COALESCE(amount, 0) + COALESCE(fine, 0) - COALESCE(waiver, 0) > 0);

CREATE OR REPLACE FUNCTION public.sync_student_due_amounts()
RETURNS trigger AS $$
BEGIN
  NEW.net_amount := GREATEST(COALESCE(NEW.amount, 0) + COALESCE(NEW.fine, 0) - COALESCE(NEW.waiver, 0), 0);
  NEW.updated_at := now();

  IF COALESCE(NEW.paid_amount, 0) >= NEW.net_amount THEN
    NEW.status := 'paid';
  ELSIF COALESCE(NEW.paid_amount, 0) > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.status IS NULL OR NEW.status IN ('paid', 'partial') THEN
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_student_due_amounts ON public.student_dues;
CREATE TRIGGER trigger_sync_student_due_amounts
BEFORE INSERT OR UPDATE ON public.student_dues
FOR EACH ROW
EXECUTE FUNCTION public.sync_student_due_amounts();

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_dues_unique_monthly_fee
ON public.student_dues (student_id, fee_structure_id, fee_month, fee_year)
WHERE fee_month IS NOT NULL AND fee_year IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_dues_collection_lookup
ON public.student_dues (student_id, status, fee_year, fee_month);

CREATE INDEX IF NOT EXISTS idx_fee_structures_active_lookup
ON public.fee_structures (branch_id, class_name, fee_type_id, is_active);
