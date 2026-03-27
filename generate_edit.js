const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/dashboard/students/add/page.tsx', 'utf8');

// 1. Rename Component and add useParams
code = code.replace(/export default function AdminStudentAdd\(\) \{/, 
  `import { useParams, useRouter } from 'next/navigation';\n\nexport default function AdminStudentEdit() {\n  const params = useParams();\n  const id = params?.id as string;\n  const router = useRouter();\n  const [isLoadingData, setIsLoadingData] = useState(true);`);

// 2. Insert fetch logic
const fetchStudentLogic = `
    useEffect(() => {
      async function fetchStudent() {
        if (!id) return;
        setIsLoadingData(true);
        const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
        if (data && !error) {
           setFormData({
             branch_id: String(data.branch_id || ""),
             department: data.department || "",
             class_name: data.class_name || "",
             roll_number: data.roll_number || data.roll_no || "",
             academic_year: String(data.academic_year || new Date().getFullYear()),
             residential_status: data.residential_status || "non_residential",
             status: data.status || "active",
             guardian_type: data.guardian_type || "father",
             name_bn: data.name_bn || "",
             name_en: data.name_en || "",
             dob: data.dob || "",
             age_info: data.age_info || "",
             birth_reg_no: data.birth_reg_no || "",
             blood_group: data.blood_group || "",
             photo_url: data.photo_url || "",
             birth_cert_url: data.birth_cert_url || "",
             father_alive: data.father_alive ? "yes" : "no",
             father_name_bn: data.father_name_bn || "",
             father_name_en: data.father_name_en || "",
             father_nid: data.father_nid || "",
             father_occupation: data.father_occupation || "",
             father_mobile: data.father_mobile ? data.father_mobile.replace(/^01/, "") : "",
             father_nid_url: data.father_nid_url || "",
             father_photo_url: data.father_photo_url || "",
             mother_alive: data.mother_alive ? "yes" : "no",
             mother_name_bn: data.mother_name_bn || "",
             mother_name_en: data.mother_name_en || "",
             mother_nid: data.mother_nid || "",
             mother_occupation: data.mother_occupation || "",
             mother_mobile: data.mother_mobile ? data.mother_mobile.replace(/^01/, "") : "",
             mother_nid_url: data.mother_nid_url || "",
             mother_photo_url: data.mother_photo_url || "",
             guardian_name: data.guardian_name || "",
             guardian_relation: data.guardian_relation || "",
             guardian_mobile: data.guardian_mobile ? data.guardian_mobile.replace(/^01/, "") : "",
             guardian_nid: data.guardian_nid || "",
             guardian_photo_url: data.guardian_photo_url || "",
             present_division: data.present_division || "",
             present_district: data.present_district || "",
             present_upazila: data.present_upazila || "",
             present_union: data.present_union || "",
             present_village: data.present_village || "",
             present_postcode: data.present_postcode || "",
             perm_division: data.perm_division || "",
             perm_district: data.perm_district || "",
             perm_upazila: data.perm_upazila || "",
             perm_union: data.perm_union || "",
             perm_village: data.perm_village || "",
             perm_postcode: data.perm_postcode || "",
           });
           setStudentIdForDisplay(data.student_id);
        }
        setIsLoadingData(false);
      }
      fetchStudent();
    }, [id]);
`;
code = code.replace(/(fetchAcademicData\(\);\n\s*\}, \[\]\);)/, "$1\n" + fetchStudentLogic);
code = code.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, 'const [isSubmitting, setIsSubmitting] = useState(false);\nconst [studentIdForDisplay, setStudentIdForDisplay] = useState("");');

// 3. Change Submission logic
code = code.replace(/const finalID = await generateStudentId\(\);/, 'const finalID = studentIdForDisplay;'); // Do not generate student ID
code = code.replace(/const \{ error: insertError \} = await supabase\n\s*\.from\('students'\)\n\s*\.insert\(\[studentData\]\);/, 
  'const { error: insertError } = await supabase.from("students").update(studentData).eq("id", id);');

// 4. Change Header Text
code = code.replace(/নতুন শিক্ষার্থী ভর্তি/g, 'শিক্ষার্থীর তথ্য আপডেট');
code = code.replace(/ফর্মটি সতর্কতার সাথে পূরণ করুন/g, 'প্রয়োজনীয় তথ্য সংশোধন করুন');

// 5. Change "Submit" button text
code = code.replace(/ভর্তি সম্পন্ন করুন/g, 'তথ্য আপডেট করুন');

// Fix string issues with data === ...
code = code.replace(/data === 'success' \? "ভর্তি সফল হয়েছে!" : "ভর্তি করতে সমস্যা হয়েছে"/, 'data === "success" ? "আপডেট সফল হয়েছে!" : "আপডেট করতে সমস্যা হয়েছে"');
code = code.replace(/setModalMsg\(studentData.name_bn \+ " এর ভর্তি সফলভাবে সম্পন্ন হয়েছে। "\)/, 'setModalMsg(studentData.name_bn + " এর তথ্য সফলভাবে আপডেট হয়েছে। ")');

// 6. Handle duplicate check differently (exclude current ID)
code = code.replace(/\.eq\('birth_reg_no', regNo\);/g, '.eq("birth_reg_no", regNo).neq("id", id);');

// 7. Add Loading wrapping indicator
code = code.replace(/return \(/, 'if (isLoadingData) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-10 h-10 text-green-600" /></div>;\nreturn (');

fs.writeFileSync('src/app/(admin)/dashboard/students/edit/[id]/page.tsx', code);
console.log('Generated Edit Page');