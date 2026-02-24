-- Fix seo_settings RLS: add INSERT policy so upsert works for authenticated users
-- The original migration only had UPDATE, upsert requires INSERT too

CREATE POLICY IF NOT EXISTS "Admins can insert seo_settings"
  ON public.seo_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Also fix branding_settings similarly (created today, same issue)
CREATE POLICY IF NOT EXISTS "Admins can insert branding_settings"
  ON public.branding_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
