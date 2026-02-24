-- Branding Settings table
-- Stores logo, long logo, and favicon URLs for dynamic updating from admin panel

CREATE TABLE IF NOT EXISTS public.branding_settings (
  id          integer primary key default 1,
  logo_url        text not null default '/images/logo.png',
  long_logo_url   text not null default '/images/long_logo.svg',
  favicon_url     text not null default '/images/logo.png',
  updated_at  timestamptz default now(),
  CONSTRAINT branding_settings_single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO public.branding_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read branding_settings"
  ON public.branding_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update branding_settings"
  ON public.branding_settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Storage bucket for branding assets (run separately if bucket doesn't exist)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('branding-assets', 'branding-assets', true)
-- ON CONFLICT (id) DO NOTHING;
