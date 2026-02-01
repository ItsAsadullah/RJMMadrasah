-- Add marked_by and remark columns to attendance table
ALTER TABLE attendance 
ADD COLUMN marked_by uuid REFERENCES teachers(id),
ADD COLUMN remark text;

COMMENT ON COLUMN attendance.marked_by IS 'Teacher ID who took the attendance';
COMMENT ON COLUMN attendance.remark IS 'Optional remark for the attendance record';
