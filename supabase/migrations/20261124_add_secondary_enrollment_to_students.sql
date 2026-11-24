-- ============================================================
-- Migration: Add secondary academic enrollment columns to students
-- Date: 2026-11-24
-- Purpose: Allow Hifz (হিফজুল কুরআন) students to also be listed
--          and sit for exams/results in another department/class
--          (e.g., কিতাব বিভাগ - চতুর্থ শ্রেণি) without duplicating
--          Student ID, attendance, or monthly fees.
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS secondary_department text,
  ADD COLUMN IF NOT EXISTS secondary_class_name text,
  ADD COLUMN IF NOT EXISTS secondary_roll_number text;

CREATE INDEX IF NOT EXISTS idx_students_secondary_enrollment
  ON public.students (branch_id, academic_year, secondary_class_name)
  WHERE secondary_class_name IS NOT NULL;
