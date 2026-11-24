BEGIN;
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  email text CHECK (char_length(email) <= 254),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000)
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT INSERT (name,phone,email,subject,message) ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
CREATE POLICY contact_submit ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_admin_read ON public.contact_messages FOR SELECT TO authenticated
USING ((select auth.uid()) = '85bec2fc-13df-4b53-84a3-9e15d14da142'::uuid);
COMMIT;
