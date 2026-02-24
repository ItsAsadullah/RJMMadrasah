-- Features Section সেটিংস টেবিল
CREATE TABLE IF NOT EXISTS features_settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  section_title text NOT NULL DEFAULT 'আমাদের বৈশিষ্ট্যসমূহ',
  section_subtitle text NOT NULL DEFAULT 'কেন আপনার সন্তানের জন্য রহিমা জান্নাত মহিলা মাদ্রাসা সেরা? আমাদের অনন্য বৈশিষ্ট্যগুলো জানুন।',
  -- features: JSON array of {icon, title, points: string[]}
  features jsonb NOT NULL DEFAULT '[
    {
      "icon": "BookOpen",
      "title": "সহীহ কুরআন শিক্ষা",
      "points": [
        "আন্তর্জাতিক মানের কারিকুলাম অনুসরণ",
        "অভিজ্ঞ হাফেজ ও কারী দ্বারা পাঠদান",
        "সহীহ মাখরাজ ও তাজবীদ শিক্ষা",
        "নাজেরা ও হিফজ বিভাগের বিশেষ যত্ন"
      ]
    },
    {
      "icon": "GraduationCap",
      "title": "মানসম্মত শিক্ষা",
      "points": [
        "ইসলামী ও আধুনিক শিক্ষার সুষম সমন্বয়",
        "বাংলা, ইংরেজি ও গণিত বিষয়ে গুরুত্বারোপ",
        "অভিজ্ঞ ও উচ্চশিক্ষিত শিক্ষকমণ্ডলী",
        "নিয়মিত মানোন্নয়ন ও কাউন্সিলিং"
      ]
    },
    {
      "icon": "ShieldCheck",
      "title": "নিরাপদ ও মনোরম পরিবেশ",
      "points": [
        "বালিকাদের জন্য সম্পূর্ণ পর্দা মেইনটেইন",
        "সিসি ক্যামেরা দ্বারা নিয়ন্ত্রিত ক্যাম্পাস",
        "মনোরম ও কোলাহলমুক্ত পরিবেশ",
        "নিরাপদ ও আলাদা ক্যাম্পাস নিশ্চিতকরণ"
      ]
    },
    {
      "icon": "HeartHandshake",
      "title": "নৈতিক ও চারিত্রিক গঠন",
      "points": [
        "সুন্নতী জিন্দেগী যাপনের অনুশীলন",
        "আদব-কায়দা ও শিষ্টাচার শিক্ষা",
        "নিয়মিত তারবিয়াতী মজলিস",
        "আমল-আখলাক সুন্দর করার প্রচেষ্টা"
      ]
    }
  ]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE features_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "features_settings_public_read" ON features_settings
  FOR SELECT USING (true);

CREATE POLICY "features_settings_admin_write" ON features_settings
  FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO features_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
