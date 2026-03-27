const fs = require('fs');
const code = fs.readFileSync('src/app/(admin)/dashboard/students/edit/[id]/page.tsx', 'utf8');
const fetchStudentInfoCode = \\n  useEffect(() => {\n    const fetchStudentData = async () => {\n      if (!id) return;\n      try {\n        const { data, error } = await supabase.from('students').select('*').eq('id', id).single();\n        if (error) throw error;\n        if (data) {\n          setFormData({ ...data, academic_year: String(data.academic_year || new Date().getFullYear()) });\n          setStudentIdForDisplay(data.student_id);\n          setGeneratedID(data.student_id);\n          if (data.dob) {\n             const [y, m, d] = data.dob.split('-');\n             setDobState({ day: String(parseInt(d, 10)), month: months[parseInt(m, 10)-1], year: y });\n          }\n        }\n      } catch (err) {\n        console.error('Error fetching student:', err);\n      } finally {\n        setIsLoadingData(false);\n      }\n    };\n    fetchStudentData();\n  }, [id]);\n\;
const newCode = code.replace('fetchAcademicData();\\n    }, []);', 'fetchAcademicData();\\n    }, []);\\n' + fetchStudentInfoCode);
if (newCode.includes('fetchStudentData')) {
  fs.writeFileSync('src/app/(admin)/dashboard/students/edit/[id]/page.tsx', newCode, 'utf8');
  console.log('injected');
}
