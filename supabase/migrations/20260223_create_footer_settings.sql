-- Footer সেটিংস টেবিল
CREATE TABLE IF NOT EXISTS footer_settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_name text NOT NULL DEFAULT 'রহিমা জান্নাত',
  branch1_name text NOT NULL DEFAULT 'শাখা ১',
  branch1_address text NOT NULL DEFAULT 'হলিধানী বাজার, ঝিনাইদহ সদর',
  branch2_name text NOT NULL DEFAULT 'শাখা ২',
  branch2_address text NOT NULL DEFAULT 'চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর',
  phone text NOT NULL DEFAULT '+৮৮০ ১৭XX-XXXXXX',
  email text NOT NULL DEFAULT 'info@rahimajannat.com',
  facebook_url text NOT NULL DEFAULT '#',
  copyright_text text NOT NULL DEFAULT 'রহিমা জান্নাত মহিলা মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।',
  updated_at timestamptz DEFAULT now()
);

-- RLS চালু করুন
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;

-- সবাই পড়তে পারবে (public website এর জন্য)
CREATE POLICY "footer_settings_public_read" ON footer_settings
  FOR SELECT USING (true);

-- শুধুমাত্র authenticated admin আপডেট করতে পারবে
CREATE POLICY "footer_settings_admin_update" ON footer_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ডিফল্ট row ইনসার্ট (একটিই row থাকবে সবসময়)
INSERT INTO footer_settings (
  school_name, 
  branch1_name, branch1_address, 
  branch2_name, branch2_address, 
  phone, email, facebook_url, copyright_text
) VALUES (
  'রহিমা জান্নাত',
  'শাখা ১', 'হলিধানী বাজার, ঝিনাইদহ সদর',
  'শাখা ২', 'চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর',
  '+৮৮০ ১৭XX-XXXXXX',
  'info@rahimajannat.com',
  '#',
  'রহিমা জান্নাত মহিলা মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।'
) ON CONFLICT DO NOTHING;
