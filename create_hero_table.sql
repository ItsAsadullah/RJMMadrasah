-- Create a table for Hero Section Content
create table public.hero_content (
  id uuid default gen_random_uuid() primary key,
  section text not null check (section in ('main_slider', 'promo_banner', 'video')),
  content_url text not null, -- Image URL for slider/banner, Video URL for video
  title text, -- Title for slider or video
  subtitle text, -- Subtitle for slider
  link text, -- Link for promo banner
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.hero_content enable row level security;

-- Create policies
create policy "Allow public read access" on public.hero_content
  for select using (true);

create policy "Allow admin full access" on public.hero_content
  for all using (auth.role() = 'authenticated');
