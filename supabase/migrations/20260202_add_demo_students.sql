
-- Insert Demo Branch if not exists
INSERT INTO branches (name, address, phone, is_active)
SELECT 'Main Branch', 'Dhaka, Bangladesh', '01700000000', true
WHERE NOT EXISTS (SELECT 1 FROM branches LIMIT 1);

-- Get the branch ID
DO $$
DECLARE
    v_branch_id integer;
BEGIN
    SELECT id INTO v_branch_id FROM branches LIMIT 1;

    -- Insert Academic Classes if not exists
    INSERT INTO academic_classes (branch_id, name, academic_year, is_active, department)
    SELECT v_branch_id, 'প্রথম', 2026, true, 'General'
    WHERE NOT EXISTS (SELECT 1 FROM academic_classes WHERE name = 'প্রথম' AND branch_id = v_branch_id AND academic_year = 2026);

    INSERT INTO academic_classes (branch_id, name, academic_year, is_active, department)
    SELECT v_branch_id, 'দ্বিতীয়', 2026, true, 'General'
    WHERE NOT EXISTS (SELECT 1 FROM academic_classes WHERE name = 'দ্বিতীয়' AND branch_id = v_branch_id AND academic_year = 2026);
    
    -- Insert Demo Students
    -- Class 1 Students
    INSERT INTO students (
        student_id, name_en, name_bn, class_name, roll_no, branch_id, academic_year, status, 
        father_name_en, mother_name_en, father_mobile, dob, department
    ) VALUES 
    ('ST-2026-001', 'Abdullah Al Mamun', 'আব্দুল্লাহ আল মামুন', 'প্রথম', '1', v_branch_id, 2026, 'approved', 'Abdul Karim', 'Fatema Begum', '01711111111', '2018-01-01', 'General'),
    ('ST-2026-002', 'Fatema Tuz Zohra', 'ফাতেমা তুজ জোহরা', 'প্রথম', '2', v_branch_id, 2026, 'approved', 'Rahim Uddin', 'Ayesha Khatun', '01711111112', '2018-02-15', 'General'),
    ('ST-2026-003', 'Md. Hasan Ali', 'মোঃ হাসান আলী', 'প্রথম', '3', v_branch_id, 2026, 'approved', 'Ali Hossain', 'Salma Begum', '01711111113', '2018-03-20', 'General'),
    ('ST-2026-004', 'Nusrat Jahan', 'নুসরাত জাহান', 'প্রথম', '4', v_branch_id, 2026, 'approved', 'Jamal Uddin', 'Nasrin Akter', '01711111114', '2018-04-10', 'General'),
    ('ST-2026-005', 'Omar Faruk', 'ওমর ফারুক', 'প্রথম', '5', v_branch_id, 2026, 'approved', 'Faruk Ahmed', 'Jannat Ara', '01711111115', '2018-05-05', 'General')
    ON CONFLICT (student_id) DO NOTHING;

    -- Class 2 Students
    INSERT INTO students (
        student_id, name_en, name_bn, class_name, roll_no, branch_id, academic_year, status,
        father_name_en, mother_name_en, father_mobile, dob, department
    ) VALUES 
    ('ST-2026-006', 'Sadia Islam', 'সাদিয়া ইসলাম', 'দ্বিতীয়', '1', v_branch_id, 2026, 'approved', 'Islam Uddin', 'Rabia Begum', '01711111116', '2017-01-12', 'General'),
    ('ST-2026-007', 'Arif Hossain', 'আরিফ হোসেন', 'দ্বিতীয়', '2', v_branch_id, 2026, 'approved', 'Hossain Ali', 'Kulsum Bibi', '01711111117', '2017-06-25', 'General'),
    ('ST-2026-008', 'Sumaiya Akter', 'সুমাইয়া আক্তার', 'দ্বিতীয়', '3', v_branch_id, 2026, 'approved', 'Akter Hossain', 'Mina Begum', '01711111118', '2017-08-14', 'General'),
    ('ST-2026-009', 'Rakib Hasan', 'রাকিব হাসান', 'দ্বিতীয়', '4', v_branch_id, 2026, 'approved', 'Hasan Mahmud', 'Rozina Akter', '01711111119', '2017-09-30', 'General'),
    ('ST-2026-010', 'Jannatul Ferdous', 'জান্নাতুল ফেরদৌস', 'দ্বিতীয়', '5', v_branch_id, 2026, 'approved', 'Ferdous Ahmed', 'Shirin Akter', '01711111120', '2017-11-20', 'General')
    ON CONFLICT (student_id) DO NOTHING;

END $$;
