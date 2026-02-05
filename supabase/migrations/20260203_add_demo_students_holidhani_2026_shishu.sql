-- Demo data: Holidhani branch, academic year 2026, class "শিশু" - 20 students
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
    father_name_en,
    mother_name_en,
    father_mobile,
    dob,
    department
  ) VALUES
    ('260001', 'Abdullah Ibn Rahman', 'আব্দুল্লাহ ইবন রহমান', 'শিশু', 1, v_branch_id, 2026, 'active', 'Abdur Rahman', 'Amena Khatun', '01711111001', '2020-01-15', 'General'),
    ('260002', 'Ayesha Siddika', 'আয়েশা সিদ্দিকা', 'শিশু', 2, v_branch_id, 2026, 'active', 'Mahmud Hasan', 'Rokeya Begum', '01711111002', '2020-02-10', 'General'),
    ('260003', 'Muhammad Ibrahim', 'মুহাম্মদ ইব্রাহিম', 'শিশু', 3, v_branch_id, 2026, 'active', 'Ibrahim Ali', 'Nurjahan Begum', '01711111003', '2020-03-05', 'General'),
    ('260004', 'Fatema Tuz Zohra', 'ফাতেমা তুজ যোহরা', 'শিশু', 4, v_branch_id, 2026, 'active', 'Kamal Uddin', 'Salma Khatun', '01711111004', '2020-03-22', 'General'),
    ('260005', 'Hasan Al Amin', 'হাসান আল আমিন', 'শিশু', 5, v_branch_id, 2026, 'active', 'Aminur Rahman', 'Shirin Akter', '01711111005', '2020-04-12', 'General'),
    ('260006', 'Mariam Binte Karim', 'মারিয়াম বিনতে করিম', 'শিশু', 6, v_branch_id, 2026, 'active', 'Abdul Karim', 'Ayesha Akter', '01711111006', '2020-04-28', 'General'),
    ('260007', 'Omar Faruk', 'ওমর ফারুক', 'শিশু', 7, v_branch_id, 2026, 'active', 'Faruk Hossain', 'Jannat Ara', '01711111007', '2020-05-17', 'General'),
    ('260008', 'Nusrat Jahan', 'নুসরাত জাহান', 'শিশু', 8, v_branch_id, 2026, 'active', 'Jamal Hossain', 'Nasrin Akter', '01711111008', '2020-06-02', 'General'),
    ('260009', 'Sadia Islam', 'সাদিয়া ইসলাম', 'শিশু', 9, v_branch_id, 2026, 'active', 'Islam Uddin', 'Rabia Begum', '01711111009', '2020-06-19', 'General'),
    ('260010', 'Arif Hossain', 'আরিফ হোসেন', 'শিশু', 10, v_branch_id, 2026, 'active', 'Hossain Ali', 'Kulsum Bibi', '01711111010', '2020-07-08', 'General'),
    ('260011', 'Sumaiya Akter', 'সুমাইয়া আক্তার', 'শিশু', 11, v_branch_id, 2026, 'active', 'Akter Uddin', 'Mina Begum', '01711111011', '2020-07-23', 'General'),
    ('260012', 'Rakib Hasan', 'রাকিব হাসান', 'শিশু', 12, v_branch_id, 2026, 'active', 'Hasan Mahmud', 'Rozina Akter', '01711111012', '2020-08-11', 'General'),
    ('260013', 'Jannatul Ferdous', 'জান্নাতুল ফেরদৌস', 'শিশু', 13, v_branch_id, 2026, 'active', 'Ferdous Ahmed', 'Shahana Begum', '01711111013', '2020-08-29', 'General'),
    ('260014', 'Md. Nayeem Ahmed', 'মোঃ নাঈম আহমেদ', 'শিশু', 14, v_branch_id, 2026, 'active', 'Ahmed Ali', 'Shapla Khatun', '01711111014', '2020-09-13', 'General'),
    ('260015', 'Tasnim Jahan', 'তাসনিম জাহান', 'শিশু', 15, v_branch_id, 2026, 'active', 'Nazmul Hasan', 'Farzana Begum', '01711111015', '2020-09-27', 'General'),
    ('260016', 'Sakib Bin Saif', 'সাকিব বিন সাইফ', 'শিশু', 16, v_branch_id, 2026, 'active', 'Saif Uddin', 'Laila Begum', '01711111016', '2020-10-06', 'General'),
    ('260017', 'Hafsa Binte Noman', 'হাফসা বিনতে নোমান', 'শিশু', 17, v_branch_id, 2026, 'active', 'Noman Hossain', 'Monira Begum', '01711111017', '2020-10-20', 'General'),
    ('260018', 'Yusuf Al Hakim', 'ইউসুফ আল হাকিম', 'শিশু', 18, v_branch_id, 2026, 'active', 'Hakim Ali', 'Tahmina Begum', '01711111018', '2020-11-07', 'General'),
    ('260019', 'Safiya Islam', 'সাফিয়া ইসলাম', 'শিশু', 19, v_branch_id, 2026, 'active', 'Shafiul Islam', 'Hosne Ara', '01711111019', '2020-11-22', 'General'),
    ('260020', 'Imran Hossain', 'ইমরান হোসেন', 'শিশু', 20, v_branch_id, 2026, 'active', 'Imdadul Haque', 'Khadija Begum', '01711111020', '2020-12-09', 'General')
  ON CONFLICT (student_id) DO NOTHING;
END $$;
