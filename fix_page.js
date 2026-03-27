const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/dashboard/students/page.tsx', 'utf8');

const fetchBranchesString = 
    async function fetchBranches() {
      const { data, error } = await supabase.from('branches').select('*').order('id', { ascending: true });
      if (!error && data) {
        setBranches(data);
      }
    }
;

code = code.replace('    useEffect(() => {\n      fetchStudents();', fetchBranchesString + '    useEffect(() => {\n      fetchStudents();\n      fetchBranches();');

code = code.replace('<StudentForm\n          open={isFormOpen}\n          onOpenChange={setIsFormOpen}\n          student={editingStudent}\n          onSuccess={fetchStudents}\n        />', '<StudentForm\n          open={isFormOpen}\n          onOpenChange={setIsFormOpen}\n          student={editingStudent}\n          onSuccess={fetchStudents}\n          branches={branches}\n        />');

fs.writeFileSync('src/app/(admin)/dashboard/students/page.tsx', code);
