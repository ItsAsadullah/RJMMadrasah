-- ============================================================
-- Chairman Profile Schema Migration
-- Run this in the Supabase SQL Editor for rjmm.edu.bd
-- ============================================================

-- 1. Core chairman profile table
create table if not exists public.chairman_profiles (
  id                    uuid default gen_random_uuid() primary key,
  name_bn               text,
  name_en               text,
  designation_bn        text,
  designation_en        text,
  honorific_bn          text,
  honorific_en          text,
  introduction_bn       text,
  introduction_en       text,
  biography_bn          text,
  biography_en          text,
  message_bn            text,
  message_en            text,
  phone_primary         text,
  phone_secondary       text,
  whatsapp              text,
  email                 text,
  office_address_bn     text,
  office_address_en     text,
  postal_address        text,
  google_maps_link      text,
  office_hours          text,
  photo_url             text,
  cover_url             text,
  signature_url         text,
  social_links          jsonb default '{}'::jsonb,
  status                text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  seo_title             text,
  seo_description       text,
  seo_image_url         text,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null,
  updated_by            text
);

-- 2. Education records
create table if not exists public.chairman_education (
  id              uuid default gen_random_uuid() primary key,
  profile_id      uuid references public.chairman_profiles(id) on delete cascade,
  degree_bn       text,
  degree_en       text,
  institution_bn  text,
  institution_en  text,
  subject_bn      text,
  subject_en      text,
  passing_year    text,
  description_bn  text,
  description_en  text,
  sort_order      integer default 0,
  created_at      timestamptz default now() not null
);

-- 3. Career / experience records
create table if not exists public.chairman_experiences (
  id                    uuid default gen_random_uuid() primary key,
  profile_id            uuid references public.chairman_profiles(id) on delete cascade,
  position_bn           text,
  position_en           text,
  organization_bn       text,
  organization_en       text,
  start_date            text,
  end_date              text,
  is_current            boolean default false,
  responsibilities_bn   text,
  responsibilities_en   text,
  experience_type       text default 'career' check (experience_type in ('career', 'institutional')),
  sort_order            integer default 0,
  created_at            timestamptz default now() not null
);

-- 4. Achievements / awards
create table if not exists public.chairman_achievements (
  id              uuid default gen_random_uuid() primary key,
  profile_id      uuid references public.chairman_profiles(id) on delete cascade,
  title_bn        text,
  title_en        text,
  description_bn  text,
  description_en  text,
  year            text,
  image_url       text,
  sort_order      integer default 0,
  created_at      timestamptz default now() not null
);

-- 5. Public documents
create table if not exists public.chairman_documents (
  id              uuid default gen_random_uuid() primary key,
  profile_id      uuid references public.chairman_profiles(id) on delete cascade,
  title_bn        text,
  title_en        text,
  file_url        text not null,
  file_type       text,
  is_public       boolean default true,
  sort_order      integer default 0,
  created_at      timestamptz default now() not null
);

-- Indexes
create index if not exists idx_chairman_education_profile on public.chairman_education(profile_id, sort_order);
create index if not exists idx_chairman_experiences_profile on public.chairman_experiences(profile_id, sort_order);
create index if not exists idx_chairman_achievements_profile on public.chairman_achievements(profile_id, sort_order);
create index if not exists idx_chairman_documents_profile on public.chairman_documents(profile_id, sort_order);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_chairman_profiles_updated_at on public.chairman_profiles;
create trigger trg_chairman_profiles_updated_at
  before update on public.chairman_profiles
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.chairman_profiles    enable row level security;
alter table public.chairman_education   enable row level security;
alter table public.chairman_experiences enable row level security;
alter table public.chairman_achievements enable row level security;
alter table public.chairman_documents   enable row level security;

-- Public read policies (only published)
drop policy if exists "Public read published chairman" on public.chairman_profiles;
create policy "Public read published chairman" on public.chairman_profiles
  for select using (status = 'published');

drop policy if exists "Public read chairman education" on public.chairman_education;
create policy "Public read chairman education" on public.chairman_education
  for select using (
    exists (select 1 from public.chairman_profiles p where p.id = profile_id and p.status = 'published')
  );

drop policy if exists "Public read chairman experiences" on public.chairman_experiences;
create policy "Public read chairman experiences" on public.chairman_experiences
  for select using (
    exists (select 1 from public.chairman_profiles p where p.id = profile_id and p.status = 'published')
  );

drop policy if exists "Public read chairman achievements" on public.chairman_achievements;
create policy "Public read chairman achievements" on public.chairman_achievements
  for select using (
    exists (select 1 from public.chairman_profiles p where p.id = profile_id and p.status = 'published')
  );

drop policy if exists "Public read chairman documents" on public.chairman_documents;
create policy "Public read chairman documents" on public.chairman_documents
  for select using (
    is_public = true and
    exists (select 1 from public.chairman_profiles p where p.id = profile_id and p.status = 'published')
  );

-- Admin full access (Authenticated users)
drop policy if exists "Admin full access chairman_profiles" on public.chairman_profiles;
create policy "Admin full access chairman_profiles" on public.chairman_profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Admin full access chairman_education" on public.chairman_education;
create policy "Admin full access chairman_education" on public.chairman_education
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Admin full access chairman_experiences" on public.chairman_experiences;
create policy "Admin full access chairman_experiences" on public.chairman_experiences
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Admin full access chairman_achievements" on public.chairman_achievements;
create policy "Admin full access chairman_achievements" on public.chairman_achievements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Admin full access chairman_documents" on public.chairman_documents;
create policy "Admin full access chairman_documents" on public.chairman_documents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
