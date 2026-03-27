const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/students/StudentForm.tsx', 'utf8');

code = code.replace(/branch_id: "1"/g, 'branch_id: ""');
code = code.replace(/branch_id: student.branch_id\?.toString\(\) \|\| "1"/g, 'branch_id: student.branch_id?.toString() || ""');

fs.writeFileSync('src/components/dashboard/students/StudentForm.tsx', code);
