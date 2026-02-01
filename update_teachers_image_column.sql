-- Add image_url column to teachers table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'image_url') THEN
        ALTER TABLE teachers ADD COLUMN image_url text;
    END IF;
END $$;
