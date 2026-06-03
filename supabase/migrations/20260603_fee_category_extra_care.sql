-- ============================================================
-- Migration: Add fee_category to fee_types & extra_care_enabled to students
-- Date: 2026-06-03
-- Purpose: Support residential/optional fee categories and
--          extra care feature for non-residential students
-- ============================================================

-- 1. Add fee_category column to fee_types
-- Values: 'common' (সাধারণ), 'residential' (আবাসিক), 'optional' (ঐচ্ছিক/Extra Care)
ALTER TABLE public.fee_types
  ADD COLUMN IF NOT EXISTS fee_category TEXT
  CHECK (fee_category IN ('common', 'residential', 'optional'))
  DEFAULT 'common';

-- 2. Add extra_care_enabled to students table
-- Only applicable for non-residential students who opt-in
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS extra_care_enabled BOOLEAN DEFAULT false;

-- 3. Index for faster fee category lookups during generation
CREATE INDEX IF NOT EXISTS idx_fee_types_category
  ON public.fee_types (fee_category, is_active);

-- 4. Update existing fee_types to 'common' if null
UPDATE public.fee_types
SET fee_category = 'common'
WHERE fee_category IS NULL;

-- 5. RLS policy for the new column (already covered by existing policies)
-- No additional RLS changes needed since fee_types and students
-- already have permissive "all access" policies.
