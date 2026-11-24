import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'লগইন সেবার কনফিগারেশন অসম্পূর্ণ। কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।' }, { status: 503 });
  try {
    const { role, identifier, password } = await request.json();
    if (!['teacher', 'student'].includes(role) || typeof identifier !== 'string' || typeof password !== 'string' || identifier.length > 100 || password.length > 200 || !identifier.trim() || !password) {
      return NextResponse.json({ error: 'লগইনের তথ্য সঠিক নয়।' }, { status: 400 });
    }
    const service = createServiceClient();
    const { data: record } = role === 'student'
      ? await service.from('students').select('id,auth_user_id,status').eq('student_id', identifier.trim()).maybeSingle()
      : await service.from('teachers').select('id,auth_user_id').eq('user_id', identifier.trim()).maybeSingle();
    if (!record?.auth_user_id || (role === 'student' && 'status' in record && record.status !== 'active')) {
      return NextResponse.json({ error: 'লগইন ব্যর্থ হয়েছে। আইডি ও পাসওয়ার্ড যাচাই করুন।' }, { status: 401 });
    }
    const client = await createClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: `${role}-${record.id}@portal.rjmm.edu.bd`, password,
    });
    if (error || data.user?.id !== record.auth_user_id) {
      await client.auth.signOut({ scope: 'local' });
      return NextResponse.json({ error: 'লগইন ব্যর্থ হয়েছে। আইডি ও পাসওয়ার্ড যাচাই করুন।' }, { status: 401 });
    }
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'লগইন করা যাচ্ছে না। পরে আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
