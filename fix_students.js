const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/dashboard/students/page.tsx', 'utf8');

code = code.replace('.select("*, branches(name)")', '.select("*")');

const fetchBranchesString = 
    async function fetchBranches() {
      const { data, error } = await supabase.from('branches').select('*').order('id', { ascending: true });
      if (!error && data) {
        setBranches(data);
      }
    }
;

code = code.replace('    useEffect(() => {\n      fetchStudents();', fetchBranchesString + '    useEffect(() => {\n      fetchStudents();\n      fetchBranches();');

fs.writeFileSync('src/app/(admin)/dashboard/students/page.tsx', code);
