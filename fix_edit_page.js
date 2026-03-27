const fs = require('fs');
let code = fs.readFileSync('src/app/(admin)/dashboard/students/edit/[id]/page.tsx', 'utf8');

code = code.replace(/useEffect\(\(\) => \{ generateID\(\); \}, \[formData\.academic_year\]\);/, '');
code = code.replace(/setGeneratedID\(newID\);/, '/* setGeneratedID(newID); */');
code = code.replace(/generateID\(\);/g, '/* generateID(); */');

code = code.replace(/\{generatedID\}/g, '{studentIdForDisplay}');

fs.writeFileSync('src/app/(admin)/dashboard/students/edit/[id]/page.tsx', code);
