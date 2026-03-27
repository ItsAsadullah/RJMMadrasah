const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/dashboard/students/add/page.tsx', 'utf8');

// 1. Rename Component and add useParams
code = code.replace(/export default function AdminStudentAdd\(\) \{/, 
  import { useParams, useRouter } from 'next/navigation';\n\nexport default function AdminStudentEdit() {\n  const params = useParams();\n  const id = params?.id as string;\n  const router = useRouter();\n  const [isLoadingData, setIsLoadingData] = useState(true););

// 2. Insert fetch logic
const fetchStudentLogic = 
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
        }
        setIsLoadingData(false);
      }
      fetchStudent();
    }, [id]);
;
code = code.replace(/(fetchAcademicData\(\);\n\s*\}, \[\]\);)/, "\\n" + fetchStudentLogic);


// 3. Change Submission logic
code = code.replace(/await generateStudentId\(\)/, '""'); // Do not generate student ID
code = code.replace(/const \{ error: insertError \} = await supabase.from\('students'\).insert\(\[studentData\]\);/, 
  'const { error: insertError } = await supabase.from("students").update(studentData).eq("id", id);');

// Remove student_id from payload, since we're updating
code = code.replace(/student_id: finalID,/, '// student_id intact\n');

// 4. Change Header Text
code = code.replace(/???? ?????????? ?????/g, '??????????? ???? ?????');
code = code.replace(/?????? ???????? ???? ???? ????/g, '??????????? ???? ?????? ????');

// 5. Change "Submit" button text
code = code.replace(/????? ??????? ????/g, '???? ????? ????');

// Fix string issues with data === ...
code = code.replace(/data === 'success' \? "????? ??? ??????!" : "????? ???? ?????? ??????"/, 'data === "success" ? "????? ??? ??????!" : "????? ???? ?????? ??????"');
code = code.replace(/setModalMsg\(studentData.name_bn \+ " ?? ????? ??????? ??????? ??????? "\)/, 'setModalMsg(studentData.name_bn + " ?? ???? ??????? ????? ??????? ")');

// 6. Handle duplicate check differently (exclude current ID)
code = code.replace(/\.eq\('birth_reg_no', regNo\);/g, '.eq("birth_reg_no", regNo).neq("id", id);');

fs.writeFileSync('src/app/(admin)/dashboard/students/edit/[id]/page.tsx', code);
console.log('Generated Edit Page');
