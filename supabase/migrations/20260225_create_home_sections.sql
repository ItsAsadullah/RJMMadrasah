-- Create home_sections table for managing homepage content
CREATE TABLE IF NOT EXISTS public.home_sections (
  id bigserial PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  content text DEFAULT '',
  image_url text DEFAULT '',
  additional_data jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public Read home_sections"
  ON public.home_sections FOR SELECT
  USING (true);

-- Authenticated (admin) can do everything
CREATE POLICY "Admin Manage home_sections"
  ON public.home_sections FOR ALL
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.update_home_sections_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_home_sections_updated_at ON public.home_sections;
CREATE TRIGGER trg_home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_home_sections_updated_at();
