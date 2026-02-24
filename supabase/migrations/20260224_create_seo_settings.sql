-- SEO Settings table
create table if not exists public.seo_settings (
  id          serial primary key,
  og_title    text not null default 'রহিমা জান্নাত মহিলা মাদ্রাসা | দ্বীনি শিক্ষা প্রতিষ্ঠান, ঝিনাইদহ',
  og_description text not null default 'রহিমা জান্নাত মহিলা মাদ্রাসা — ঝিনাইদহ জেলার হলিধানী ও চাঁন্দুয়ালীতে অবস্থিত একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান।',
  og_image_url text not null default 'https://rjmm.edu.bd/og-image.png',
  site_keywords text not null default 'রহিমা জান্নাত মহিলা মাদ্রাসা, মহিলা মাদ্রাসা ঝিনাইদহ, হিফজুল কুরআন, নূরানী মাদ্রাসা',
  updated_at  timestamptz default now()
);

-- Insert default row if empty
insert into public.seo_settings (id) values (1)
on conflict (id) do nothing;

-- RLS
alter table public.seo_settings enable row level security;

create policy "Public can read seo_settings"
  on public.seo_settings for select using (true);

create policy "Admins can update seo_settings"
  on public.seo_settings for update
  using (auth.role() = 'authenticated');
