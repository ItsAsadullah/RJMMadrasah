// Run with: node --env-file=.env.local scripts/provision-portal.cjs
// Never logs passwords, API keys, or guardian contact numbers.
const { createClient } = require('@supabase/supabase-js');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const existing = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    data.users.forEach(user => existing.set(user.email, user.id));
    if (data.users.length < 1000) break;
  }
  const report = { provisioned: 0, alreadyLinked: 0, needsPasswordSetup: [], failures: [] };
  for (const role of ['teacher', 'student']) {
    const table = role === 'student' ? 'students' : 'teachers';
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from(table).select(role === 'student' ? 'id,student_id,guardian_mobile,auth_user_id' : 'id,user_id,password,auth_user_id').order('id').range(offset, offset + 499);
      if (error) throw error;
      for (const row of data) {
        if (row.auth_user_id) { report.alreadyLinked++; continue; }
        const password = role === 'student' ? (row.guardian_mobile || '').replace(/\D/g, '').slice(-11) : row.password;
        if (!password || password.length < 6) { report.needsPasswordSetup.push({ role, id: row.id }); continue; }
        const email = `${role}-${row.id}@portal.rjmm.edu.bd`;
        let authId = existing.get(email);
        if (!authId) {
          const created = await db.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { portal_role: role } });
          if (created.error) { report.failures.push({ role, id: row.id, error: created.error.code }); continue; }
          authId = created.data.user.id;
          existing.set(email, authId);
        }
        const linked = await db.from(table).update({ auth_user_id: authId }).eq('id', row.id).is('auth_user_id', null).select('id');
        if (linked.error || !linked.data?.length) { report.failures.push({ role, id: row.id, error: linked.error?.code || 'link_failed' }); continue; }
        report.provisioned++;
      }
      if (data.length < 500) break;
    }
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length || report.needsPasswordSetup.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
