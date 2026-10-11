-- ============================================================
-- INSERT / UPDATE CHAIRMAN PROFILE DATA
-- Run this in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_profile_id UUID;
BEGIN

-- Check if a chairman profile already exists
SELECT id INTO v_profile_id FROM public.chairman_profiles ORDER BY created_at DESC LIMIT 1;

IF v_profile_id IS NOT NULL THEN
  -- 1. Update existing profile with provided data
  UPDATE public.chairman_profiles SET
    honorific_bn      = 'হযরত মাওলানা',
    honorific_en      = 'Hazrat Maulana',
    name_bn           = 'মাওলানা আব্দুর রহমান আল আজাদ',
    name_en           = 'Maulana Abdur Rahman Al Azad',
    designation_bn    = 'প্রতিষ্ঠাতা চেয়ারম্যান',
    designation_en    = 'Founder & Chairman',
    phone_primary     = '01988214554',
    whatsapp          = '01988214554',
    email             = 'chairman@rahimajannat.edu.bd',
    introduction_bn   = 'ঝিনাইদহ জেলার বিশিষ্ট ইসলামী পণ্ডিত, শিক্ষানুরাগী ও সমাজসেবক। তিনি নারী শিক্ষার উন্নয়নে নিরলস কাজ করে যাচ্ছেন এবং রহিমা জান্নাত মহিলা মাদ্রাসা প্রতিষ্ঠার মাধ্যমে অঞ্চলের হাজারো মেয়েদের দ্বীনি শিক্ষার আলো দিচ্ছেন।',
    introduction_en   = 'Prominent Islamic scholar, educational visionary, and social reformer of Jhenaidah. He tirelessly works for female education and is enlightening thousands of girls through Rahima Jannat Mohila Madrasah.',
    biography_bn      = 'হযরত মাওলানা আব্দুর রহমান আল আজাদ দীর্ঘ তিন দশকেরও বেশি সময় ধরে ইসলামী শিক্ষা বিস্তার, সমাজ সংস্কার ও মানবকল্যাণে আত্মনিয়োগ করে আসছেন। তিনি দেশের শীর্ষস্থানীয় দ্বীনি শিক্ষা প্রতিষ্ঠান থেকে দাওরায়ে হাদীস সম্পন্ন করেন। প্রত্যন্ত অঞ্চলের নারীদের মাঝে কুরআন-সুন্নাহর সঠিক জ্ঞান ও চরিত্র গঠনের উদ্দেশ্যে তিনি ঝিনাইদহ সদর উপজেলার হলিধানী বাজার ও চাঁন্দুয়ালী বাজারে রহিমা জান্নাত মহিলা মাদ্রাসা প্রতিষ্ঠা করেন। তাঁর দূরদর্শী নেতৃত্বে প্রতিষ্ঠানটি অত্যন্ত সুনাম ও শৃঙ্খলার সাথে পরিচালিত হয়ে আসছে এবং শত শত নারী শিক্ষার্থী এখানে কুরআনে কারিম হিফজ করছে ও ইসলামী জ্ঞান অর্জন করছে।',
    biography_en      = 'Maulana Abdur Rahman Al Azad has dedicated over three decades to Islamic education and community development. Having completed Dawrah-e-Hadith from a renowned Islamic institution, he founded Rahima Jannat Mohila Madrasah to empower women through holistic moral, religious, and academic excellence in Jhenaidah.',
    message_bn        = 'বিসমিল্লাহির রাহমানির রাহীম। সমস্ত প্রশংসা মহান আল্লাহ তাআলার। একটি আদর্শ ও চরিত্রবান জাতি গঠনে নারীদের দ্বীনি শিক্ষার বিকল্প নেই। আমাদের কন্যা সন্তানদের কুরআন-হাদীসের সুমহান আদর্শে আদর্শবান করে তোলাই এই প্রতিষ্ঠানের মূল লক্ষ্য। আমরা হিফজুল কুরআন, নূরানী এবং কিতাব বিভাগে আন্তরিক পরিবেশে উচ্চমান বজায় রেখে পাঠদান নিশ্চিত করছি। আপনাদের দোয়া ও সহযোগিতায় এই দ্বীনি খেদমত বহুদূর এগিয়ে যাবে, ইনশাআল্লাহ।',
    message_en        = 'In the name of Allah, Most Gracious, Most Merciful. The primary goal of our institution is to educate our daughters with the pristine teachings of the Quran and Sunnah. We are committed to maintaining high standards in Hifzul Quran, Nurani, and Kitab departments in a nurturing environment. With your prayers and support, this sacred mission will go far, InshaAllah.',
    office_address_bn = 'চেয়ারম্যানের কার্যালয়, রহিমা জান্নাত মহিলা মাদ্রাসা, হলিধানী বাজার শাখা, ঝিনাইদহ সদর, ঝিনাইদহ',
    office_address_en = 'Chairman''s Office, Rahima Jannat Mohila Madrasah, Holidhani Bazar Branch, Jhenaidah Sadar, Jhenaidah',
    postal_address    = 'হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০',
    office_hours      = 'সকাল ৯:০০ - দুপুর ২:০০ (শুক্রবার ব্যতীত)',
    social_links      = '{"facebook": "https://facebook.com/rahimajannatmadrasah", "youtube": ""}'::jsonb,
    status            = 'published',
    seo_title         = 'মাওলানা আব্দুর রহমান আল আজাদ — প্রতিষ্ঠাতা চেয়ারম্যান, রহিমা জান্নাত মহিলা মাদ্রাসা',
    seo_description   = 'রহিমা জান্নাত মহিলা মাদ্রাসা, ঝিনাইদহের প্রতিষ্ঠাতা ও চেয়ারম্যান হযরত মাওলানা আব্দুর রহমান আল আজাদের অফিসিয়াল পরিচিতি, জীবনবৃত্তান্ত ও বাণী।',
    updated_at        = now()
  WHERE id = v_profile_id;
  
  RAISE NOTICE 'Updated existing profile with ID: %', v_profile_id;
ELSE
  -- 1. Insert new profile
  INSERT INTO public.chairman_profiles (
    honorific_bn, honorific_en,
    name_bn, name_en,
    designation_bn, designation_en,
    introduction_bn, introduction_en,
    biography_bn, biography_en,
    message_bn, message_en,
    phone_primary, whatsapp, email,
    office_address_bn, office_address_en,
    postal_address, office_hours,
    social_links, status,
    seo_title, seo_description
  ) VALUES (
    'হযরত মাওলানা', 'Hazrat Maulana',
    'মাওলানা আব্দুর রহমান আল আজাদ', 'Maulana Abdur Rahman Al Azad',
    'প্রতিষ্ঠাতা চেয়ারম্যান', 'Founder & Chairman',
    'ঝিনাইদহ জেলার বিশিষ্ট ইসলামী পণ্ডিত, শিক্ষানুরাগী ও সমাজসেবক। তিনি নারী শিক্ষার উন্নয়নে নিরলস কাজ করে যাচ্ছেন এবং রহিমা জান্নাত মহিলা মাদ্রাসা প্রতিষ্ঠার মাধ্যমে অঞ্চলের হাজারো মেয়েদের দ্বীনি শিক্ষার আলো দিচ্ছেন।',
    'Prominent Islamic scholar, educational visionary, and social reformer of Jhenaidah. He tirelessly works for female education and is enlightening thousands of girls through Rahima Jannat Mohila Madrasah.',
    'হযরত মাওলানা আব্দুর রহমান আল আজাদ দীর্ঘ তিন দশকেরও বেশি সময় ধরে ইসলামী শিক্ষা বিস্তার, সমাজ সংস্কার ও মানবকল্যাণে আত্মনিয়োগ করে আসছেন। তিনি দেশের শীর্ষস্থানীয় দ্বীনি শিক্ষা প্রতিষ্ঠান থেকে দাওরায়ে হাদীস সম্পন্ন করেন। প্রত্যন্ত অঞ্চলের নারীদের মাঝে কুরআন-সুন্নাহর সঠিক জ্ঞান ও চরিত্র গঠনের উদ্দেশ্যে তিনি ঝিনাইদহ সদর উপজেলার হলিধানী বাজার ও চাঁন্দুয়ালী বাজারে রহিমা জান্নাত মহিলা মাদ্রাসা প্রতিষ্ঠা করেন। তাঁর দূরদর্শী নেতৃত্বে প্রতিষ্ঠানটি অত্যন্ত সুনাম ও শৃঙ্খলার সাথে পরিচালিত হয়ে আসছে এবং শত শত নারী শিক্ষার্থী এখানে কুরআনে কারিম হিফজ করছে ও ইসলামী জ্ঞান অর্জন করছে।',
    'Maulana Abdur Rahman Al Azad has dedicated over three decades to Islamic education and community development. Having completed Dawrah-e-Hadith from a renowned Islamic institution, he founded Rahima Jannat Mohila Madrasah to empower women through holistic moral, religious, and academic excellence in Jhenaidah.',
    'বিসমিল্লাহির রাহমানির রাহীম। সমস্ত প্রশংসা মহান আল্লাহ তাআলার। একটি আদর্শ ও চরিত্রবান জাতি গঠনে নারীদের দ্বীনি শিক্ষার বিকল্প নেই। আমাদের কন্যা সন্তানদের কুরআন-হাদীসের সুমহান আদর্শে আদর্শবান করে তোলাই এই প্রতিষ্ঠানের মূল লক্ষ্য। আমরা হিফজুল কুরআন, নূরানী এবং কিতাব বিভাগে আন্তরিক পরিবেশে উচ্চমান বজায় রেখে পাঠদান নিশ্চিত করছি। আপনাদের দোয়া ও সহযোগিতায় এই দ্বীনি খেদমত বহুদূর এগিয়ে যাবে, ইনশাআল্লাহ।',
    'In the name of Allah, Most Gracious, Most Merciful. The primary goal of our institution is to educate our daughters with the pristine teachings of the Quran and Sunnah. We are committed to maintaining high standards in Hifzul Quran, Nurani, and Kitab departments in a nurturing environment. With your prayers and support, this sacred mission will go far, InshaAllah.',
    '01988214554', '01988214554', 'chairman@rahimajannat.edu.bd',
    'চেয়ারম্যানের কার্যালয়, রহিমা জান্নাত মহিলা মাদ্রাসা, হলিধানী বাজার শাখা, ঝিনাইদহ সদর, ঝিনাইদহ',
    'Chairman''s Office, Rahima Jannat Mohila Madrasah, Holidhani Bazar Branch, Jhenaidah Sadar, Jhenaidah',
    'হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০',
    'সকাল ৯:০০ - দুপুর ২:০০ (শুক্রবার ব্যতীত)',
    '{"facebook": "https://facebook.com/rahimajannatmadrasah", "youtube": ""}'::jsonb,
    'published',
    'মাওলানা আব্দুর রহমান আল আজাদ — প্রতিষ্ঠাতা চেয়ারম্যান, রহিমা জান্নাত মহিলা মাদ্রাসা',
    'রহিমা জান্নাত মহিলা মাদ্রাসা, ঝিনাইদহের প্রতিষ্ঠাতা ও চেয়ারম্যান হযরত মাওলানা আব্দুর রহমান আল আজাদের অফিসিয়াল পরিচিতি, জীবনবৃত্তান্ত ও বাণী।'
  )
  RETURNING id INTO v_profile_id;
  
  RAISE NOTICE 'Created new profile with ID: %', v_profile_id;
END IF;

-- 2. Clear previous education/experience/achievements for this profile to prevent duplication
DELETE FROM public.chairman_education WHERE profile_id = v_profile_id;
DELETE FROM public.chairman_experiences WHERE profile_id = v_profile_id;
DELETE FROM public.chairman_achievements WHERE profile_id = v_profile_id;

-- 3. Insert education records
INSERT INTO public.chairman_education (
  profile_id, degree_bn, degree_en,
  institution_bn, institution_en,
  subject_bn, subject_en,
  passing_year, description_bn, sort_order
) VALUES
(
  v_profile_id,
  'দাওরায়ে হাদীস (মাস্টার্স সমমান)',
  'Dawrah-e-Hadith (Masters Equivalent)',
  'আল জামিয়াতুল আহলিয়া দারুল উলুম মঈনুল ইসলাম, হাটহাজারী',
  'Al Jamiatul Ahlia Darul Uloom Moinul Islam, Hathazari',
  'হাদীস শাস্ত্র ও ইসলামী শিক্ষা',
  'Hadith Sciences & Islamic Studies',
  '২০০০',
  'বাংলাদেশের শীর্ষস্থানীয় দ্বীনি শিক্ষা প্রতিষ্ঠান থেকে সর্বোচ্চ ডিগ্রি অর্জন।',
  0
),
(
  v_profile_id,
  'আলিম (উচ্চ মাধ্যমিক সমমান)',
  'Alim (Higher Secondary Equivalent)',
  'জামিয়া ইসলামিয়া পটিয়া, চট্টগ্রাম',
  'Jamia Islamia Patiya, Chittagong',
  'ইসলামী শিক্ষা ও আরবি সাহিত্য',
  'Islamic Education & Arabic Literature',
  '১৯৯৫',
  'কৃতিত্বের সাথে আলিম পরীক্ষায় উত্তীর্ণ।',
  1
);

-- 4. Insert experience records
INSERT INTO public.chairman_experiences (
  profile_id, position_bn, position_en,
  organization_bn, organization_en,
  start_date, is_current,
  responsibilities_bn, responsibilities_en,
  experience_type, sort_order
) VALUES
(
  v_profile_id,
  'প্রতিষ্ঠাতা ও চেয়ারম্যান',
  'Founder & Chairman',
  'রহিমা জান্নাত মহিলা মাদ্রাসা, ঝিনাইদহ',
  'Rahima Jannat Mohila Madrasah, Jhenaidah',
  '2018-01-01',
  true,
  'প্রাতিষ্ঠানিক নীতি নির্ধারণ, প্রশাসনিক তদারকি, শিক্ষা মানোন্নয়ন এবং শিক্ষার্থীদের নৈতিক উন্নয়নে নেতৃত্ব প্রদান।',
  'Institutional policy making, administrative oversight, academic quality improvement, and guiding students moral development.',
  'institutional',
  0
),
(
  v_profile_id,
  'খতিব ও ইমাম',
  'Khatib & Imam',
  'কেন্দ্রীয় জামে মসজিদ, হলিধানী বাজার, ঝিনাইদহ',
  'Central Jame Masjid, Holidhani Bazar, Jhenaidah',
  '2005-01-01',
  true,
  'শুক্রবারের খুতবা প্রদান, ধর্মীয় নির্দেশনা ও সমাজের ইসলামী মূল্যবোধ সংরক্ষণে ভূমিকা।',
  'Delivering Friday sermons, religious guidance, and preserving Islamic values in the community.',
  'career',
  1
);

-- 5. Insert achievement records
INSERT INTO public.chairman_achievements (
  profile_id, title_bn, title_en,
  description_bn, description_en,
  year, sort_order
) VALUES
(
  v_profile_id,
  'বিশিষ্ট সমাজসেবা ও নারী শিক্ষা উন্নয়ন সম্মাননা',
  'Distinguished Social Service & Female Education Award',
  'নারী শিক্ষা বিস্তার ও দ্বীনি কার্যক্রমে অনন্য অবদানের স্বীকৃতিস্বরূপ ঝিনাইদহ জেলা প্রশাসন কর্তৃক প্রদত্ত সম্মাননা।',
  'Recognition awarded by Jhenaidah District Administration for outstanding contribution to female education and Islamic activities.',
  '২০২২',
  0
),
(
  v_profile_id,
  'এক হাজারেরও বেশি ছাত্রীর কুরআন হিফজ সম্পন্ন',
  'Over 1000 Students Completed Quran Memorization',
  'প্রতিষ্ঠানের অধীনে এক হাজারেরও বেশি ছাত্রী সফলভাবে হিফজুল কুরআন সম্পন্ন করেছে।',
  'More than a thousand female students have successfully completed Hifzul Quran memorization under the institution.',
  '২০২৪',
  1
);

RAISE NOTICE 'Chairman profile saved successfully! Profile ID: %', v_profile_id;

END $$;

-- Verify saved data
SELECT id, name_bn, designation_bn, phone_primary, status FROM public.chairman_profiles ORDER BY created_at DESC LIMIT 1;
