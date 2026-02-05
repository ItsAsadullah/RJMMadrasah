-- Add is_active column to academic_subjects to support soft delete / deactivation
ALTER TABLE academic_subjects
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

UPDATE academic_subjects
SET is_active = true
WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_academic_subjects_class_active
ON academic_subjects (class_id, is_active);
