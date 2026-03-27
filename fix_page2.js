const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/dashboard/students/page.tsx', 'utf8');

code = code.replace(/const handleEdit = \\(student: any\\) => \\{\\s*setEditingStudent\\(student\\);\\s*setIsFormOpen\\(true\\);\\s*\\};/g, 'const handleEdit = (student: any) => { router.push(/dashboard/students/edit/\); };');

fs.writeFileSync('src/app/(admin)/dashboard/students/page.tsx', code);
