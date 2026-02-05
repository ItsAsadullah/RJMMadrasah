
-- Add allow_residential column to academic_classes
ALTER TABLE academic_classes ADD COLUMN IF NOT EXISTS allow_residential boolean DEFAULT true;
