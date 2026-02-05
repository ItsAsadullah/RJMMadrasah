-- Demo data (full profile): Holidhani branch, academic year 2026, class "শিশু" - 20 students
DO $$
DECLARE
  v_branch_id integer;
BEGIN
  SELECT id INTO v_branch_id
  FROM public.branches
  WHERE name ILIKE '%হলিধানী%'
  ORDER BY id
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    INSERT INTO public.branches (name, address, phone, is_active)
    VALUES ('হলিধানী বাজার', '', '', true)
    RETURNING id INTO v_branch_id;
  END IF;

  INSERT INTO public.academic_classes (branch_id, name, academic_year, is_active, department)
  SELECT v_branch_id, 'শিশু', 2026, true, 'General'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.academic_classes
    WHERE branch_id = v_branch_id
      AND name = 'শিশু'
      AND academic_year = 2026
  );

  INSERT INTO public.students (
    student_id,
    name_en,
    name_bn,
    class_name,
    roll_no,
    branch_id,
    academic_year,
    status,
    department,
    residential_status,
    guardian_type,
    guardian_name,
    guardian_relation,
    guardian_mobile,
    guardian_nid,
    guardian_photo_url,
    dob,
    age_info,
    birth_reg_no,
    blood_group,
    photo_url,
    birth_cert_url,
    father_alive,
    father_name_bn,
    father_name_en,
    father_nid,
    father_occupation,
    father_mobile,
    father_nid_url,
    father_photo_url,
    mother_alive,
    mother_name_bn,
    mother_name_en,
    mother_nid,
    mother_occupation,
    mother_mobile,
    mother_nid_url,
    mother_photo_url,
    present_division,
    present_district,
    present_upazila,
    present_union,
    present_village,
    present_postcode,
    perm_division,
    perm_district,
    perm_upazila,
    perm_union,
    perm_village,
    perm_postcode
  ) VALUES
    ('260001', 'Abdullah Ibn Rahman', 'আব্দুল্লাহ ইবন রহমান', 'শিশু', '1', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'আব্দুর রহমান', 'পিতা', '01711111001', '1999000000017', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-01-15', '5 বছর 0 মাস 0 দিন', '20260115000000001', 'A+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'আব্দুর রহমান', 'Abdur Rahman', '1999000000017', 'ব্যবসায়ী', '01711111001', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'আমেনা খাতুন', 'Amena Khatun', '1999000000024', 'গৃহিণী', '01721111001', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'নওপাড়া', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'নওপাড়া', '7300'),
    ('260002', 'Ayesha Siddika', 'আয়েশা সিদ্দিকা', 'শিশু', '2', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'মাহমুদ হাসান', 'পিতা', '01711111002', '1999000000031', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-02-10', '4 বছর 11 মাস 0 দিন', '20260210000000002', 'B+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'মাহমুদ হাসান', 'Mahmud Hasan', '1999000000031', 'চাকরিজীবী', '01711111002', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'রোকেয়া বেগম', 'Rokeya Begum', '1999000000048', 'গৃহিণী', '01721111002', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'কাজীরহাট', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'কাজীরহাট', '7300'),
    ('260003', 'Muhammad Ibrahim', 'মুহাম্মদ ইব্রাহিম', 'শিশু', '3', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'ইব্রাহিম আলী', 'পিতা', '01711111003', '1999000000055', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-03-05', '4 বছর 10 মাস 0 দিন', '20260305000000003', 'O+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'ইব্রাহিম আলী', 'Ibrahim Ali', '1999000000055', 'কৃষক', '01711111003', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'নুরজাহান বেগম', 'Nurjahan Begum', '1999000000062', 'গৃহিণী', '01721111003', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'মধুহাটি', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'মধুহাটি', '7300'),
    ('260004', 'Fatema Tuz Zohra', 'ফাতেমা তুজ যোহরা', 'শিশু', '4', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'কামাল উদ্দিন', 'পিতা', '01711111004', '1999000000079', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-03-22', '4 বছর 10 মাস 0 দিন', '20260322000000004', 'AB+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'কামাল উদ্দিন', 'Kamal Uddin', '1999000000079', 'ব্যবসায়ী', '01711111004', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'সালমা খাতুন', 'Salma Khatun', '1999000000086', 'গৃহিণী', '01721111004', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'সাগরনগর', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'সাগরনগর', '7300'),
    ('260005', 'Hasan Al Amin', 'হাসান আল আমিন', 'শিশু', '5', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'আমিনুর রহমান', 'পিতা', '01711111005', '1999000000093', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-04-12', '4 বছর 9 মাস 0 দিন', '20260412000000005', 'A-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'আমিনুর রহমান', 'Aminur Rahman', '1999000000093', 'চাকরিজীবী', '01711111005', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'শিরিন আক্তার', 'Shirin Akter', '1999000000109', 'গৃহিণী', '01721111005', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'চক্রবাড়ি', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'চক্রবাড়ি', '7300'),
    ('260006', 'Mariam Binte Karim', 'মারিয়াম বিনতে করিম', 'শিশু', '6', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'আব্দুল করিম', 'পিতা', '01711111006', '1999000000116', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-04-28', '4 বছর 9 মাস 0 দিন', '20260428000000006', 'B-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'আব্দুল করিম', 'Abdul Karim', '1999000000116', 'কৃষক', '01711111006', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'আয়েশা আক্তার', 'Ayesha Akter', '1999000000123', 'গৃহিণী', '01721111006', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'বকুলতলা', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'বকুলতলা', '7300'),
    ('260007', 'Omar Faruk', 'ওমর ফারুক', 'শিশু', '7', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'ফারুক হোসেন', 'পিতা', '01711111007', '1999000000130', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-05-17', '4 বছর 8 মাস 0 দিন', '20260517000000007', 'O-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'ফারুক হোসেন', 'Faruk Hossain', '1999000000130', 'ব্যবসায়ী', '01711111007', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'জান্নাত আরা', 'Jannat Ara', '1999000000147', 'গৃহিণী', '01721111007', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'দিঘলকান্দি', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'দিঘলকান্দি', '7300'),
    ('260008', 'Nusrat Jahan', 'নুসরাত জাহান', 'শিশু', '8', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'জামাল হোসেন', 'পিতা', '01711111008', '1999000000154', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-06-02', '4 বছর 7 মাস 0 দিন', '20260602000000008', 'AB-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'জামাল হোসেন', 'Jamal Hossain', '1999000000154', 'চাকরিজীবী', '01711111008', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'নাসরিন আক্তার', 'Nasrin Akter', '1999000000161', 'গৃহিণী', '01721111008', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'উপশহর', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'উপশহর', '7300'),
    ('260009', 'Sadia Islam', 'সাদিয়া ইসলাম', 'শিশু', '9', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'ইসলাম উদ্দিন', 'পিতা', '01711111009', '1999000000178', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-06-19', '4 বছর 7 মাস 0 দিন', '20260619000000009', 'A+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'ইসলাম উদ্দিন', 'Islam Uddin', '1999000000178', 'কৃষক', '01711111009', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'রাবিয়া বেগম', 'Rabia Begum', '1999000000185', 'গৃহিণী', '01721111009', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'কদমতলা', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'কদমতলা', '7300'),
    ('260010', 'Arif Hossain', 'আরিফ হোসেন', 'শিশু', '10', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'হোসেন আলী', 'পিতা', '01711111010', '1999000000192', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-07-08', '4 বছর 6 মাস 0 দিন', '20260708000000010', 'B+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'হোসেন আলী', 'Hossain Ali', '1999000000192', 'ব্যবসায়ী', '01711111010', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'কুলসুম বিবি', 'Kulsum Bibi', '1999000000208', 'গৃহিণী', '01721111010', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'জোড়পুল', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'জোড়পুল', '7300'),
    ('260011', 'Sumaiya Akter', 'সুমাইয়া আক্তার', 'শিশু', '11', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'আক্তার উদ্দিন', 'পিতা', '01711111011', '1999000000215', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-07-23', '4 বছর 6 মাস 0 দিন', '20260723000000011', 'O+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'আক্তার উদ্দিন', 'Akter Uddin', '1999000000215', 'চাকরিজীবী', '01711111011', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'মিনা বেগম', 'Mina Begum', '1999000000222', 'গৃহিণী', '01721111011', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'হাটবাজার', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'হাটবাজার', '7300'),
    ('260012', 'Rakib Hasan', 'রাকিব হাসান', 'শিশু', '12', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'হাসান মাহমুদ', 'পিতা', '01711111012', '1999000000239', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-08-11', '4 বছর 5 মাস 0 দিন', '20260811000000012', 'A-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'হাসান মাহমুদ', 'Hasan Mahmud', '1999000000239', 'ব্যবসায়ী', '01711111012', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'রোজিনা আক্তার', 'Rozina Akter', '1999000000246', 'গৃহিণী', '01721111012', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'বটতলা', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'বটতলা', '7300'),
    ('260013', 'Jannatul Ferdous', 'জান্নাতুল ফেরদৌস', 'শিশু', '13', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'ফেরদৌস আহমেদ', 'পিতা', '01711111013', '1999000000253', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-08-29', '4 বছর 5 মাস 0 দিন', '20260829000000013', 'B-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'ফেরদৌস আহমেদ', 'Ferdous Ahmed', '1999000000253', 'চাকরিজীবী', '01711111013', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'শাহানা বেগম', 'Shahana Begum', '1999000000260', 'গৃহিণী', '01721111013', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'নবীনগর', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'নবীনগর', '7300'),
    ('260014', 'Md. Nayeem Ahmed', 'মোঃ নাঈম আহমেদ', 'শিশু', '14', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'আহমেদ আলী', 'পিতা', '01711111014', '1999000000277', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-09-13', '4 বছর 4 মাস 0 দিন', '20260913000000014', 'O+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'আহমেদ আলী', 'Ahmed Ali', '1999000000277', 'কৃষক', '01711111014', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'শাপলা খাতুন', 'Shapla Khatun', '1999000000284', 'গৃহিণী', '01721111014', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'শাপলাতলা', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'শাপলাতলা', '7300'),
    ('260015', 'Tasnim Jahan', 'তাসনিম জাহান', 'শিশু', '15', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'নাজমুল হাসান', 'পিতা', '01711111015', '1999000000291', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-09-27', '4 বছর 4 মাস 0 দিন', '20260927000000015', 'A+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'নাজমুল হাসান', 'Nazmul Hasan', '1999000000291', 'ব্যবসায়ী', '01711111015', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'ফারজানা বেগম', 'Farzana Begum', '1999000000307', 'গৃহিণী', '01721111015', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'তেঁতুলতলা', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'তেঁতুলতলা', '7300'),
    ('260016', 'Sakib Bin Saif', 'সাকিব বিন সাইফ', 'শিশু', '16', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'সাইফ উদ্দিন', 'পিতা', '01711111016', '1999000000314', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-10-06', '4 বছর 3 মাস 0 দিন', '20261006000000016', 'B+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'সাইফ উদ্দিন', 'Saif Uddin', '1999000000314', 'চাকরিজীবী', '01711111016', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'লায়লা বেগম', 'Laila Begum', '1999000000321', 'গৃহিণী', '01721111016', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'মল্লিকপাড়া', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'মল্লিকপাড়া', '7300'),
    ('260017', 'Hafsa Binte Noman', 'হাফসা বিনতে নোমান', 'শিশু', '17', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'নোমান হোসেন', 'পিতা', '01711111017', '1999000000338', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-10-20', '4 বছর 3 মাস 0 দিন', '20261020000000017', 'O-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'নোমান হোসেন', 'Noman Hossain', '1999000000338', 'ব্যবসায়ী', '01711111017', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'মনীড়া বেগম', 'Monira Begum', '1999000000345', 'গৃহিণী', '01721111017', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'মাদ্রাসাপাড়া', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'মাদ্রাসাপাড়া', '7300'),
    ('260018', 'Yusuf Al Hakim', 'ইউসুফ আল হাকিম', 'শিশু', '18', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'হাকিম আলী', 'পিতা', '01711111018', '1999000000352', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-11-07', '4 বছর 2 মাস 0 দিন', '20261107000000018', 'AB+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'হাকিম আলী', 'Hakim Ali', '1999000000352', 'কৃষক', '01711111018', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'তাহমিনা বেগম', 'Tahmina Begum', '1999000000369', 'গৃহিণী', '01721111018', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'শাপলা চত্বর', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'শাপলা চত্বর', '7300'),
    ('260019', 'Safiya Islam', 'সাফিয়া ইসলাম', 'শিশু', '19', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'শফিউল ইসলাম', 'পিতা', '01711111019', '1999000000376', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-11-22', '4 বছর 2 মাস 0 দিন', '20261122000000019', 'A-', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'শফিউল ইসলাম', 'Shafiul Islam', '1999000000376', 'চাকরিজীবী', '01711111019', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'হোসনে আরা', 'Hosne Ara', '1999000000383', 'গৃহিণী', '01721111019', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'কবিরাজপাড়া', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'কবিরাজপাড়া', '7300'),
    ('260020', 'Imran Hossain', 'ইমরান হোসেন', 'শিশু', '20', v_branch_id, 2026, 'active', 'General', 'non_residential', 'father', 'ইমদাদুল হক', 'পিতা', '01711111020', '1999000000390', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', '2020-12-09', '4 বছর 1 মাস 0 দিন', '20261209000000020', 'B+', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png', true, 'ইমদাদুল হক', 'Imdadul Haque', '1999000000390', 'ব্যবসায়ী', '01711111020', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', true, 'খাদিজা বেগম', 'Khadija Begum', '1999000000406', 'গৃহিণী', '01721111020', 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'পুরাতন বাজার', '7300', 'খুলনা', 'ঝিনাইদহ', 'ঝিনাইদহ সদর', 'পোড়াহাটি', 'পুরাতন বাজার', '7300')
  ON CONFLICT (student_id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_bn = EXCLUDED.name_bn,
    class_name = EXCLUDED.class_name,
    roll_no = EXCLUDED.roll_no,
    branch_id = EXCLUDED.branch_id,
    academic_year = EXCLUDED.academic_year,
    status = EXCLUDED.status,
    department = EXCLUDED.department,
    residential_status = EXCLUDED.residential_status,
    guardian_type = EXCLUDED.guardian_type,
    guardian_name = EXCLUDED.guardian_name,
    guardian_relation = EXCLUDED.guardian_relation,
    guardian_mobile = EXCLUDED.guardian_mobile,
    guardian_nid = EXCLUDED.guardian_nid,
    guardian_photo_url = EXCLUDED.guardian_photo_url,
    dob = EXCLUDED.dob,
    age_info = EXCLUDED.age_info,
    birth_reg_no = EXCLUDED.birth_reg_no,
    blood_group = EXCLUDED.blood_group,
    photo_url = EXCLUDED.photo_url,
    birth_cert_url = EXCLUDED.birth_cert_url,
    father_alive = EXCLUDED.father_alive,
    father_name_bn = EXCLUDED.father_name_bn,
    father_name_en = EXCLUDED.father_name_en,
    father_nid = EXCLUDED.father_nid,
    father_occupation = EXCLUDED.father_occupation,
    father_mobile = EXCLUDED.father_mobile,
    father_nid_url = EXCLUDED.father_nid_url,
    father_photo_url = EXCLUDED.father_photo_url,
    mother_alive = EXCLUDED.mother_alive,
    mother_name_bn = EXCLUDED.mother_name_bn,
    mother_name_en = EXCLUDED.mother_name_en,
    mother_nid = EXCLUDED.mother_nid,
    mother_occupation = EXCLUDED.mother_occupation,
    mother_mobile = EXCLUDED.mother_mobile,
    mother_nid_url = EXCLUDED.mother_nid_url,
    mother_photo_url = EXCLUDED.mother_photo_url,
    present_division = EXCLUDED.present_division,
    present_district = EXCLUDED.present_district,
    present_upazila = EXCLUDED.present_upazila,
    present_union = EXCLUDED.present_union,
    present_village = EXCLUDED.present_village,
    present_postcode = EXCLUDED.present_postcode,
    perm_division = EXCLUDED.perm_division,
    perm_district = EXCLUDED.perm_district,
    perm_upazila = EXCLUDED.perm_upazila,
    perm_union = EXCLUDED.perm_union,
    perm_village = EXCLUDED.perm_village,
    perm_postcode = EXCLUDED.perm_postcode;
END $$;
