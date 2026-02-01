-- Add Unique Constraint for Upsert
ALTER TABLE attendance
ADD CONSTRAINT unique_attendance_per_student_per_day UNIQUE (student_id, date);
