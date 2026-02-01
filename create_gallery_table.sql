-- Create Gallery Table
create table if not exists public.gallery_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('image', 'video')),
  url text not null,
  thumbnail_url text, -- For video thumbnails or just separate
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.gallery_items enable row level security;

-- Create policies
create policy "Enable read access for all users"
on public.gallery_items for select
to public
using (true);

create policy "Enable insert for authenticated users only"
on public.gallery_items for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users only"
on public.gallery_items for update
to authenticated
using (true);

create policy "Enable delete for authenticated users only"
on public.gallery_items for delete
to authenticated
using (true);
