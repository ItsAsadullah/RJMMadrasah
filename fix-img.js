const fs = require('fs');
const file = 'D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/students/edit/[id]/page.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/<Image src=\{formData\.([a-zA-Z_]+)\} alt="([^"]+)" className="w-full h-full object-cover opacity-50" \/>/g, '<Image src={formData.$1} alt="$2" fill sizes="64px" className="object-cover opacity-50" />');

fs.writeFileSync(file, c);
console.log('Done');