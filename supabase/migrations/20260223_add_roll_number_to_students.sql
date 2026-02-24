-- students টেবিলে রোল নম্বর কলাম যোগ করা
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number text DEFAULT '';
