-- Add user_id and password columns to teachers table
ALTER TABLE teachers 
ADD COLUMN user_id text UNIQUE,
ADD COLUMN password text;

-- Optional: Add a comment or default values if needed
COMMENT ON COLUMN teachers.user_id IS 'Login ID for teacher portal';
COMMENT ON COLUMN teachers.password IS 'Login password for teacher portal';
