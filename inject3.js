const fs = require('fs');
const filePath = 'D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/students/edit/[id]/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const fetchStudentInfoCode = `
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          // Pre-populate formData
          setFormData({
            ...data,
            academic_year: String(data.academic_year || new Date().getFullYear())
          });
          setStudentIdForDisplay(data.student_id);
          setGeneratedID(data.student_id);
          
          if (data.dob) {
             const [y, m, d] = data.dob.split('-');
             setDobState({ day: String(parseInt(d, 10)), month: months[parseInt(m, 10)-1], year: y });
          }
        }
      } catch (err) {
        console.error('Error fetching student:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchStudentData();
  }, [id]);
`;

code = code.replace('fetchAcademicData();\n    }, []);', 'fetchAcademicData();\n    }, []);\n' + fetchStudentInfoCode);

fs.writeFileSync(filePath, code);
console.log('Injected fetchStudentData');
