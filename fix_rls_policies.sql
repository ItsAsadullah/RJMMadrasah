-- Enable RLS for tables
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create basic policies to allow access (Adjust these based on your security needs)
-- For public read access (if needed):
CREATE POLICY "Public read access" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.categories FOR SELECT USING (true);

-- For admin full access (assuming authenticated users are admins):
CREATE POLICY "Admin full access" ON public.notices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
