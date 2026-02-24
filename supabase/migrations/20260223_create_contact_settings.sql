-- Contact পেজের সেটিংস টেবিল
CREATE TABLE IF NOT EXISTS contact_settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  -- হিরো সেকশন
  hero_title text NOT NULL DEFAULT 'যোগাযোগ করুন',
  hero_subtitle text NOT NULL DEFAULT 'যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন। আমরা আপনার অপেক্ষায় আছি।',
  -- শাখা ১
  branch1_name text NOT NULL DEFAULT 'শাখা ১: হলিধানী বাজার',
  branch1_address text NOT NULL DEFAULT 'হলিধানী আলিম মাদ্রাসার সামনে, হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০',
  branch1_map_url text NOT NULL DEFAULT 'https://maps.google.com/maps?q=Holidhani%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed',
  -- শাখা ২
  branch2_name text NOT NULL DEFAULT 'শাখা ২: চাঁন্দুয়ালী বাজার',
  branch2_address text NOT NULL DEFAULT 'চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০',
  branch2_map_url text NOT NULL DEFAULT 'https://maps.google.com/maps?q=Chanduali%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed',
  -- যোগাযোগ তথ্য
  phone1 text NOT NULL DEFAULT '+৮৮০ ১৭১২-৩৪৫৬৭৮',
  phone2 text NOT NULL DEFAULT '+৮৮০ ১৮৯০-১২৩৪৫৬',
  email1 text NOT NULL DEFAULT 'info@rahimajannat.edu.bd',
  email2 text NOT NULL DEFAULT 'admin@rahimajannat.edu.bd',
  -- সোশ্যাল লিংক
  facebook_url text NOT NULL DEFAULT '#',
  website_url text NOT NULL DEFAULT '#',
  updated_at timestamptz DEFAULT now()
);

-- RLS চালু
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;

-- সবাই পড়তে পারবে
CREATE POLICY "contact_settings_public_read" ON contact_settings
  FOR SELECT USING (true);

-- শুধু authenticated আপডেট করতে পারবে
CREATE POLICY "contact_settings_admin_write" ON contact_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ডিফল্ট row
INSERT INTO contact_settings (
  hero_title, hero_subtitle,
  branch1_name, branch1_address, branch1_map_url,
  branch2_name, branch2_address, branch2_map_url,
  phone1, phone2, email1, email2,
  facebook_url, website_url
) VALUES (
  'যোগাযোগ করুন',
  'যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন। আমরা আপনার অপেক্ষায় আছি।',
  'শাখা ১: হলিধানী বাজার',
  'হলিধানী আলিম মাদ্রাসার সামনে, হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০',
  'https://maps.google.com/maps?q=Holidhani%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed',
  'শাখা ২: চাঁন্দুয়ালী বাজার',
  'চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০',
  'https://maps.google.com/maps?q=Chanduali%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed',
  '+৮৮০ ১৭১২-৩৪৫৬৭৮',
  '+৮৮০ ১৮৯০-১২৩৪৫৬',
  'info@rahimajannat.edu.bd',
  'admin@rahimajannat.edu.bd',
  '#',
  '#'
) ON CONFLICT DO NOTHING;
